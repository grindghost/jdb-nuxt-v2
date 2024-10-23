import { getCookie, setCookie, readBody } from 'h3'
import { admin } from '~/server/plugins/firebase'
import { validateOrCreateUser, encryptContent, generateUniqueID } from '~/server/utils/auth'
import sanitizeHtml from 'sanitize-html' // Import sanitize-html for sanitization


export default defineEventHandler(async (event) => {
  const db = admin.database() // Initialize Firebase database instance
  const backpackId = getCookie(event, 'backpackId') // Get the backpackId from cookies
  const { path, data, date, timeElapsed } = await readBody(event) // Get the request body using readBody
  
  try {
    // Validate the user or create a new one
    const { valid, backpackId: validBackpackId, decryptedbackpackId } = await validateOrCreateUser(db, backpackId, event)

    if (!valid) {
      throw createError({ statusCode: 500, message: 'Unable to validate user' })
    }

    // Update the cookie if a new backpackId was created
    if (validBackpackId !== backpackId) {
      setCookie(event, 'backpackId', validBackpackId, {
        httpOnly: true,
        secure: true,
        sameSite: process.env.SAME_SITE,
      })
    }

    // Assemble the complete path using the valid decrypted backpackId
    const completePath = `Backpacks/${decryptedbackpackId}/answers/${path}`

    const timestamp = date || Date.now().toString()


    // Sanitize the 'data' (content) field before saving it
    const sanitizedData = sanitizeHtml(data, {
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

    // const encryptedAnswer = encryptContent(data)

    // Encrypt the sanitized content
    const encryptedAnswer = encryptContent(sanitizedData)

    const historic_event = {
      answer: encryptedAnswer,
      date: timestamp,
      timeElapsed: timeElapsed || 0,
    }

    const newKey = `${decryptedbackpackId}-${generateUniqueID(17)}`
    await db.ref(`History/${newKey}`).set(historic_event)

    // Update historic events array
    const pathSnapshot = await db.ref(completePath).once('value')
    let historicEventsIds = []
    if (pathSnapshot.exists()) {
      historicEventsIds = JSON.parse(pathSnapshot.val())
    }
    historicEventsIds.push(newKey)

    // Keep only the last 3 historic events
    if (historicEventsIds.length > 3) {
      const idsToRemove = historicEventsIds.splice(0, historicEventsIds.length - 3)
      for (const id of idsToRemove) {
        await db.ref(`History/${id}`).remove()
      }
    }

    const historicEventsIdsString = JSON.stringify(historicEventsIds)
    await db.ref(completePath).set(historicEventsIdsString)

    return { message: 'Data saved successfully' }
  } catch (error) {
    console.error('Error in /answer endpoint:', error.message)
    throw createError({ statusCode: 500, message: 'Failed to save the answer' })
  }
})
