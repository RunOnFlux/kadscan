<script setup lang="ts">
import { ref } from 'vue';

const isSticky = ref(true);
</script>

<template>
  <div>
    <div
      class="w-full h-[44px] z-50 bg-[#111111] border-b border-[#222222]"
      :class="{
        'fixed top-0 left-0': isSticky,
      }"
    >
      <!-- This is the new, empty MasterTopBar -->
    </div>
    <div v-if="isSticky" class="h-[44px]"></div>
  </div>
</template> 