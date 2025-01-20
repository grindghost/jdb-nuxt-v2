<template>

  <div class="loading-overlay">
    <fa icon="fas fa-spinner" class="fa-pulse" id="icon-loading" />
    <p v-html="statusMessage"></p>
  </div>
  
  </template>
  
  <script setup>

    import { useAppStateStore } from '/stores/appState';
    import { useStatusStore } from '/stores/status';
    
    const appStore = useAppStateStore();
    const statusStore = useStatusStore();

    // Compute the status message
    const statusMessage = computed (() => {
      const status = statusStore.status[appStore.lang][appStore.statusMessage];
      return status;
    });

  </script>