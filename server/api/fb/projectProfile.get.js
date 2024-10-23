import { createError, getQuery } from 'h3'
import { admin } from '~/server/plugins/firebase'

export default defineEventHandler(async (event) => {
  const db = admin.database() // Initialize Firebase database instance
  const { projectId } = getQuery(event) // Get the projectId from query parameters

  try {
    // Fetch the project profile from Firebase
    const snapshot = await db.ref(`Projects/${projectId}`).once('value')

    // If the project profile exists, return it
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      throw createError({
        statusCode: 404,
        statusMessage: 'Project profile not found',
      })
    }
  } catch (error) {
    // Handle any unexpected errors
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }
})
