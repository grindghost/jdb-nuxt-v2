import { createError, getQuery } from 'h3'; // Import utilities from h3
import { pb, ensureAuthenticated } from '~/server/plugins/pocketbase'; // Import Pocketbase instance

export default defineEventHandler(async (event) => {
  
  const { projectId } = getQuery(event); // Get the projectId from query parameters
  
  console.log('Project ID received from the query:', projectId);
  
  // Ensure authentication before each request
  await ensureAuthenticated("Project profile"); 

  try {
    // Step 1: Fetch the project profile from the `Projects` collection
    const project = await pb.collection('Projects').getFirstListItem(`id = '${projectId}'`);

    // Step 2: If the project profile exists
    if (project) {
      // Step 3: Fetch all locales from the `Locales` collection
      const allLocales = await pb.collection('Locales').getFullList(200); // Get all records

      // Step 4: Find the locale where `dict.lang` matches the profile's `lang`
      const locale = allLocales.find(
        (locale) => locale.dict && locale.dict.lang === project.profile.lang
      );

      if (!locale) {
        console.warn(`Locale not found for lang: ${project.profile.lang}`);
      }

      // Step 5: Attach the locale (if found) to the profile
      project.locale = locale.dict || {}; // Use an empty object if locale not found

      // Step 6: Return the enriched profile
      return project;
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
