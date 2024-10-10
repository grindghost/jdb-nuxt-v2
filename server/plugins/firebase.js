import admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  })
}

// Export the admin instance for direct use in server routes
export { admin }

export default defineNitroPlugin(() => {
  return {
    provide: {
      db: admin.database() // Providing db instance for potential future client use
    }
  }
})
