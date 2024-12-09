<template>
    <Transition name="overlay">
      <div
        id="confirmation-revisit-overlay"
        v-if="store.completedOverlay && !store.endpoint && !store.remoteConfigs.maintenanceMode"
        :class="{ 'fade-enter-active': store.completedOverlay, 'fade-leave-active': !store.completedOverlay}"
      >
        <fa icon="fa-circle-check" class="fa-beat" id="icon-checkmark" />
        <div style="padding: 0px 130px 0px 130px; color: white">
          <h1 style="text-align: center; margin-bottom: 20px; white-space: pre" v-html="store.localeDict.completedView.header"></h1>
          <h2 style="text-align: center; font-size: 21px; font-weight: 300; line-height: 140%; white-space: pre;" v-html="store.localeDict.completedView.body"></h2>
        </div>
        <div>
          <button id="btn-correct-answer" style="margin-top: -30px" @click="store.completedOverlay = !store.completedOverlay">
            {{ store.localeDict.completedView.button }}
          </button>
        </div>
      </div>
    </Transition>
  </template>
  
  <script setup>
  import { useMainStore } from '/stores/backpack';
  const store = useMainStore();
  </script>
  
  <style scoped>
  /* Add specific styles for confirmation overlay if needed */
  </style>
  