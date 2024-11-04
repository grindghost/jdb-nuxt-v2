import CryptoJS from 'crypto-js'
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

// Helper function to create a new user in Pocketbase
export const createNewUser = async (pb) => {
  try {
    // Step 1: Retrieve the current collection value from the 'configs' collection
    const globalConfig = await pb.collection('Configs').getFirstListItem(`name = 'global'`);
    const currentCollection = globalConfig.currentCollection;

    console.log(`Current collection: ${currentCollection}`);

    // Step 2: Generate a new backpack ID
    let newBackpackId = generateUniqueID(15); // Generate a unique ID

    // Add 'dev-' prefix if in development mode
    if (process.env.NODE_ENV === 'development') {
      newBackpackId = `dev-${newBackpackId}`;
      
      // Ensure the length of the final ID is exactly 15 characters
      newBackpackId = newBackpackId.slice(0, 15); // Truncate to 15 chars
    }

    // Step 3: Encrypt the new backpack ID
    const encryptedBackpackId = await encryptContent(newBackpackId);
    const creationDate = new Date().toISOString(); // Format to ISO 8601

    // Step 4: Store the new user data in the 'backpacks' collection
    await pb.collection('Backpacks').create({
      id: newBackpackId,
      creationDate: creationDate,
      collection: currentCollection,
    });

    console.log(`New user created with ID: ${newBackpackId}`);
    return encryptedBackpackId;
  } catch (error) {
    console.error('Failed to create new user:', error.message);
    throw new Error('Failed to create new user');
  }
};

// Helper function to validate or create a new user
export const validateOrCreateUser = async (pb, backpackId, req) => {
  const secretKey = process.env.SECRET_KEY;

  try {
    if (backpackId && backpackId !== 'defaultbackpackId') {
      // Step 1: Decrypt the backpackId
      const decryptedbackpackId = await decryptContent(backpackId, secretKey);

      // Validate the decrypted key
      if (!decryptedbackpackId || decryptedbackpackId.length < 15) {
        console.log(decryptedbackpackId.length)
        throw new Error('Invalid user key format');
      }

      // Step 2: Check if the user exists in Pocketbase
      try {
        const user = await pb.collection('Backpacks').getFirstListItem(`id = '${decryptedbackpackId}'`);
        // If the user exists, return the decrypted key
        return { valid: true, backpackId, decryptedbackpackId };
      } catch (error) {
        // If user doesn't exist, create a new one
        console.log('User not found, creating a new one.');
        const newEncryptedbackpackId = await createNewUser(pb);
        const decryptedbackpackId = await decryptContent(newEncryptedbackpackId, secretKey);

        return {
          valid: true,
          backpackId: newEncryptedbackpackId,
          decryptedbackpackId: decryptedbackpackId,
        };
      }
    } else {
      // If no valid backpackId is provided or it's the default, create a new user
      const newEncryptedbackpackId = await createNewUser(pb);
      const decryptedbackpackId = await decryptContent(newEncryptedbackpackId, secretKey);

      return {
        valid: true,
        backpackId: newEncryptedbackpackId,
        decryptedbackpackId: decryptedbackpackId,
      };
    }
  } catch (error) {
    console.error('User validation or creation error:', error.message);
    // In case of an error, create a new user
    const newEncryptedbackpackId = await createNewUser(pb);
    const decryptedbackpackId = await decryptContent(newEncryptedbackpackId, secretKey);
    return {
      valid: true,
      backpackId: newEncryptedbackpackId,
      decryptedbackpackId: decryptedbackpackId,
    };
  }
};

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