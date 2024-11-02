import { getCookie, setCookie, createError } from 'h3';
import { pb } from '~/server/plugins/pocketbase'; // Import Pocketbase instance
import { decryptContent, createNewUser } from '~/server/utils/authPB'; // Use adapted helper methods

// Main handler for the /check-user POST request
export default defineEventHandler(async (event) => {
  const backpackId = getCookie(event, 'backpackId'); // Read from cookies

  console.log('Backpack ID received from the cookie:', backpackId);

  // Validate or create a new user
  try {
    if (backpackId && backpackId !== 'defaultbackpackId') {
      // Step 1: Decrypt the backpackId
      const decryptedBackpackId = await decryptContent(backpackId);

      // Validate the decrypted key
      if (!decryptedBackpackId || decryptedBackpackId.length < 15) {
        // Create a new user if validation fails
        const newEncryptedBackpackId = await createNewUser(pb);
        setCookie(event, 'backpackId', newEncryptedBackpackId, {
          httpOnly: true,
          secure: true,
          sameSite: process.env.SAME_SITE,
          path: '/',
          maxAge: 60 * 60 * 24 * 365 * 10, // 10 years in seconds (permanent)

        });
        return { valid: true, backpackId: newEncryptedBackpackId };
      }

      // Step 2: Check if the user exists in Pocketbase
      try {
        const user = await pb.collection('backpacks').getFirstListItem(`id = '${decryptedBackpackId}'`);
        console.log('Backpack ID retrieved from the db:', user);

        // If the user exists, return valid response
        return { valid: true };
      } catch (error) {
        // If the user doesn't exist, create a new one
        console.log('User not found, creating a new one.');
        const newEncryptedBackpackId = await createNewUser(pb);
        setCookie(event, 'backpackId', newEncryptedBackpackId, {
          httpOnly: true,
          secure: true,
          sameSite: process.env.SAME_SITE,
          path: '/',
          maxAge: 60 * 60 * 24 * 365 * 10, // 10 years in seconds (permanent)

        });
        return { valid: true, backpackId: newEncryptedBackpackId };
      }
    } else {
      // If no valid backpackId is provided, create a new user
      const newEncryptedBackpackId = await createNewUser(pb);
      setCookie(event, 'backpackId', newEncryptedBackpackId, {
        httpOnly: true,
        secure: true,
        sameSite: process.env.SAME_SITE,
        path: '/',
        maxAge: 60 * 60 * 24 * 365 * 10, // 10 years in seconds (permanent)
      });
      return { valid: true, backpackId: newEncryptedBackpackId };
    }
  } catch (error) {
    console.error('Error verifying user:', error.message);
    throw createError({ statusCode: 500, statusMessage: 'Failed to verify user' });
  }
});
