import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useStatusStore } from './status';

import DOMPurify from 'dompurify';
import Bowser from "bowser"; // To detect browser... (especially for Firefox)

export const useAppStateStore = defineStore('app', () => {
  
  // States
  const unitToken = ref('');
  const unitProfile = ref(null);
  const lang = ref('fr');

  const mode = ref('');
  const editorContent = ref('');

  // Status messages
  const statusStore = useStatusStore();

  // Initialize the status message with "loading"
  const statusMessage = ref('');

  // Timers
  const startTime = ref(0);
  const endTime = ref(0);
  const timeElapsed = ref(0);

  const isLoading = ref(true);
  const isMaintenanceMode = ref(false); // From global config
  const isEndpoint = ref(false); // From global config
  const historyContent = ref(null); // From global config or fetched data
  const overlayVisible = ref(true); // Controls whether the overlay container is visible
  const currentOverlay = ref('loading'); // Tracks the current overlay ('loading', 'completed', 'isEndpoint', 'maintenance', or null)

  // Getters
  const enableEditor = computed(() => !overlayVisible.value && !isLoading.value);

  const GetUnitProfile = async (token, language) => {

    // Assign the token
    unitToken.value = token;

    // Assign the local lang (for the status message) from the token
    lang.value = language;

    // Start the loading status
    isLoading.value = true;

    // Set the status message
    statusMessage.value = statusStore.status[lang.value].loading;

    // Fetch the unit profile
    unitProfile.value = await fetchFromApi(`/pb/profile?token=${encodeURIComponent(token)}`);

    // Start the loading status
    isLoading.value = false;

    // Return the Unit Profile
    return unitProfile.value;
  };

  // Pinia handler to handle API requests (adjusted to include credentials for cookies)  // API request handler using Nuxt's built-in fetch function
  const fetchFromApi = async (endpoint, method = 'GET', body = null, isBinary = false) => {
    try {
      const response = await fetch(`/api${endpoint}`, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json'},
        body: body ? JSON.stringify(body) : null
      });
      if (!response.ok) throw new Error('API error');

      // Check if binary response is expected (like a PDF)
      if (isBinary) {
        return await response.arrayBuffer();  // Return binary data as ArrayBuffer
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return null;
    }
  };

  // Actions
  const SetUnitStateOnArrival = async (profile) => {

    // Make sure the unit profile is not null
    // When the object is passed directly as a static object
    if (unitProfile.value == null) {

      // Assign the profile
      unitProfile.value = profile;

      // Assign the token (assuming its there...)
      unitToken.value = profile.activity.token;
    }

    isMaintenanceMode.value = profile.configs.maintenanceMode;
    isEndpoint.value = profile.activity.isEndpoint;
    historyContent.value = profile.history;

    if (isMaintenanceMode.value) {
      currentOverlay.value = 'maintenance';
    } else if (isEndpoint.value) {
      currentOverlay.value = 'isEndpoint';
    } else if (historyContent.value === null) {
      overlayVisible.value = false;
      currentOverlay.value = null;

      // Start the timer
      startTime.value = performance.now();
      console.log('Timer started for this session.');

    } else {
      mode.value = 'edition';
      currentOverlay.value = 'completed';
      editorContent.value = historyContent.value;
    }

    // Logic to assing a value to the editor content
    if (historyContent.value === null) {
      editorContent.value = unitProfile.value.activity.defaultText;
    } else {
      editorContent.value = historyContent.value;
    }

    isLoading.value = false;

  };

  const hideOverlay = () => {
    overlayVisible.value = false;
    currentOverlay.value = null;

    // Reset the timer, when the editor is shown
    startTime.value = performance.now();
    endTime.value = 0;
    console.log('Timer reset for this session.');

  };

  const showCompletedOverlay = () => {
    overlayVisible.value = true;
    currentOverlay.value = 'completed';
  };

  const submitEditor = async () => {

    // Check if maintenance mode is enabled
    if (isMaintenanceMode.value) {
      return;
    }
    overlayVisible.value = true;
    currentOverlay.value = 'loading';

    try {
      await saveToDatabase();
      currentOverlay.value = 'completed';

      // If the save was successful, set the mode to edition
      mode.value = 'edition';

      return;
      
    } catch (error) {
      console.error('Failed to save:', error);
      currentOverlay.value = 'completed'; // Optionally handle errors differently
    }
  };

  const saveToDatabase = async () => {
  
    // Set the status message
    statusMessage.value = statusStore.status[lang.value].saveAnswer;

    // Get a timestamp, and the time elapsed since the start of the session
    const timestamp = Date.now().toString();
    endTime.value = performance.now();  

    // Get the time difference
    const timeDiff = (endTime.value - startTime.value) / 1000;
    timeElapsed.value = Math.round(timeDiff);

    console.log(timeDiff);
    
    // Sanitize the content on the client
    const sanitizedContent = DOMPurify.sanitize(editorContent.value);

    // Reset the current editor content with the sanitized value (to make sure...)
    editorContent.value = sanitizedContent;

    // Send the sanitized content to the API
    const response = await fetchFromApi('/pb/answer', 'POST', {
      token: unitToken.value,
      data: sanitizedContent,
      date: timestamp,
      timeElapsed: timeElapsed.value,
    });
  
    if (response && response.message === 'Data saved successfully') {
      return;
    } else {
      console.error("Failed to save the answer");
    }
  };

  const downloadFilledPdf = async () => {

    // Check if maintenance mode is enabled
    if (isMaintenanceMode.value) {
      return;
    }
    overlayVisible.value = true;
    currentOverlay.value = 'loading';
  
    // Set the status message
    statusMessage.value = statusStore.status[lang.value].downloadPDF;
  
    try {
      // Send the request without the userId, as it's handled by the server
      const response = await fetchFromApi('/pb/generate-pdf', 'POST', {
        token: unitToken.value,
      }, true);  // Pass true to indicate a binary response (PDF)
  
      if (response) {
        // Extract filename from the unit profile
        const filename = `${unitProfile.value["project"]["profile"]["pdfFilename"]}.pdf`;
        
        // Check if the current browser is Firefox (discover this on 11 december 2022)
        let currentBrowser = Bowser.getParser(window.navigator.userAgent);
  
        if (currentBrowser.parsedResult.browser.name == "Firefox") {
          const blob = new Blob([response], { type: 'application/pdf' });
          var fileURL = await window.URL.createObjectURL(blob);
          let tab = window.open();
          tab.location.href = fileURL;
        } else {
          // Handle binary PDF data for other browsers
          const blob = new Blob([response], { type: 'application/pdf' });
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error('Failed to download filled PDF:', error);
    }
    // Reset the overlay to the endpoint
    currentOverlay.value = 'isEndpoint';
    return;
  };

  const RestoreDefaultText = () => {
    const defaultText = unitProfile.value.activity.defaultText;
    const sanitizedContent = DOMPurify.sanitize(defaultText);
    editorContent.value = sanitizedContent;
  };

  return {
    isLoading,
    isMaintenanceMode,
    isEndpoint,
    historyContent,
    overlayVisible,
    currentOverlay,
    enableEditor,

    unitProfile,
    lang,
    mode,
    statusMessage,
    editorContent,
    unitToken,

    GetUnitProfile,
    SetUnitStateOnArrival,

    hideOverlay,
    showCompletedOverlay,
    submitEditor,
    downloadFilledPdf,
    RestoreDefaultText,
  };
});
