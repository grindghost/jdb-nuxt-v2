<!-- /pages/error.vue -->
<template>
    <div>
      <h1>Error</h1>
      <p>{{ message }}</p>
      <button @click="goBack">Go Back</button>
    </div>
  </template>
  
  <script setup>
  import { useRoute, useRouter } from 'vue-router';
  
  const route = useRoute();
  const router = useRouter();
  const message = route.query.message || 'An unexpected error occurred.';
  
  function goBack() {
    router.back();
  }
  </script>
  