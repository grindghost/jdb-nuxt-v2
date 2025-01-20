// server/api/validate-token.js
import { decryptContent } from '~/server/utils/authPB';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {

  const query = getQuery(event);
  const token = query.token;

  if (!token) {
    throw createError({
      statusCode: 400,
      message: "Missing access token.",
    });
  }

  try {
    const decodedToken = token;
    const decryptedPayload = await decryptContent(decodedToken);

    return decryptedPayload; // Send decrypted data back to client
  } catch (error) {
    console.error("Token decryption failed:", error);
    throw createError({
      statusCode: 400,
      message: "Invalid or failed token decryption.",
    });
  }
});
