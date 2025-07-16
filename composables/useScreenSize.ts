import { ref, onMounted, onUnmounted } from 'vue';

export function useScreenSize() {
  const isMobile = ref(false);

  const checkScreenSize = () => {
    if (typeof window !== 'undefined') {
      isMobile.value = window.innerWidth < 768;
    }
  };

  onMounted(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
  });

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', checkScreenSize);
    }
  });

  return {
    isMobile,
  };
} 