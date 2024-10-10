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
              
              <h1 style="text-align: center; margin-bottom: 20px; white-space: pre" v-html="store.projectProfile.completedOverlayContent.header">
              </h1>

              <h2
                style="
                  text-align: center;
                  font-size: 21px;
                  font-weight: 300;
                  line-height: 140%;
                  white-space: pre;
                "
                v-html="store.projectProfile.completedOverlayContent.body"
              >
              </h2>
            </div>
            <div>
              <button
                id="btn-correct-answer"
                style="margin-top: -30px"
                @click="store.completedOverlay = !store.completedOverlay"
              >
              {{ store.projectProfile.completedOverlayContent.button }}
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
              <h1 style="text-align: center; margin-bottom: 20px; white-space: pre">
                Maintenance en cours...
              </h1>
              <h2
                style="
                  text-align: center;
                  font-size: 21px;
                  font-weight: 300;
                  line-height: 140%;
                  white-space: pre;
                "
              >
                Nous devons temporairement restreindre l'accès<br />
                aux zones de réflexions interactives, car nous effectuons <br />des
                travaux de maintenance. Nous vous prions de nous<br />
                excuser pour cette interruption...
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
            <h1 style="text-align: left; margin-bottom: 24px; font-size: 34px; white-space: pre" v-html="store.projectProfile.endpointOverlayContent.header">
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
            >
              {{ store.projectProfile.endpointOverlayContent.body }}
            </p>
            <p style="margin-top: 20px; line-height: 160%;">
              <span class="text-accent">{{ store.projectProfile.endpointOverlayContent.filename }}</span>
              <br />
              <span style="font-size: 16px;"
                >~{{ store.projectProfile.endpointOverlayContent.filesize }}</span
              >
            </p>
            
            <button
              style="float: left; width: 160px; margin-top: 14px"
              
            >
              Télécharger
            </button>
          </div>
          <div style="width: 80%; position: relative; margin-right: 50px">
            <img
              :src="store.projectProfile.endpointOverlayContent['coverImgUrl']"
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
                left: -1px;
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
        :class="store.completedOverlay == true || store.endpoint == true || store.remoteConfigs.maintenanceMode == true ? 'transparent' : ''">
        
        <!-- Quill editor -->
        <QuillEditor v-model:content="store.answer" contentType="html" :placeholder="store.placeholder" />
        
        <!-- Footer -->
        <div class="footer noselect">

          <div class="maxchar">
              <span id="count"
                ><strong>{{ answerLength }}</strong
                >{{ store.maxCharAllowed == 'null' ? " caractères" : "" }}</span
              >{{
                store.maxCharAllowed != 'null'
                  ? "/" + store.maxCharAllowed + " caractères permis"
                  : ""
              }}
          </div>

          <!-- Submit button -->
          <button 
              @click="store.SaveAnswer" 
              :disabled="isAnswerEmpty || store.endpoint || store.completedOverlay || store.answer == store.defaultText" 
              
          >
              {{ store.mode == "edition" ? "Corriger" : "Soumettre" }}
          </button>
        </div>
      </div>

    </div>

  </template>
  
  <script setup>
  import { useMainStore } from '/stores/backpack';
    const store = useMainStore();
    
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
      await store.GetProjectProfileFromFirebase();
      await store.GetAnswerFromFirebase();
    } else {
      console.log('ici')
      store.loadingStatus = false;
      store.isAppVisible = false;
      document.body.innerHTML = "🔓";
    }

    window.addEventListener("load", () => {
      store.startTime = performance.now();
    });
  });

  /*
  onMounted(async () => {
    const queryParams = new URLSearchParams(window.location.search);
    const key = queryParams.get('backpack');
    const source = queryParams.get('source');

    // Project and exercie IDs
    const projectID = queryParams.get('project');
    const exerciceID = queryParams.get('exercice');

    if (!key || source !== 'brioeducation') {
      store.isAppVisible = false;
      document.body.innerHTML = "🔓";
      return;
    }

    // Ping the API to check if it's live
    const apiIsLive = await store.PingApi();
    if (!apiIsLive) {
      store.loadingStatus = false;
      store.isAppVisible = false; // Ensure app is not displayed
      return;
    }

    // Send the key to the backend for validation
    const response = await store.ValidateUser(key, source);
    if (response && response.isValid) {
      
      store.backpack = key; // Assign encrypted user ID to Pinia store
      store.localConfigs["projectId"] = projectID;
      store.localConfigs["excerciceId"] = exerciceID;
      
      store.isAppVisible = true; // Show app after validation

      await store.GetRemoteConfigs();
      // await store.GetBackpackReference();
      await store.GetProjectProfileFromFirebase();
      await store.GetAnswerFromFirebase();
    } else {
      store.loadingStatus = false;
      store.isAppVisible = false;
      document.body.innerHTML = "🔓";
    }

    window.addEventListener("load", () => {
      store.startTime = performance.now();
    });
  });
  */

  /*
  onMounted(async () => {
    const apiIsLive = await store.PingApi();
    if (apiIsLive) {
      await store.GetRemoteConfigs();
      await store.GetBackpackReference();
      await store.GetConfigsFromJson();
      await store.GetProjectProfileFromJson();
      await store.GetAnswerFromFirebase();
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
  