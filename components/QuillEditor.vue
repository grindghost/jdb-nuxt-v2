<template>
    <div v-if="isClient" class="quill-container">
      <div class="bottom-gradient"></div>
      <div ref="editorContainer" class="ql-container ql-snow"></div>
    </div>
  </template>
  
  <script setup>
  
  const isClient = ref(false) // Client-side detection
  let quill
  
  const props = defineProps({
    content: String,
    placeholder: String
  })
  const emit = defineEmits(['update:content'])
  
  const editorContainer = ref(null)
  
  const toolbarOptions = [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'], // toggled buttons
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
    [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
    [{ direction: 'rtl' }], // text direction
    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ align: [] }]
  ]
  
  onMounted(async () => {
  isClient.value = true;

  if (isClient.value) {
    const Quill = (await import('quill')).default;

    quill = new Quill(editorContainer.value, {
      theme: 'snow',
      placeholder: props.placeholder,
      modules: {
        toolbar: toolbarOptions,
      },
    });

    // Force update content once Quill is initialized
    if (props.content) {
      const delta = quill.clipboard.convert(props.content);
      quill.setContents(delta, 'silent');

    }

    quill.on('text-change', () => {
      emit('update:content', quill.root.innerHTML);
    });
  }
});

  
  // Watch for changes in content prop
  /*
  watch(() => props.content, (newContent) => {
    console.log('newContent', newContent)
    if (quill && newContent !== quill.root.innerHTML) {
      const delta = quill.clipboard.convert(newContent)
      quill.setContents(delta, 'silent')
    }
  })
  */
  
  // Watch for changes in placeholder prop
  watch(() => props.placeholder, (newPlaceholder) => {
    if (quill && newPlaceholder !== quill.options.placeholder) {
      quill.root.setAttribute('data-placeholder', newPlaceholder)
    }
  })

  watch(() => props.content, (newContent) => {
  if (quill && newContent !== quill.root.innerHTML) {
    quill.root.innerHTML = newContent; // Set the raw HTML directly
  }
});

  
  onBeforeUnmount(() => {
    if (quill) {
      quill = null
    }
  })
  </script>
  
  <style scoped>
  .quill-container {
    position: relative;
  }
  
  .bottom-gradient {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 30px;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1));
  }
  </style>
  