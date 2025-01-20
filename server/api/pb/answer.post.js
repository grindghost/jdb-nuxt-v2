import { getCookie, setCookie, readBody } from 'h3';
import { pb, ensureAuthenticated } from '~/server/plugins/pocketbase';
import { encryptContent, decryptContent, validateOrCreateUser } from '~/server/utils/authPB';
import sanitizeHtml from 'sanitize-html'; 

export default defineEventHandler(async (event) => {
  const backpackId = getCookie(event, 'backpackId'); // Get the backpackId from cookies
  const { token, data, date, timeElapsed } = await readBody(event); // Get the request body using readBody

  console.log('Token received from the query:', token);

  await ensureAuthenticated("Save answer"); // Ensure authentication before each request

  try {
    // Step 1: Validate or create user...
    const { valid, backpackId: validBackpackId, decryptedbackpackId } = await validateOrCreateUser(pb, backpackId, event);

    if (!valid) {
      throw createError({ statusCode: 500, message: 'Unable to validate user' });
    }

    // Step 2: Update cookie if a new backpackId was create
    if (validBackpackId !== backpackId) {
      setCookie(event, 'backpackId', validBackpackId, {
        httpOnly: true,
        secure: true,
        sameSite: process.env.SAME_SITE,
        maxAge: 60 * 60 * 24 * 365 * 10, // 10 years in seconds (permanent)
      });
    }

    // Decrypt the token
    const decryptedPayload = await decryptContent(token);
    console.log('Decrypted payload:', decryptedPayload);
    const decryptedPayloadJson = JSON.parse(decryptedPayload);
    const { source, project, exercice } = decryptedPayloadJson;

    const projectId = project;
    const activityId = exercice;

    // Step 3: Sanitize and encrypt the content
    const sanitizedData = sanitizeHtml(data, {
      allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'br', 'ul', 'ol', 'li', 'b', 'i', 'u', 'strike', 'em', 'strong', 's'],
      allowedAttributes: {
        '*': ['class'], // Allow 'class' attribute on all tags
        'li': ['data-list'] // Allow 'data-list' attribute only on 'li' tags
      }
    });
    
    // Encrypt the answer
    const encryptedAnswer = await encryptContent(sanitizedData);

    // Step 4: Save the new historic event in Pocketbase
    const timestamp = new Date().toISOString(); // Format to ISO 8601
    
    const historicEvent = {
      backpackId: decryptedbackpackId,
      courseId: projectId,  
      activityId: activityId, 
      answer: encryptedAnswer,
      date: timestamp,
      timeElapsed: timeElapsed || 0,
    };

    // Save the new historic event in the `history` collection
    await pb.collection('history').create(historicEvent);

    // Step 5: Fetch the last 3 historic events and delete older ones
    const existingEvents = await pb.collection('History').getFullList(200, {
      filter: `backpackId = '${decryptedbackpackId}' && courseId = '${projectId}' && activityId = '${activityId}'`,
      sort: '-date', // Sort by date (newest first)
    });

    if (existingEvents.length > 3) {
      const eventsToDelete = existingEvents.slice(3); // Keep only the last 3, delete the rest
      for (const event of eventsToDelete) {
        await pb.collection('history').delete(event.id);
      }
    }
    return { message: 'Data saved successfully' };
  } catch (error) {
    console.error('Error in /answer endpoint:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to save the answer' });
  }
});
