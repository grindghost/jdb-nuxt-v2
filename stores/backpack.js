import { defineStore } from 'pinia';
import DOMPurify from 'dompurify';
import Bowser from "bowser"; // To detect browser... (especially for Firefox)
import { useStatusStore } from '/stores/status';
import { RemovePageFromEmptyDocumentError } from 'pdf-lib';
import { load } from 'cheerio';

export const useMainStore = defineStore('main', () => {

  const statusStore = useStatusStore();
  const isAppVisible = ref(false); // Default to false

  const unitIsReady = ref(false);

  const path = ref(""); 
  const backpack = ref(""); 
  
  const answer = ref("");
  const startTime = ref(0);
  const endTime = ref(0);
  const timeElapsed = ref(0);
  
  const mode = ref("");
  
  const completedOverlay = ref(false);
  const loadingStatus = ref(true);

  const useCustomPlaceholder = ref(false);
  const placeholder = ref("");

  const defaultText = ref("");
  
  const useCharactersLimit = ref(false);
  const maxCharAllowed = ref(0);

  const endpoint = ref(false);
  const coverLoaded = ref(false);

  const remoteConfigs = ref({"maintenanceMode": false});
  const localConfigs = ref({}); 
  const projectProfile = ref({});
  const localeDict = ref({});
  const apiLiveStatus = ref(true);
  const statusMessage = ref(statusStore.status[statusStore.locale].loading);

// Pinia handler to handle API requests (adjusted to include credentials for cookies)  // API request handler using Nuxt's built-in fetch function
  const fetchFromApi = async (endpoint, method = 'GET', body = null, isBinary = false) => {
    try {
      const response = await fetch(`/api${endpoint}`, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
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

  const PingApi = async () => {
    // console.log('API is live');
    const response = await fetchFromApi('/ping');
    if (response) {
      remoteConfigs.value.maintenanceMode = false;
      return true;
    }
    return false;
  };

  
  const GetRemoteConfigs = async () => {

    // Set the status message
    statusMessage.value = statusStore.status[statusStore.locale].getRemoteConfigs;

    // Check if the API is live before proceeding
    if (!apiLiveStatus.value) return
  
    // Use your custom fetch handler
    const response = await fetchFromApi('/pb/configs')
  
    // If the response is valid, update the `remoteConfigs`
    if (response) {
      remoteConfigs.value = response
    } else {
      console.error('Failed to fetch remote configs')
    }
  }

  const GetProjectProfileFromDatabase = async () => {
    if (!apiLiveStatus.value) return;

    // Set the status message
    statusMessage.value = statusStore.status[statusStore.locale].getProjectProfile;

    path.value = `${localConfigs.value["projectId"]}/${localConfigs.value["excerciceId"]}`;

    const response = await fetchFromApi(`/pb/projectProfile?projectId=${localConfigs.value["projectId"]}`);
    if (response) {
      
      projectProfile.value = response;

      localeDict.value = projectProfile.value["locale"]
      endpoint.value = projectProfile.value["activities"][`${localConfigs.value["excerciceId"]}`]["isEndpoint"];
      
      // Get the html value of the default text
      // Since its html string, make sure to sanitize it
      const dirtyDefaultText = projectProfile.value["activities"][`${localConfigs.value["excerciceId"]}`]["defaultText"];

      // Sanitize the default text, and assign it to the defaultText ref
      defaultText.value = DOMPurify.sanitize(dirtyDefaultText, {FORBID_TAGS: ['img']});

      // References:
      // could also use this to define allowed tags: {ALLOWED_TAGS: ['p', 'strong']}

      // Check if the exercice have a custom placeholder value
      useCustomPlaceholder.value = projectProfile.value["activities"][`${localConfigs.value["excerciceId"]}`]["useCustomPlaceholder"];

      // Get the custom placeholder value
      placeholder.value = projectProfile.value["activities"][`${localConfigs.value["excerciceId"]}`]["placeholder"];

      // Check if the exercice have a maxCharAllowed value
      useCharactersLimit.value = projectProfile.value["activities"][`${localConfigs.value["excerciceId"]}`]["useCharactersLimit"];

      // Get the maxCharAllowed value
      maxCharAllowed.value = projectProfile.value["activities"][`${localConfigs.value["excerciceId"]}`]["maxCharactersAllowed"];
    }
  };

// Pinia store method to get answers from Firebase RTDB
const GetAnswerFromDatabase = async () => {
  if (!apiLiveStatus.value) return;

  if (remoteConfigs.value.maintenanceMode == true) {
    loadingStatus.value = false;
    unitIsReady.value = true;
    return
  };

  // Set the status message
  statusMessage.value = statusStore.status[statusStore.locale].getAnswer;

  try {
    // Call the backend endpoint to get the answer
    const response = await fetchFromApi(`/pb/answer?path=${encodeURIComponent(path.value)}`);

    if (response && response.data) {
      // Sanitize the content
      const sanitizedContent = DOMPurify.sanitize(response.data);
      answer.value = sanitizedContent;
      mode.value = "edition";
      completedOverlay.value = true;
    } else {
      answer.value = defaultText.value;
      mode.value = "creation";
    }

  } catch (error) {
    console.error('Error fetching answer:', error);
    answer.value = defaultText.value;
    mode.value = "creation";
  }

  // Hide the loading indicator
  if (endpoint.value == false) {
    loadingStatus.value = false;
  }
  
  // Define the placeholder here to avoid FOUC
  placeholder.value = localeDict.value["placeholder"]; 
  if (useCustomPlaceholder.value) {
    placeholder.value = projectProfile.value["activities"][`${localConfigs.value["excerciceId"]}`]["customPlaceholder"];
  } else {
    placeholder.value = localeDict.value["placeholder"];
  }
};


const SaveAnswer = async () => {
  if (!apiLiveStatus.value) return;
  if (remoteConfigs.value.maintenanceMode) return;

  // Set the status message
  statusMessage.value = statusStore.status[statusStore.locale].saveAnswer;

  // Show the loading indicator
  loadingStatus.value = true;

  const timestamp = Date.now().toString();
  endTime.value = performance.now();
  const timeDiff = (endTime.value - startTime.value) / 1000;
  timeElapsed.value = Math.round(timeDiff);

  const sanitizedContent = DOMPurify.sanitize(answer.value);

  // Send the answer to the API
  const response = await fetchFromApi('/pb/answer', 'POST', {
    path: path.value,
    data: sanitizedContent,
    date: timestamp,
    timeElapsed: timeElapsed.value,
  });

  if (response && response.message === 'Data saved successfully') {

    setTimeout(() => {
      
      // Hide the loading indicator
      loadingStatus.value = false;

      completedOverlay.value = true;
      mode.value = "edition";
      startTime.value = performance.now();
      endTime.value = 0;

      // Send the message to the parent window to close
      closeWindow();

    }, 1000);



  } else {
    console.error("Failed to save the answer");
  }
};


const DownloadFilledPdf = async () => {
  if (!apiLiveStatus.value) return;

  // Set the status message for the pdf download
  statusMessage.value = statusStore.status[statusStore.locale].downloadPDF;

  try {
    loadingStatus.value = true;

    // Send the request without the userId, as it's handled by the server
    const response = await fetchFromApi('/pb/generate-pdf', 'POST', {
      projectId: localConfigs.value["projectId"],
      projectProfile: projectProfile.value,
      remoteConfigs: remoteConfigs.value
    }, true);  // Pass true to indicate a binary response (PDF)

    if (response) {
      // Extract filename from the Content-Disposition header
      const filename = `${projectProfile.value["pdfFilename"]}.pdf`;

      // Check if the current browser is Firefox (11 décembre 2022)
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

  loadingStatus.value = false;
};



const ValidateUser = async (source) => {

  try {
    const response = await fetchFromApi('/pb/login', 'POST', { source });

    if (!response || !response.valid) {
      throw new Error('User validation failed');
    }

    return response;

  } catch (error) {
    console.error('Validation failed:', error);
    return { valid: false };
  }
}; 

  const RestoreDefaultText = () => {
    answer.value = defaultText.value;
  };


  const closeWindow = () => {
    // Check if the current window has a parent frame
    if (window.parent !== window) {
      // Send a message to the parent frame
      window.parent.postMessage(
        {
          action: 'closeWindow',
          source: 'jdb' // Optional identifier for the message
        },
        '*' // Replace '*' with the parent frame's origin for security
      );
    } else {
      console.warn('No parent frame detected. This window cannot send a message to a parent.');
    }
  }

 
  return {
    isAppVisible,
    path,
    backpack,
    answer,
    startTime,
    endTime,
    timeElapsed,
    mode,
    completedOverlay,
    loadingStatus,
    apiLiveStatus,
    remoteConfigs,
    placeholder,
    defaultText,
    maxCharAllowed,
    useCharactersLimit,
    endpoint,
    coverLoaded,
    projectProfile,
    localConfigs,
    localeDict,
    statusMessage,
    unitIsReady,
    PingApi,
    GetRemoteConfigs,
    GetAnswerFromDatabase,
    SaveAnswer,
    GetProjectProfileFromDatabase,
    DownloadFilledPdf,
    ValidateUser,
    RestoreDefaultText,
  };
});

// Hot module replacement
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot));
}