<template>
      <div id="maintenance-overlay"        
        class="fadeInScale">
        <fa icon="fa-solid fa-laptop-code" class="fa-beat" id="icon-checkmark" />
        <div style="padding: 0px 130px 0px 130px; color: white">
          <h1 style="text-align: center; margin-bottom: 20px; white-space: pre" v-html="header"></h1>
          <h2 style="text-align: center; font-size: 21px; font-weight: 300; line-height: 140%; white-space: pre;" v-html="body"></h2>
        </div>
      </div>
  </template>

<script setup>
    import { useAppStateStore } from '/stores/appState';
    const appStore = useAppStateStore();

    // Get the text from the unit profile locales
    const locale = computed (() => {
      return appStore.unitProfile.locale.maintenanceView;
    });

    const { header, body } = locale.value;


</script>