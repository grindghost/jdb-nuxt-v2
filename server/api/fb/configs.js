import { admin } from '~/server/plugins/firebase'

export default defineEventHandler(async (event) => {
    
  // Get the Firebase database instance from the plugin
  const db = admin.database() // Use Firebase database directly
    try {
      const snapshot = await db.ref('Configs/Global').once('value')
      if (snapshot.exists()) {
        return snapshot.val() // Send the config data as a JSON response
      } else {
        throw createError({
          statusCode: 404,
          statusMessage: 'Configs not found'
        })
      }
    } catch (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message
      })
    }
  })
  