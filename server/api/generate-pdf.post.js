import { PDFDocument } from 'pdf-lib';
import emojiStrip from 'emoji-strip';
import { admin } from '~/server/plugins/firebase'

import { getCookie, setCookie, createError } from 'h3';
import { validateOrCreateUser, decryptContent, convertQuillHtmlToText } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Set CORS headers
    setResponseHeaders(event, {
        'Access-Control-Allow-Origin': '*', // Replace '*' with your allowed origin if needed
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });

    if (getMethod(event) === 'OPTIONS') {
        // Handle preflight requests
        return 'OK';
    }
    const db = admin.database() // Initialize Firebase database instance
    const backpackId = getCookie(event, 'backpackId'); // Get the backpackId from the cookie
    const { projectId, projectProfile, remoteConfigs } = await readBody(event); // Get the POST request body

  try {
    // Call the helper function to validate or create a user
    const { valid, backpackId: validbackpackId, decryptedbackpackId } = await validateOrCreateUser(db, backpackId, event);

    if (!valid) {
      throw createError({ statusCode: 500, message: 'Unable to validate user' });
    }

    // Update the cookie if a new backpackId was created
    if (validbackpackId !== backpackId) {
      setCookie(event, 'backpackId', validbackpackId, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
      });
    }

    // Reference user answers in Firebase using the decrypted user key
    const userAnswersRef = db.ref(`Backpacks/${decryptedbackpackId}/answers/${projectId}`);
    const answersSnapshot = await userAnswersRef.once('value');

    if (!answersSnapshot.exists()) {
      throw createError({ statusCode: 404, message: 'No answers found for this project' });
    }

    const activities = answersSnapshot.val();
    const formData = {};

    // Loop through activityIds and fetch last historic event
    for (const [activityId, historicIdsString] of Object.entries(activities)) {
      const historicIds = JSON.parse(historicIdsString);
      const lastHistoricEventId = historicIds[historicIds.length - 1];

      const historySnapshot = await db.ref(`/History/${lastHistoricEventId}`).once('value');
      if (historySnapshot.exists()) {
        const { answer } = historySnapshot.val();
        const decryptedContent = decryptContent(answer);

        // Convert HTML content to plain text while preserving lists and indentation
        const plainTextAnswer = convertQuillHtmlToText(decryptedContent);

        // Remove emojis from the answer
        const noEmojisAnswer = await emojiStrip(plainTextAnswer);
        // const noEmojisAnswer = plainTextAnswer;

        // Map activityId to the plain text content
        formData[activityId] = noEmojisAnswer;
      }
    }


    // Load the blank PDF form (this should be hosted somewhere or available locally)
    const pdfUrl = `${projectProfile.pdfURL}`; // URL or file path to your PDF form
    const response = await fetch(pdfUrl);
    const pdfBytes = await response.arrayBuffer();

    // Load the PDF and fill in the form fields
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Iterate through the form fields and fill them with corresponding data
    const fields = form.getFields();
    fields.forEach((field) => {
      const fieldName = field.getName();
      if (formData[fieldName]) {
        field.setText(formData[fieldName]);
      }
    });


    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();

    // Set headers and return PDF as a binary response
    event.res.setHeader('Content-Type', 'application/pdf');
    event.res.setHeader('Content-Disposition', `attachment; filename=${projectProfile.pdfFilename}.pdf`);
    return new Uint8Array(filledPdfBytes); // Return binary data directly

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw createError({ statusCode: 500, message: 'Failed to generate PDF' });
  }
});
