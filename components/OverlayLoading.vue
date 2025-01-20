<template>

  <div class="loading-overlay">
    <fa icon="fas fa-spinner" class="fa-pulse" id="icon-loading" />
    <p v-html="statusMessage"></p>
  </div>
  
  </template>
  
  <script setup>

    import { useAppStateStore } from '/stores/appState';
    
    const appStore = useAppStateStore();

    // Compute the status message
    const statusMessage = computed (() => {
      return appStore.statusMessage;
    });


  </script>