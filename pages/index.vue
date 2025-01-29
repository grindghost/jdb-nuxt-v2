<template>
  
  <!-- Main container -->
  <div
      v-if="store.isAppVisible"
      class="wrapper"
      :class="`theme-${computedTheme}`"
  > 
      <!-- Overlays container-->
      <div class="overlays-container noselect" v-if="store.loadingStatus || store.completedOverlay || store.endpoint || store.remoteConfigs.maintenanceMode">  
        <LoadingOverlay />
        <ConfirmationRevisitOverlay />
        <GlobalMaintenanceOverlay v-if="store.unitIsReady" />
        <EndpointOverlay />
      </div>

      <!-- Activity container -->
      <div
        class="acitivity-container"
        :class="store.completedOverlay == true || store.endpoint == true || store.remoteConfigs.maintenanceMode == true || store.loadingStatus == true ? 'transparent' : ''">
        
        <!-- Quill editor -->
        <QuillEditor v-model:content="store.answer" contentType="html" :placeholder="store.placeholder" />
        
        <!-- Footer -->
        <div class="footer noselect">

          <div class="maxchar">
            
            <span id="count">
              <strong>{{ answerLength }}</strong>
              {{ store.useCharactersLimit == true ? "" : store.localeDict?.editorView?.charCount || "" }}
            </span>
            
            {{
              store.useCharactersLimit == true
                ? " / " + store.maxCharAllowed + " " + (store.localeDict?.editorView?.charCount || "") + " " + (store.localeDict?.editorView?.allowedChar || "")
                : ""
            }}
          </div>

          <div class="options-container">
            <span class="options" @click="store.RestoreDefaultText">
              {{ store.localeDict?.editorView?.restoreDefaultText || "" }}
            </span>
          </div>

          <!-- Submit button -->
          <button 
              @click="store.SaveAnswer" 
              :disabled="isAnswerEmpty || store.endpoint || store.completedOverlay || store.answer === store.defaultText"
          >
              {{ store.mode === "edition" 
                  ? store.localeDict?.editorView?.buttons?.correct || "..." 
                  : store.localeDict?.editorView?.buttons?.submit || "..." 
              }}
          </button>
        </div>
      </div>

    </div>

  </template>
  
  <script setup>
    import { useMainStore } from '/stores/backpack';
    import { useStatusStore } from '/stores/status';
    import { initializeScaler } from '~/utils/scaler';

    const store = useMainStore();
    const statusStore = useStatusStore();
    const config = useRuntimeConfig();

    // Middleware to guard the access, and provide access
    // definePageMeta({
    //   middleware: 'validate-access',
    // });
    
    const isAnswerEmpty = ref(true);
    const answerLength = ref(0);

    const stripHtml = (html) => {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent || div.innerText || '';
    };

    const checkIfEmpty = (html) => {
      const textContent = stripHtml(html).trim();
      answerLength.value = textContent.length;
      return textContent.length === 0;
    };

    const computedTheme = computed(() => {
      if (store.projectProfile.useCustomTheme == false) {
        if (store.projectProfile.theme == "brio" || store.projectProfile.theme == "ul-yellow" || store.projectProfile.theme == "ul-red") {
          // return the actual theme
          return store.projectProfile.theme;  
        } 
      } else {
      // Return the default theme, with accent color
      const root = document.documentElement;
      root.style.setProperty("--color-theme", store.projectProfile.customTheme);
      root.style.setProperty("--color-theme-light", store.projectProfile.customTheme);
      root.style.setProperty("--color-theme-accent", store.projectProfile.customTheme);
      root.style.setProperty("--color-theme-button", store.projectProfile.customTheme);
      root.style.setProperty("--color-theme-button-hover", store.projectProfile.customTheme);
      return "default";
    }
  });

  onMounted(async () => {

    initializeScaler();
    
  // Add a small delay to allow cookies to be restored after sleep
  // await new Promise(resolve => setTimeout(resolve, 500));

  store.loadingStatus = true;
  store.isAppVisible = true;

  // Step 1: Get the language from the query parameters
  const queryParams = new URLSearchParams(window.location.search); 
  const lang = queryParams.get('lang') || 'fr';

  if (lang !== 'fr' && lang !== 'en') {
    console.error('Invalid language:', lang);
    statusStore.locale = 'fr';
  } else {
    statusStore.locale = lang;
  }

  // Step 2: Validate referrer (only on the client side) 
  if (process.client && process.env.NODE_ENV === 'production' ) {
    
    // Get the status message from the local store
    store.statusMessage = statusStore.status[lang].referrerValidation;
    
    const referrer = document.referrer || "";

    const isAllowedReferrer = config.public.allowedReferrerDomains.some(domain =>
          referrer.startsWith(domain)
   );

    if (!isAllowedReferrer) {
      // console.error('Invalid referrer:', referrer);
      document.body.innerHTML = "🔓 Invalid referrer (4)"; // Lock emoji for unauthorized access
      store.loadingStatus = false;
      store.isAppVisible = false; // Ensure app is not displayed
      return;
    }
  }

    // Ping the API to check if it's live...
    store.statusMessage = statusStore.status[lang].apiPing;

    const apiIsLive = await store.PingApi();
    if (!apiIsLive) {
      document.body.innerHTML = "🔓 API isn't live.";
      store.loadingStatus = false;
      store.isAppVisible = false; // Ensure app is not displayed
      return;
    }

  // Step 3: Retrieve token using URLSearchParams
  store.statusMessage = statusStore.status[lang].getToken;
  const token = queryParams.get('token');

  if (!token) {
    // console.error('Missing access token.');
    document.body.innerHTML = "🔓 Missing token"; // Lock emoji for missing token
    store.loadingStatus = false;
    store.isAppVisible = false; // Ensure app is not displayed
    return;
  }

  try {
    // Step 4: Validate and decrypt the token with the server
    store.statusMessage = statusStore.status[lang].decodeToken;
    const decryptedPayload = await $fetch('/api/validateToken', {
      method: 'GET',
      params: { token },
    });

    const decryptedPayloadJson = JSON.parse(decryptedPayload);
    const { source, project, exercice } = decryptedPayloadJson;

    // Step 5: Validate decrypted parameters
    if (!source || source !== config.public.allowedSource || !project || !exercice) {
      document.body.innerHTML = "🔓 Invalid or missing parameters in the token."; // Lock emoji for invalid parameters
      store.loadingStatus = false;
      store.isAppVisible = false; // Ensure app is not displayed
      return;
    }

    // Step 6: Validate the user with the backend
    store.statusMessage = statusStore.status[lang].loginUser;
    const response = await store.ValidateUser(source);
    if (!response || !response.valid) {
      document.body.innerHTML = "🔓 User validation failed."; // Lock emoji for invalid user
      store.loadingStatus = false;
      store.isAppVisible = false;
      return;
    }

    // Step 7: Store relevant data in the Pinia store
    store.localConfigs["projectId"] = project;
    store.localConfigs["excerciceId"] = exercice;

    // Step 8: Fetch additional data from the backend
    await store.GetRemoteConfigs();
    await store.GetProjectProfileFromDatabase();
    await store.GetAnswerFromDatabase();
   
    // Step 9: Track the session start time (client-side only)
    store.startTime = performance.now();
    console.log('Session start time tracked.');

  } catch (error) {
    console.error('Token validation failed:', error);
    document.body.innerHTML = "🔓 Invalid token"; // Lock emoji for token errors
    store.loadingStatus = false;
    store.isAppVisible = false; // Ensure app is not displayed
  }
});

   // Watch the `answer` ref from the store and update `isAnswerEmpty`
    watch(() => store.answer, (newAnswer) => {
        isAnswerEmpty.value = checkIfEmpty(newAnswer);
    });
  </script>
  
  <style scoped>
  /* ... */
  .fade-enter-active {
    opacity: 0;
    animation: fadeIn 0.5s forwards;
    /* animation-delay: 1s; */
  }

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: scale(0.5);
  } 

  100% {
    opacity: 1;
    transform: scale(1);
  } 

}
  </style>
  