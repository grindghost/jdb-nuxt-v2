<template>
  <div id="endpoint-overlay" :class="store.loadingStatus ? 'transparent' : ''" v-if="store.endpoint" @click="store.DownloadFilledPdf()">
    <div :class="['overlay-content', { 'fade-in': store.coverLoaded }]">
      <div class="top">
        <h1 class="header" v-html="store.localeDict.endpointView.header"></h1>
        <p class="body-text" v-html="store.localeDict.endpointView.body"></p>
      </div>

      <div class="bottom">
        <p class="file-info">
          <span class="text-accent">{{ store.projectProfile.pdfFilename.length > 30 ? store.projectProfile.pdfFilename.slice(0, 30) + '... ' : store.projectProfile.pdfFilename }}.pdf</span>
          <br />
          <span class="file-size">~{{ store.projectProfile.pdfFileSize }}</span>
        </p>
        <button class="download-button">
          {{ store.localeDict.endpointView.button }}
        </button>
      </div>
    </div>
    
    <div class="image-container">
      <div :class="['cover-container', { 'fade-in': store.coverLoaded }]" ref="coverImageContainer">
        <img :src="store.projectProfile.pdfCoverImgUrl" :onload="setCoverLoaded" alt="" ref="coverImage" class="cover-image" />
      </div>

      <img src="../public/left_hand.png" ref="leftHand" :class="['left-hand', { 'fade-in': store.coverLoaded }]" />
      <img src="../public/right_hand.png" ref="rightHand" :class="['right-hand', { 'fade-in': store.coverLoaded }]" />
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '/stores/backpack';
import { useStatusStore } from '/stores/status';

const statusStore = useStatusStore();
const store = useMainStore();

const coverImage = ref(null);
const coverImageContainer = ref(null);
const leftHand = ref(null);
const rightHand = ref(null);

function setCoverLoaded() {
  store.coverLoaded = true;
  adjustHandPositions();
  store.statusMessage = statusStore.status[statusStore.locale].loadCover;

  setTimeout(() => {
    store.loadingStatus = false;   
  }, 1000)
}

function adjustHandPositions() {
  
  if (coverImage.value) {
    
    // Get the cover image width
    const coverWidth = coverImage.value.clientWidth;

    // Calculate the positions of the left and right hands based on the cover image width
    leftHand.value.style.left = `${coverImageContainer.value.offsetLeft - 47}px`;
    rightHand.value.style.right = `${coverImageContainer.value.offsetLeft - 64}px`;
  }
}
</script>


<style scoped>

.overlay-content {
  padding: 0px 52px 0px 52px;
  width: 370px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
}

.top {
  margin-top: 50px;
  margin-bottom: 16px;
}

.bottom {
  margin-top: auto;
  margin-bottom: 54px;
}

.header {
  text-align: left;
  margin-bottom: 24px;
  font-size: 34px;
  white-space: pre;
}

.body-text {
  text-align: left;
  font-size: 18px;
  font-weight: 300;
  line-height: 140%;
  white-space: pre;
}

.file-info {
  line-height: 160%;
  margin-top: auto;
}

.text-accent {
  /* Define your accent color if needed */
}

.file-size {
  font-size: 16px;
}

.download-button {
  float: left;
  width: 160px;
  margin-top: 14px;
}

.image-container {
  width: 80%;
  position: relative;
  margin-right: 50px;
}

.cover-container {
  height: fit-content;
  width: fit-content;
  max-height: 355px;
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin-top: auto;
  margin-right: auto;
  margin-left: auto;
  margin-bottom: 46px;
  opacity: 0;
  background-color: rgb(255, 255, 255);
  box-shadow: 0px 0px 10px 11px rgba(0,0,0,.17);
}

.cover-image {
  max-width: 300px;
  max-height: 355px;
  /* opacity: 0; */

  -webkit-mask-image: linear-gradient(45deg,#000 25%,rgba(0,0,0,.2) 50%,#000 75%);
  mask-image: linear-gradient(45deg,#000 25%,rgba(0,0,0,.2) 50%,#000 75%);
  -webkit-mask-size: 800%;
  mask-size: 800%;
  -webkit-mask-position: 0;
  mask-position: 0;

}

.loading-icon {
  max-width: 275px;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
  z-index: 2;
}


.left-hand {
  width: 157px;
  position: absolute;
  bottom: -24px;
  z-index: 3;
  left: 3px;
  opacity: 0;
}

.right-hand {
  width: 140px;
  position: absolute;
  bottom: -24px;
  z-index: 3;
  right: -15px;
  opacity: 0;
}


.fade-in {
  animation: fadeIn 0.8s ease-in forwards; /* Adjust duration as desired */
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95); /* Optional: Adds a slight zoom-in effect */
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.cover-image:hover {
    transition: mask-position 1.5s ease,-webkit-mask-position 1.5s ease;
    -webkit-mask-position: 120%;
    mask-position: 120%;
    opacity: 1;
}

</style>
