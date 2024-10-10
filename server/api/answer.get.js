import { getCookie, setCookie, createError } from 'h3'
import { admin } from '~/server/plugins/firebase'
import { validateOrCreateUser, decryptContent } from '~/server/utils/auth'
import sanitizeHtml from 'sanitize-html'


export default defineEventHandler(async (event) => {
  const db = admin.database() // Get Firebase database instance
  const backpackId = getCookie(event, 'backpackId') // Get the backpackId from cookies
  const path = getQuery(event).path // Get the path from query params

  try {
    // Validate or create the user
    const { valid, backpackId: validBackpackId, decryptedbackpackId } = await validateOrCreateUser(db, backpackId, event)

    if (!valid) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Unable to validate user',
      })
    }

    // Update the cookie if a new backpackId was created...
    if (validBackpackId !== backpackId) {
      setCookie(event, 'backpackId', validBackpackId, {
        httpOnly: true,
        secure: true,
        sameSite: process.env.SAME_SITE,
        path: '/',
      })
    }

    // Assemble the complete path using the valid decrypted backpackId
    const completePath = `Backpacks/${decryptedbackpackId}/answers/${path}`

    // Fetch the answer from Firebase
    const snapshot = await db.ref(completePath).once('value')

    if (snapshot.exists()) {
      const historicEventsIds = JSON.parse(snapshot.val())
      if (!Array.isArray(historicEventsIds)) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Not a valid array',
        })
      }

      const lastHistoricEventId = historicEventsIds[historicEventsIds.length - 1]
      const historySnapshot = await db.ref(`History/${lastHistoricEventId}`).once('value')

      if (historySnapshot.exists()) {
        // Decrypt the answer content
        const decryptedContent = decryptContent(historySnapshot.val().answer)

        // Sanitize the decrypted content
        const sanitizedContent = sanitizeHtml(decryptedContent, {
            allowedTags: [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', // All heading tags
                'p', 'span', 'br', // Paragraphs
                'ul', 'ol', 'li', // Lists (unordered and ordered, list items)
                'b', 'i', 'u', 'strike', 'em', 'u', 'strong', 's' // Basic formatting (bold, italic, underline, strikethrough)
              ],
            allowedAttributes: {
                '*': ['class'], // Allow 'class' attribute on all tags
                'li': ['data-list'] // Allow 'data-list' attribute only on 'li' tags
              }
          })
  
          return { data: sanitizedContent }

        // return { data: decryptedContent }
      } else {
        throw createError({
          statusCode: 404,
          statusMessage: 'Historic event not found',
        })
      }
    } else {
      return { data: null } // If no data exists, return null
    }
  } catch (error) {
    console.error('Error fetching answer:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }
})
