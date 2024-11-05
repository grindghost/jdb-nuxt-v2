// server/api/pb/answer.get.js

import { getCookie, setCookie, createError } from 'h3';
import { pb, ensureAuthenticated } from '~/server/plugins/pocketbase'; // Import Pocketbase instance
import { validateOrCreateUser, decryptContent } from '~/server/utils/authPB'; // Use adapted helper methods
import sanitizeHtml from 'sanitize-html';

export default defineEventHandler(async (event) => {
  const backpackId = getCookie(event, 'backpackId'); // Get the backpackId from cookies
  const path = getQuery(event).path; // Get the path from query params

  await ensureAuthenticated("Get answer"); // Ensure authentication before each request

  try {
    // Step 1: Validate or create the user
    const { valid, backpackId: validBackpackId, decryptedbackpackId } = await validateOrCreateUser(pb, backpackId, event);

    if (!valid) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Unable to validate user',
      });
    }

    // Step 2: Update the cookie if a new backpackId was created
    if (validBackpackId !== backpackId) {
      setCookie(event, 'backpackId', validBackpackId, {
        httpOnly: true,
        secure: true,
        sameSite: process.env.SAME_SITE,
        maxAge: 60 * 60 * 24 * 365 * 10, // 10 years in seconds (permanent)

      });
    }

    // Step 3: Extract courseId and activityId from the path
    const courseId = path.split('/')[0];
    const activityId = path.split('/')[1];

    let matchingEvents = [];

    // Step 4: Query the `history` collection for matching records
    try {
      matchingEvents = await pb.collection('History').getFullList(200, {
        filter: `backpackId = '${decryptedbackpackId}' && courseId = '${courseId}' && activityId = '${activityId}'`,
        sort: '-date', // Sort by creationDate in descending order
      });
    } catch (error) {
      console.warn('No matching records found or query failed:', error.message);
      return { data: null }; // Gracefully handle no matches
    }

    if (matchingEvents.length === 0) {
      return { data: null }; // No matching records found
    }

    // Step 5: Get the most recent event (first in the sorted list)
    const latestEvent = matchingEvents[0];

    // Step 6: Decrypt and sanitize the answer content
    const decryptedContent = await decryptContent(latestEvent.answer);

    const sanitizedContent = sanitizeHtml(decryptedContent, {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'br',
        'ul', 'ol', 'li', 'b', 'i', 'u', 'strike', 'em', 'strong', 's',
      ],
      allowedAttributes: {
        '*': ['class'],
        'li': ['data-list'],
      },
    });

    return { data: sanitizedContent };
  } catch (error) {
    console.error('Error fetching answer:', error.message);
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
});
