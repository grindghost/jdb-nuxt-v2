<template>
      <div
        id="confirmation-revisit-overlay"
        class="fadeInScale"
      >
        <fa icon="fa-circle-check" class="fa-beat" id="icon-checkmark" />
        <div style="padding: 0px 130px 0px 130px; color: white">
          <h1 style="text-align: center; margin-bottom: 20px; white-space: pre" v-html="header"></h1>
          <h2 style="text-align: center; font-size: 21px; font-weight: 300; line-height: 140%; white-space: pre;" v-html="body"></h2>
        </div>
        <div>
          <button id="btn-correct-answer" style="margin-top: -30px" @click="handleClick">
            {{ button }}
          </button>
        </div>
      </div>
  </template>

<script setup>

    import { useAppStateStore } from '/stores/appState';
    const appStore = useAppStateStore();

    // Get the text from the unit profile locales
    const locale = computed (() => {
      return appStore.unitProfile.locale.completedView;
    });

    const { header, body, button } = locale.value;

    const handleClick = () => {
      appStore.hideOverlay();
    };

</script>