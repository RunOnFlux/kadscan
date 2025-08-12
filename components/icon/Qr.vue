<script setup lang="ts">
defineProps<{
  sizeClass?: string;
}>();
</script>

<template>
  <svg
    :class="sizeClass || 'w-5 h-5'"
    viewBox="0 0 1024 1024"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    version="1.1"
    fill="currentColor"
  >
    <path d="M100 226v54v320h373v-374h-373zM527 226v54v320h373v-374h-373zM153 280h54h213v266h-267v-266zM580 280h53h214v266h-267v-266zM207 333v53v107h160v-160h-160zM633 333v53v107h160v-160h-160zM100 653v53v320h373v-373h-373zM687 653v53v54h106v-54h-53v-53h-53z
M687 760h-54h-106v106h53v54h-53v53h53v53h107v-160h-54v-53h54v-53zM153 706h54h213v267h-267v-267zM207 760v53v107h160v-160h-160zM847 760v53h-54v160h-53v53h107v-53h53v-213h-53z" />
  </svg>
</template>


