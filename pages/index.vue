<template>
  
  <!-- Main container -->
  <div
      v-if="store.isAppVisible"
      class="wrapper"
      :class="`theme-${computedTheme}`"
  > 
      <!-- Overlays container-->
      <div
          class="overlays-container noselect"
          v-if="store.loadingStatus  || store.completedOverlay || store.endpoint || store.remoteConfigs.maintenanceMode"
      >  
      
        <!-- 1) Loading overlay --> 
        <div 
          class="loading-overlay"
          v-if="store.loadingStatus"
        >
          <!-- Loading icons -->
          <fa icon="fas fa-spinner" class="fa-pulse" id="icon-checkmark" />
        </div>

        <!-- 2) Confirmation/revisit overlay -->
        <Transition name="overlay">
          <div
            id="confirmation-revisit-overlay"
            v-if="store.completedOverlay && !store.endpoint && !store.remoteConfigs.maintenanceMode"
            :class="{ 'fade-enter-active': store.completedOverlay, 'fade-leave-active': !store.completedOverlay}"

          >
            <fa icon="fa-circle-check" class="fa-beat" id="icon-checkmark" />
            <div style="padding: 0px 130px 0px 130px; color: white">
              
              <h1 style="text-align: center; margin-bottom: 20px; white-space: pre" v-html="store.localeDict.completedView.header">
              </h1>

              <h2
                style="
                  text-align: center;
                  font-size: 21px;
                  font-weight: 300;
                  line-height: 140%;
                  white-space: pre;
                "
                v-html="store.localeDict.completedView.body"
                
              >
              </h2>
            </div>
            <div>
              <button
                id="btn-correct-answer"
                style="margin-top: -30px"
                @click="store.completedOverlay = !store.completedOverlay"
              >
              {{ store.localeDict.completedView.button }}
              </button>
            </div>
          </div>
        </Transition>

        <!-- 3) Maintenance overlay -->
        <Transition>
          <div
            id="maintenance-overlay"
            v-if="store.remoteConfigs.maintenanceMode && !store.endpoint"
          >
            <fa
              icon="fa-solid fa-laptop-code"
              class="fa-beat"
              id="icon-checkmark"
            />
            <div style="padding: 0px 130px 0px 130px; color: white">
              <h1 style="text-align: center; margin-bottom: 20px; white-space: pre" v-html="store.localeDict.maintenanceView.header">
              </h1>
              <h2
                style="
                  text-align: center;
                  font-size: 21px;
                  font-weight: 300;
                  line-height: 140%;
                  white-space: pre;
                "
                v-html="store.localeDict.maintenanceView.body"
              >
              </h2>
            </div>
          </div>
        </Transition>

        <!-- 1) Endpoint overlay -->
        <div
          id="endpoint-overlay"
          :class="store.loadingStatus == true ? 'transparent' : ''"
          v-if="store.endpoint"
          @click="store.DownloadFilledPdf()"
        >
          <div
            style="
              padding: 52px;
              width: 370px;
              color: white;
              display: flex;
              flex-direction: column;
            "
          >
            <h1 style="text-align: left; margin-bottom: 24px; font-size: 34px; white-space: pre" v-html="store.localeDict.endpointView.header">
            </h1>
            <p
              style="
                text-align: left;
                font-size: 18px;
                font-weight: 300;
                line-height: 140%;
                white-space: pre;
                margin-bottom: 16px;
              "
              v-html="store.localeDict.endpointView.body"
            >
            </p>
            <p style="margin-top: 20px; line-height: 160%;">
              <span class="text-accent">{{ store.projectProfile.pdfFilename }}</span>
              <br />
              <span style="font-size: 16px;"
                >~{{ store.projectProfile.pdfFileSize }}</span
              >
            </p>
            
            <button
              style="float: left; width: 160px; margin-top: 14px"
              
            >
            {{ store.localeDict.endpointView.button }}
            </button>
          </div>
          <div style="width: 80%; position: relative; margin-right: 50px">
            <img
              :src="store.projectProfile['pdfCoverImgUrl']"
              :onload="setCoverLoaded"
              alt=""
              style="
                max-width: 275px;
                position: absolute;
                z-index: 1;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                margin: auto;
              "
            />
            <fa
              icon="fas fa-spinner"
              class="fa-pulse"
              id="icon-checkmark"
              style="
                max-width: 275px;
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                margin: auto;
                z-index: 2;
              "
              v-if="store.coverLoaded == false"
            />
            <img
              src="/cover.png"
              alt=""
              style="
                max-width: 275px;
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                margin: auto;
              "
            />

            <img
              src="/left_hand.png"
              alt=""
              style="
                width: 157px;
                position: absolute;
                bottom: -24px;
                z-index: 3;
                left: 3px;
              "
            />
            <img
              src="/right_hand.png"
              alt=""
              style="
                width: 140px;
                position: absolute;
                bottom: -24px;
                z-index: 3;
                right: -15px;
              "
            />
          </div>
        </div>
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
              {{ store.maxCharAllowed == 'null' ? store.localeDict?.editorView?.charCount || "" : "" }}
            </span>
            {{
              store.maxCharAllowed != 'null'
                ? "/" + store.maxCharAllowed + " " + (store.localeDict?.editorView?.charCount || "") + " " + (store.localeDict?.editorView?.allowedChar || "")
                : ""
            }}
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
    const store = useMainStore();

    // Middleware to guard the access, and provide access
    definePageMeta({
      middleware: 'validate-access',
    });
    
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
    if (
      store.projectProfile.theme == "brio" ||
      store.projectProfile.theme == "ul-yellow" ||
      store.projectProfile.theme == "ul-red"
    ) {
      
      // return the actual theme
      return store.projectProfile.theme;
      
    } else {
      // Return the default theme, with accent color
      const root = document.documentElement;
      root.style.setProperty("--color-theme", store.projectProfile.theme);
      root.style.setProperty("--color-theme-light", store.projectProfile.theme);
      root.style.setProperty("--color-theme-accent", store.projectProfile.theme);
      root.style.setProperty("--color-theme-button", store.projectProfile.theme);
      root.style.setProperty("--color-theme-button-hover", store.projectProfile.theme);
      return "default";
    }
  });

  onMounted(async () => {

  // Add a small delay to allow cookies to be restored after sleep
  await new Promise(resolve => setTimeout(resolve, 500));

  // Step 1: Validate referrer (only on the client side)
  if (process.client) {
    const referrer = document.referrer || "";
    // console.log('Referrer:', referrer);

    const allowedDomains = ["https://lms.example.com", "http://localhost:3000"];
    const isAllowedReferrer = allowedDomains.some(domain =>
      referrer.startsWith(domain)
    );

    if (!isAllowedReferrer) {
      // console.error('Invalid referrer:', referrer);
      document.body.innerHTML = "🔓 Invalid referrer"; // Lock emoji for unauthorized access
      store.loadingStatus = false;
      store.isAppVisible = false; // Ensure app is not displayed
      return;
    }
  }

    // Ping the API to check if it's live...
    const apiIsLive = await store.PingApi();
    // console.log('API is live:', apiIsLive);
    if (!apiIsLive) {
      document.body.innerHTML = "🔓 API isn't live.";
      store.loadingStatus = false;
      store.isAppVisible = false; // Ensure app is not displayed
      return;
    }

  // Step 2: Retrieve token using URLSearchParams
  const queryParams = new URLSearchParams(window.location.search); 
  const token = queryParams.get('token');

  if (!token) {
    // console.error('Missing access token.');
    document.body.innerHTML = "🔓 Missing token"; // Lock emoji for missing token
    store.loadingStatus = false;
    store.isAppVisible = false; // Ensure app is not displayed
    return;
  }

  try {
    // Step 3: Validate and decrypt the token with the server
    const decryptedPayload = await $fetch('/api/validateToken', {
      method: 'GET',
      params: { token },
    });

    // console.log('API response:', decryptedPayload);
    const decryptedPayloadJson = JSON.parse(decryptedPayload);
    const { source, project, exercice } = decryptedPayloadJson;

    // Step 4: Validate decrypted parameters
    if (!source || source !== "brioeducation" || !project || !exercice) {
      // console.error('Invalid or missing parameters.');
      document.body.innerHTML = "🔓 Invalid or missing parameters in the token."; // Lock emoji for invalid parameters
      store.loadingStatus = false;
      store.isAppVisible = false; // Ensure app is not displayed
      return;
    }

    // Step 5: Validate the user with the backend
    const response = await store.ValidateUser(source);
    if (!response || !response.valid) {
      // console.error('User validation failed.');
      document.body.innerHTML = "🔓 User validation failed."; // Lock emoji for invalid user
      store.loadingStatus = false;
      store.isAppVisible = false;
      return;
    }

    // Step 6: Store relevant data in the Pinia store
    store.localConfigs["projectId"] = project;
    store.localConfigs["excerciceId"] = exercice;
    // console.log('localConfigs:', store.localConfigs);

    store.isAppVisible = true; // Make app visible after validation

    // Step 7: Fetch additional data from the backend
    // console.log('Fetching remote configs...');
    await store.GetRemoteConfigs();
    // console.log('Remote configs:', store.remoteConfigs);

    // console.log('Fetching project profile...');
    await store.GetProjectProfileFromDatabase();

    // console.log('Fetching user answers...');
    await store.GetAnswerFromDatabase();
    // console.log('All data fetched successfully.');

    // Step 8: Track the session start time (client-side only)
    store.startTime = performance.now();
    console.log('Session start time tracked.');

  } catch (error) {
    console.error('Token validation failed:', error);
    document.body.innerHTML = "🔓"; // Lock emoji for token errors
    store.loadingStatus = false;
    store.isAppVisible = false; // Ensure app is not displayed
  }
});

  /*
  onMounted(async () => {
    const queryParams = new URLSearchParams(window.location.search); 
    const source = queryParams.get('source');
    const projectID = queryParams.get('project');
    const exerciceID = queryParams.get('exercice');

    // Ensure all required parameters are present in the URL and source is valid
    if (!source || source !== 'brioeducation' || !projectID || !exerciceID) {
      store.isAppVisible = false;
      document.body.innerHTML = "🔓"; // Display lock emoji for invalid or missing parameters
      return;
    }

    // Ping the API to check if it's live...
    const apiIsLive = await store.PingApi();
    if (!apiIsLive) {
      store.loadingStatus = false;
      store.isAppVisible = false; // Ensure app is not displayed
      return;
    }

    // Send the key to the backend for validation
    const response = await store.ValidateUser(source);
    if (response && response.valid) {
      
      // store.backpack = key; // Assign encrypted user ID to Pinia store
      store.localConfigs["projectId"] = projectID;
      store.localConfigs["excerciceId"] = exerciceID;
      
      store.isAppVisible = true; // Show app after validation

      await store.GetRemoteConfigs();
      await store.GetProjectProfileFromDatabase();
      await store.GetAnswerFromDatabase();
    } else {

      // Display lock emoji for invalid or missing parameters
      store.loadingStatus = false;
      store.isAppVisible = false;
      document.body.innerHTML = "🔓";
    }

    window.addEventListener("load", () => {
      store.startTime = performance.now();
    });
  });

  */

    // Watch the `answer` ref from the store and update `isAnswerEmpty`
    watch(() => store.answer, (newAnswer) => {
        isAnswerEmpty.value = checkIfEmpty(newAnswer);
    });

    // Other helpers
    function setCoverLoaded() {
      store.coverLoaded = true;
    }
 
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
  