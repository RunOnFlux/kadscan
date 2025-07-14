<template>
  <div ref="container" class="container large grid square-grid"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import * as anime from 'animejs'

const container = ref<HTMLDivElement | null>(null)
let renderer: THREE.WebGLRenderer | undefined

onMounted(() => {
  if (!container.value) {
    return
  }

  anime.engine.useDefaultMainLoop = false

  const { width, height } = container.value.getBoundingClientRect()

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 20)

  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true })

  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.value.appendChild(renderer.domElement)
  camera.position.z = 5

  function createAnimatedCube() {
    const cube = new THREE.Mesh(geometry, material)
    const x = anime.utils.random(-10, 10)
    const y = anime.utils.random(-5, 5)
    const z = [-10, 7];
    const r = () => anime.utils.random(-Math.PI * 2, Math.PI * 2)
    const duration = 4000;
    
    anime.createTimeline({
      delay: anime.utils.random(0, duration),
      defaults: { loop: true, duration, ease: 'inSine', },
    })
    .add(cube.position, { x, y, z }, 0)
    .add(cube.rotation, { x: r, y: r, z: r }, 0)
    .init();
    
    scene.add(cube)
  }

  for (let i = 0; i < 40; i++) {
    createAnimatedCube()
  }

  function render() {
    anime.engine.update()
    if(renderer) {
      renderer.render(scene, camera)
    }
  }

  renderer.setAnimationLoop(render)

  const onResize = () => {
    if (container.value && renderer) {
      const { width, height } = container.value.getBoundingClientRect();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
  }

  window.addEventListener('resize', onResize)

  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
    if (renderer) {
        renderer.setAnimationLoop(null)
    }
  })
})
</script>

<style scoped>
.container {
  width: 100%;
  color: #ffffff;
}
</style> 