<template>
    <Transition name="overlay">
      <div
        id="confirmation-revisit-overlay"
        v-if="store.UnitState == 'completed'"
        class="fadeInScale"
        :class="'hidden' ? store.UnitState !== 'completed' : ''"
      > 
        <fa icon="fa-circle-check" class="fa-beat" id="icon-checkmark" />
        
        <div style="padding: 0px 130px 0px 130px; color: white">
          <h1 style="text-align: center; margin-bottom: 20px; white-space: pre" v-html="props.profile.locale?.completedView.header"></h1>
          <h2 style="text-align: center; font-size: 21px; font-weight: 300; line-height: 140%; white-space: pre;" v-html="props.profile.locale?.completedView.body"></h2>
        </div>
        <div> 
          <button id="btn-correct-answer" style="margin-top: -30px" @click="onButtonClickHandler">
            {{ props.profile.locale?.completedView?.button }}
          </button> 
        </div>
      </div>
    </Transition>
  </template>
  
  <script setup>
  import { useMainStore } from '/stores/backpack';
  const store = useMainStore();

  const props = defineProps({
    profile: {
      type: Object,
      required: true,
    },
  });

  const onButtonClickHandler = () => {
    // store.UnitState = 'editor';
    store.UnitState = 'loading';
  };


  </script>
  
  <style scoped>

  </style>
  