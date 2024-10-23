<template>
    <div v-if="isClient" class="quill-container">
      <div class="bottom-gradient"></div>
      <div ref="editorContainer" class="ql-container ql-snow"></div>
    </div>
  </template>
  
  <script setup>
  import { set } from '~/node_modules/nuxt/dist/app/compat/capi';
import { useMainStore } from '/stores/backpack';
  const store = useMainStore();

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

    // Apply localized header styles on mount
    setTimeout(() => {
      applyHeaderStyles();
    }, 1500)
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
      quill.root.setAttribute('data-placeholder', newPlaceholder);
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

    // Function to apply localized header styles
    function applyHeaderStyles() {
    
    const h1 = store?.localeDict?.editorView?.toolbar?.h1 || 'H1';
    const h2 = store?.localeDict?.editorView?.toolbar?.h2 || 'H2';
    const h3 = store?.localeDict?.editorView?.toolbar?.h3 || 'H3';
    const normal = store?.localeDict?.editorView?.toolbar?.normal || 'Normal';

    // console.log('applyHeaderStyles', h1, h2, h3, normal)

    const style = document.createElement('style');
    style.innerHTML = `
        .ql-snow .ql-picker-options .ql-picker-item[data-value="1"]::before {
        content: '${h1}' !important;
        }
        .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="1"]::before {
        content: '${h1}' !important;
        }
        .ql-snow .ql-picker-options .ql-picker-item[data-value="2"]::before {
        content: '${h2}' !important;
        }
        .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="2"]::before {
        content: '${h2}' !important;
        }
        .ql-snow .ql-picker-options .ql-picker-item[data-value="3"]::before {
        content: '${h3}' !important;
        }
        .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="3"]::before {
        content: '${h3}' !important;
        }
        /* Handle the 'Normal' case (no data-value attribute) */
        .ql-snow .ql-picker-options .ql-picker-item:not([data-value])::before {
        content: '${normal}' !important;
        }
        .ql-snow .ql-picker.ql-header .ql-picker-label:not([data-value])::before {
        content: '${normal}' !important;
        }
    `;
    document.head.appendChild(style);
    }
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
  