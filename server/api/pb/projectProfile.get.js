import { createError, getQuery } from 'h3'; // Import utilities from h3
import { pb } from '~/server/plugins/pocketbase'; // Import Pocketbase instance

export default defineEventHandler(async (event) => {
  const { projectId } = getQuery(event); // Get the projectId from query parameters

  try {
    // Step 1: Fetch the project profile from the `Projects` collection
    const projectProfile = await pb.collection('Projects').getFirstListItem(`id = '${projectId}'`);

    // Step 2: If the project profile exists, proceed
    if (projectProfile) {

      // Step 3: Extract the `profile` JSON field
      let profile = projectProfile.profile;

      // Step 4: Fetch all locales from the `Locales` collection
      const allLocales = await pb.collection('Locales').getFullList(200); // Get all records

      // Step 5: Find the locale where `dict.lang` matches the profile's `lang`
      const locale = allLocales.find(
        (locale) => locale.dict && locale.dict.lang === projectProfile.profile.lang
      );

      if (!locale) {
        console.warn(`Locale not found for lang: ${projectProfile.lang}`);
      }

      // Step 6: Attach the locale (if found) to the profile
      profile.locale = locale.dict || {}; // Use an empty object if locale not found
      
      // Step 7: Return the enriched profile
      return profile;
    } else {
      throw createError({
        statusCode: 404,
        statusMessage: 'Project profile not found',
      });
    }
  } catch (error) {
    // Handle any unexpected errors
    console.error('Error fetching project profile:', error.message);
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
});
