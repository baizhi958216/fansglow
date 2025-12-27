<template>
  <div
    v-if="isFullscreen"
    class="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
    :style="{ backgroundColor: '#000000' }"
    @click="exitFullscreen"
  >
    <!-- Text Mode -->
    <div
      v-if="displayMode === 'text'"
      :class="['font-black text-center px-4', animationClass]"
      :style="{ fontSize: textSize, color: selectedColor }"
    >
      {{ textContent }}
    </div>

    <!-- Canvas Mode -->
    <img
      v-else-if="displayMode === 'canvas' && canvasDataUrl"
      :src="canvasDataUrl"
      alt="Canvas drawing"
      :class="['max-w-full max-h-full object-contain', animationClass]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useWakeLock } from '@vueuse/core'
import { useLightStick } from '~/composables/useLightStick'
import { useAnimations } from '~/composables/useAnimations'

const {
  isFullscreen,
  selectedColor,
  displayMode,
  animationMode,
  textContent,
  canvasDataUrl,
  setFullscreen
} = useLightStick()

const { animationClass } = useAnimations(animationMode)

const { isSupported: wakeLockSupported, isActive, request, release } = useWakeLock()

// Calculate responsive text size based on content length
const textSize = computed(() => {
  const length = textContent.value.length
  if (length <= 2) return 'clamp(8rem, 25vw, 20rem)'
  if (length <= 4) return 'clamp(6rem, 20vw, 16rem)'
  if (length <= 6) return 'clamp(4rem, 15vw, 12rem)'
  return 'clamp(3rem, 12vw, 10rem)'
})

// Request wake lock when entering fullscreen
watch(isFullscreen, async (value) => {
  if (value && wakeLockSupported.value) {
    try {
      await request('screen')
    } catch (error) {
      console.warn('Wake Lock request failed:', error)
    }
  } else if (!value && isActive.value) {
    await release()
  }
})

const exitFullscreen = async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen()
  }
  setFullscreen(false)
  if (isActive.value) {
    await release()
  }
}

// Handle fullscreen change events
const handleFullscreenChange = () => {
  if (!document.fullscreenElement) {
    setFullscreen(false)
  }
}

if (process.client) {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
}

onUnmounted(() => {
  if (process.client) {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }
  if (isActive.value) {
    release()
  }
})
</script>

<style scoped>
@keyframes breathing {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

@keyframes slow-flash {
  0%, 49% {
    opacity: 1;
  }
  50%, 99% {
    opacity: 0;
  }
}

@keyframes fast-flash {
  0%, 49% {
    opacity: 1;
  }
  50%, 99% {
    opacity: 0;
  }
}

@keyframes rainbow {
  0% {
    filter: hue-rotate(0deg);
  }
  100% {
    filter: hue-rotate(360deg);
  }
}

.animate-breathing {
  animation: breathing 2s ease-in-out infinite;
}

.animate-slow-flash {
  animation: slow-flash 1.5s step-end infinite;
}

.animate-fast-flash {
  animation: fast-flash 0.5s step-end infinite;
}

.animate-rainbow {
  animation: rainbow 3s linear infinite;
}
</style>
