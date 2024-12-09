<template>
    <Transition name="overlay">
      <div class="loading-overlay" v-if="store.loadingStatus">
        <fa icon="fas fa-spinner" class="fa-pulse" id="icon-loading" />
        <p v-html="store.statusMessage"></p>
      </div>
    </Transition>
  </template>
  
  <script setup>
  import { useMainStore } from '/stores/backpack';
  const store = useMainStore();
  </script>
  
  <style scoped>
  /* Add any specific styles for loading overlay if needed */
  </style>
  