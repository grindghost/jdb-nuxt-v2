// server/api/pb/profile.get.js

import { getCookie, setCookie, createError } from 'h3';
import { pb, ensureAuthenticated } from '~/server/plugins/pocketbase'; // Import Pocketbase instance
import { validateOrCreateUser, decryptContent } from '~/server/utils/authPB'; // Use adapted helper methods
import sanitizeHtml from 'sanitize-html';

export default defineEventHandler(async (event) => {
  // Get the backpackId from cookies
  const backpackId = getCookie(event, 'backpackId'); 

  // Get the token from query params
  const token = getQuery(event).token; 
  console.log('Token received from the query:', token);

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

    // Decrypt the token
    const decryptedPayload = await decryptContent(token);
    console.log('Decrypted payload:', decryptedPayload);
    const decryptedPayloadJson = JSON.parse(decryptedPayload);
    const { source, project, exercice } = decryptedPayloadJson;

    const projectId = project;
    const activityId = exercice;

    const UnitProfile = {};

    // Get the 'configs' collection for the global config
    const globalConfig = await pb.collection('Configs').getFirstListItem(`name = 'global'`);

    UnitProfile['configs'] = globalConfig;

    // Get the project from the `Projects` collection
    const currentProject = await pb.collection('Projects').getFirstListItem(`id = '${projectId}'`);

    UnitProfile['activity'] = currentProject.profile.activities[exercice];

    delete currentProject.profile.activities;

    UnitProfile['project'] = currentProject;

    const allLocales = await pb.collection('Locales').getFullList(200); // Get all records

    const locale = allLocales.find(
      (locale) => locale.dict && locale.dict.lang === currentProject.profile.lang
    );

    UnitProfile['locale'] = locale.dict || {};

    // Get the historic events
    let matchingEvents = [];

    // Step 4: Query the `history` collection for matching records
    try {
      matchingEvents = await pb.collection('History').getFullList(200, {
        filter: `backpackId = '${decryptedbackpackId}' && courseId = '${projectId}' && activityId = '${activityId}'`,
        sort: '-date', // Sort by creationDate in descending order
      });
    } catch (error) {
      console.warn('No matching records found or query failed:', error.message);
      UnitProfile['history'] = null; // Gracefully handle no matches
    }

    if (matchingEvents.length === 0) {
      UnitProfile['history'] = null; // No matching records found
    } else {

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

    UnitProfile['history'] = sanitizedContent;

    }

    return UnitProfile;
    
  } catch (error) {
    console.error('Error fetching answer:', error.message);
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
});
