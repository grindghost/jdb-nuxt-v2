  <template>
    <div class="loading-overlay">
      <fa v-if="isMounted" :icon="['fas', 'spinner']" class="fa-pulse" id="icon-loading" />
      <p v-html="statusMessage"></p>
    </div>
  </template>
  
  <script setup>

    import { useAppStateStore } from '/stores/appState';
    const appStore = useAppStateStore();

    // Reactive reference to track if the component has been mounted on the client
    const isMounted = ref(false);

    // Set `isMounted` to true once the component has been mounted
    onMounted(() => {
      isMounted.value = true;
    });

    const isServer = computed (() => {
      return process.server;
    });
    
    // Compute the status message
    const statusMessage = computed (() => {
      return appStore.statusMessage;
    });

  </script>