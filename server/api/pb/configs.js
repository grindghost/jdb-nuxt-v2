// server/api/pb/configs.js

import { pb } from '~/server/plugins/pocketbase'; // Import Pocketbase instance
import { createError } from 'h3'; // Import createError for error handling

export default defineEventHandler(async (event) => {
  try {
    // Step 1: Query the 'configs' collection for the global config
    const globalConfig = await pb.collection('Configs').getFirstListItem(`name = 'global'`);

    if (globalConfig) {
      // Return the config data as JSON
      return globalConfig;
    } else {
      throw createError({
        statusCode: 404,
        statusMessage: 'Configs not found',
      });
    }
  } catch (error) {
    console.error('Error fetching configs:', error.message);
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
});
