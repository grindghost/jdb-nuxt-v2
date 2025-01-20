import { defineStore } from 'pinia';
import { ref, computed } from 'vue';


export const useAppStateStore = defineStore('app', () => {
  // State

  const unitProfile = ref(null);
  const statusMessage = ref('loading');
  const lang = ref('fr');

  const mode = ref('');
  const editorContent = ref('');

  const isLoading = ref(true);
  const isMaintenanceMode = ref(false); // From global config
  const isEndpoint = ref(false); // From global config
  const historyContent = ref(null); // From global config or fetched data
  const overlayVisible = ref(true); // Controls whether the overlay container is visible
  const currentOverlay = ref('loading'); // Tracks the current overlay ('loading', 'completed', 'download', 'maintenance', or null)

  // Getters
  const enableEditor = computed(() => !overlayVisible.value && !isLoading.value);

  const GetUnitProfile = async (token, language) => {

    // Assign the local lang (for the status message) from the token
    lang.value = language;

    // Start the loading status
    isLoading.value = true;

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
        headers: { 'Content-Type': 'application/json', UserId: 'hello' },
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
    // When the object is passed directly from a static property
    if (unitProfile.value == null) {
      unitProfile.value = profile;
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
  };

  const showCompletedOverlay = () => {
    overlayVisible.value = true;
    currentOverlay.value = 'completed';
  };

  const submitEditor = async (editorContent) => {
    mode.value = 'edition';
    overlayVisible.value = true;
    currentOverlay.value = 'loading';
    try {
      await saveToDatabase(editorContent);
      currentOverlay.value = 'completed';
      
    } catch (error) {
      console.error('Failed to save:', error);
      currentOverlay.value = 'completed'; // Optionally handle errors differently
    }
  };

  const saveToDatabase = async (content) => {
    return new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate saving
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

    GetUnitProfile,
    SetUnitStateOnArrival,

    hideOverlay,
    showCompletedOverlay,
    submitEditor,
  };
});
