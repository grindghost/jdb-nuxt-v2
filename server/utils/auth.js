import CryptoJS from 'crypto-js'
import { admin } from '~/server/plugins/firebase'
import { randomBytes } from 'crypto';
import * as cheerio from 'cheerio';

export const generateUniqueID = (idLength) => {
  return randomBytes(Math.ceil(idLength / 2)) // Generate enough random bytes
    .toString('hex') // Convert bytes to hexadecimal string
    .slice(0, idLength); // Trim to the desired length
};

// Helper function to encrypt content
export const encryptContent = async (content) => {
  return CryptoJS.AES.encrypt(content, process.env.SECRET_KEY).toString()
}

// Helper function to decrypt content
export const decryptContent = async (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, process.env.SECRET_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// Helper function to create a new user in Firebase
export const createNewUser = async (db) => {
  try {
    // Retrieve the current collection value from Firebase
    const snapshot = await db.ref('Configs/Global/currentCollection').once('value')
    const currentCollection = snapshot.val()

    // Generate a new user key
    let newBackpackId = db.ref().child('Backpacks').push().key

    // Add 'dev-' prefix if in development mode
    if (process.env.NODE_ENV === 'development') {
      newBackpackId = `dev-${newBackpackId}`
    }

    const encryptedBackpackId = await encryptContent(newBackpackId)

    // Store the new user data in Firebase
    await db.ref(`Backpacks/${newBackpackId}`).set({
      creationDate: Date.now(),
      collection: currentCollection,
    })

    return encryptedBackpackId
  } catch (error) {
    console.error('Failed to create new user:', error)
    throw new Error('Failed to create new user')
  }
}

// Helper function to validate user or create a new one
export const validateOrCreateUser = async (db, backpackId, req) => {
  const secretKey = process.env.SECRET_KEY;

  if (backpackId && backpackId !== 'defaultbackpackId') {
    try {
      // Decrypt the backpackId
      const decryptedbackpackId = await decryptContent(backpackId, secretKey);

      // Validate the decrypted key
      if (!decryptedbackpackId || decryptedbackpackId.length < 20) {
        throw new Error("Invalid user key format");
      }

      // Check if the user exists in the database
      const userSnapshot = await db.ref(`Backpacks/${decryptedbackpackId}`).once('value');

      if (userSnapshot.exists()) {
        // User exists, return the decrypted key
        return { valid: true, backpackId, decryptedbackpackId };
      } else {
        // User doesn't exist, create a new user
        const newEncryptedbackpackId = await createNewUser(db);
        return { valid: true, backpackId: newEncryptedbackpackId, decryptedbackpackId: decryptContent(newEncryptedbackpackId, secretKey) };
      }
    } catch (error) {
      console.error("User key validation error:", error.message);
      // If error occurs, create a new user
      const newEncryptedbackpackId = await createNewUser(db);
      return { valid: true, backpackId: newEncryptedbackpackId, decryptedbackpackId: decryptContent(newEncryptedbackpackId, secretKey) };
    }
  } else {
    // If no backpackId or it's the default, create a new user
    const newEncryptedbackpackId = await createNewUser(db);
    return { valid: true, backpackId: newEncryptedbackpackId, decryptedbackpackId: decryptContent(newEncryptedbackpackId, secretKey) };
  }
}

export const convertQuillHtmlToText = (quillHtml) => {
  const $ = cheerio.load(quillHtml);
  let result = '';
  
  // Tracking numbering for different indentation levels
  const listNumbering = { 0: 0, 1: 0, 2: 0, 3: 0 }; 

  // Function to generate the ordered list style based on depth
  const getOrderedListBullet = (level, index) => {
    const numberingStyles = ['1.', 'a.', 'i.'];  // Add more styles as needed
    const styleIndex = level % numberingStyles.length;
    return numberingStyles[styleIndex].replace('1', index + 1).replace('a', String.fromCharCode(97 + index)).replace('i', toRoman(index + 1));
  };

  // Convert index to Roman numerals for deeper levels (you can extend this for larger numbers if needed)
  const toRoman = (num) => {
    const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let roman = '', i;
    for ( i in lookup ) {
      while ( num >= lookup[i] ) {
        roman += i;
        num -= lookup[i];
      }
    }
    return roman;
  };

  $('body').children().each((i, el) => {
    const tag = $(el).prop('tagName').toLowerCase();
    
    if (tag === 'h2' || tag === 'p') {
      // Handle headings and paragraphs
      result += $(el).text() + '\n\n';
    } else if (tag === 'ol' || tag === 'ul') {
      // Handle lists
      $(el).children().each((j, li) => {
        // Detect the indentation level
        const indentLevel = $(li).hasClass('ql-indent-1') ? 1 :
                            $(li).hasClass('ql-indent-2') ? 2 :
                            $(li).hasClass('ql-indent-3') ? 3 : 0;

        // Increment list numbering for this indentation level
        listNumbering[indentLevel] = listNumbering[indentLevel] + 1;

        // Reset numbering for deeper levels
        for (let level = indentLevel + 1; level < 4; level++) {
          listNumbering[level] = 0;
        }

        // Determine the bullet type (ordered or unordered)
        const bullet = tag === 'ol' 
          ? getOrderedListBullet(indentLevel, listNumbering[indentLevel] - 1) 
          : '•';

        // Create indentation based on the level
        const indentation = '  '.repeat(indentLevel);
        result += `${indentation}${bullet} ${$(li).text()}\n`;
      });
      result += '\n';
    }
  });

  return result;
}