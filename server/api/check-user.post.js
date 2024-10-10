import { getCookie, setCookie, createError } from 'h3'
import { admin } from '~/server/plugins/firebase'
import { decryptContent, createNewUser } from '~/server/utils/auth'

// Main handler for the /check-user POST request
export default defineEventHandler(async (event) => {
  const db = admin.database() // Firebase database instance
  const backpackId = getCookie(event, 'backpackId') // Read from cookies instead of body
  
  if (backpackId && backpackId !== 'defaultbackpackId') {
    
    try {
      // Decrypt the backpackId to get the userId
      const decryptedBackpackId = decryptContent(backpackId)

      // Validate the decrypted key
      if (!decryptedBackpackId || decryptedBackpackId.length < 20) {
        // Create a new user if validation fails
        const newEncryptedBackpackId = await createNewUser(db)
        setCookie(event, 'backpackId', newEncryptedBackpackId, {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          path: '/',
        })
        return { valid: true, backpackId: newEncryptedBackpackId }
      }

      // Check if the user exists in the Firebase database
      const userSnapshot = await db.ref(`Backpacks/${decryptedBackpackId}`).once('value')

      if (userSnapshot.exists()) {
        return { valid: true }
      } else {
        // If the user doesn't exist, create a new one
        const newEncryptedBackpackId = await createNewUser(db)
        setCookie(event, 'backpackId', newEncryptedBackpackId, {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          path: '/',
        })
        return { valid: true, backpackId: newEncryptedBackpackId }
      }
    } catch (error) {
      console.error('Error verifying user:', error)
      throw createError({ statusCode: 500, statusMessage: 'Failed to verify user' })
    }
  } else {
    try {
      // Handle missing or default backpackId
      const newEncryptedBackpackId = await createNewUser(db)
      setCookie(event, 'backpackId', newEncryptedBackpackId, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/',
      })
      return { valid: true, backpackId: newEncryptedBackpackId }
    } catch (error) {
      console.error('Error initializing user:', error)
      throw createError({ statusCode: 500, statusMessage: 'Failed to initialize user' })
    }
  }
})
