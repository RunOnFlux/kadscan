<template>
  <svg 
    :width="size" 
    :height="size" 
    :class="className"
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="m17.92 6.62a1 1 0 0 0 -.54-.54 1 1 0 0 0 -.38-.08h-10a1 1 0 0 0 0 2h7.59l-8.3 8.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l8.29-8.3v7.59a1 1 0 0 0 2 0v-10a1 1 0 0 0 -.08-.38z" 
      :fill="color"
    />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  size?: string | number
  color?: string
  className?: string
}

withDefaults(defineProps<Props>(), {
  size: '16',
  color: 'currentColor',
  className: ''
})
</script> 