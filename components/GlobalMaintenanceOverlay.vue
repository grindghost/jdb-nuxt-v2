<template>
    <Transition name="overlay">
      <div id="maintenance-overlay" v-if="store.remoteConfigs.maintenanceMode && !store.endpoint">
        <fa icon="fa-solid fa-laptop-code" class="fa-beat" id="icon-checkmark" />
        <div style="padding: 0px 130px 0px 130px; color: white">
          <h1 style="text-align: center; margin-bottom: 20px; white-space: pre" v-html="store.localeDict.maintenanceView?.header"></h1>
          <h2 style="text-align: center; font-size: 21px; font-weight: 300; line-height: 140%; white-space: pre;" v-html="store.localeDict.maintenanceView?.body"></h2>
        </div>
      </div>
    </Transition>
  </template>
  
  <script setup>
  import { useMainStore } from '/stores/backpack';
  const store = useMainStore();
  </script>
  
  <style scoped>
  /* Add specific styles for maintenance overlay if needed */
  </style>
  