<template>
    <div v-if="isClient" class="quill-container">
      <div class="bottom-gradient"></div>
      <div ref="editorContainer" class="ql-container ql-snow"></div>
    </div>
  </template>
  
  <script setup>
  import { useMainStore } from '/stores/backpack';
  const store = useMainStore();
  
  const isClient = ref(false); // Client-side detection
  let quill;
  let lastValidContent = ''; // Store the last valid content
  
  const props = defineProps({
    content: String,
    placeholder: String,
  });
  const emit = defineEmits(['update:content']);
  
  const editorContainer = ref(null);
  
  const toolbarOptions = [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ direction: 'rtl' }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
  ];
  
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
  
      if (props.content) {
        const delta = quill.clipboard.convert(props.content);
        quill.setContents(delta, 'silent');
        lastValidContent = quill.root.innerHTML; // Set initial valid content
      }

      // Add a custom matcher for text nodes when pasting text
      quill.clipboard.addMatcher(Node.TEXT_NODE, (node, delta) => {
        const plainText = quill.getText(); // Get current plain text
        const currentLength = plainText.trim().length; // Count existing characters
        const maxAllowed = store.maxCharAllowed;

        if (store.useCharactersLimit) {
          const pastedText = delta.ops.map(op => op.insert).join(''); // Extract pasted text
          const allowedLength = maxAllowed - currentLength - 2;
          console.log('Allowed length:', allowedLength);

          if (allowedLength <= 0) {
            return null; // Block the paste completely if already at the limit
          }

          if (pastedText.length > allowedLength) {
            const trimmedText = pastedText.substring(0, allowedLength); // Trim excess characters
            return { ops: [{ insert: trimmedText }] }; // Replace the delta with the trimmed text
          }
        }
        return delta; // Allow paste as-is if below the limit
      });
  
      quill.on('text-change', () => {
        const plainText = quill.getText(); // Get plain text content
        const currentLength = plainText.trim().length; // Trim to remove trailing newline characters

        if (store.useCharactersLimit && currentLength > store.maxCharAllowed) {
          // Revert to the last valid state
          quill.root.innerHTML = lastValidContent;
          quill.setSelection(store.maxCharAllowed); // Adjust selection to the limit
        } else {
          lastValidContent = quill.root.innerHTML; // Update the last valid state
          emit('update:content', quill.root.innerHTML);
        }
      });

  
      setTimeout(() => {
        applyHeaderStyles();
      }, 1500);
    }
  });
  
  watch(() => props.content, (newContent) => {    
    if (quill && newContent !== quill.root.innerHTML) {
      quill.root.innerHTML = newContent; // Set the raw HTML directly
      lastValidContent = newContent; // Update the last valid state
    }
  });
  
  onBeforeUnmount(() => {
    if (quill) {
      quill = null;
    }
  });
  
  // Function to apply localized header styles
  function applyHeaderStyles() {
    const h1 = store?.localeDict?.editorView?.toolbar?.h1 || 'H1';
    const h2 = store?.localeDict?.editorView?.toolbar?.h2 || 'H2';
    const h3 = store?.localeDict?.editorView?.toolbar?.h3 || 'H3';
    const normal = store?.localeDict?.editorView?.toolbar?.normal || 'Normal';
  
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
  