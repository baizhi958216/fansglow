import { ref, watch, onUnmounted } from 'vue'
import type { AnimationMode } from './useLightStick'

export function useAnimations(animationMode: Ref<AnimationMode>) {
  const animationClass = ref<string>('')
  const animationStyle = ref<Record<string, string>>({})
  let flashInterval: NodeJS.Timeout | null = null

  const applyAnimation = () => {
    // Clear any existing interval
    if (flashInterval) {
      clearInterval(flashInterval)
      flashInterval = null
    }

    // Reset styles
    animationClass.value = ''
    animationStyle.value = {}

    switch (animationMode.value) {
      case 'always-on':
        // No animation
        break

      case 'breathing':
        animationClass.value = 'animate-breathing'
        break

      case 'slow-flash':
        animationClass.value = 'animate-slow-flash'
        break

      case 'fast-flash':
        animationClass.value = 'animate-fast-flash'
        break

      case 'rainbow':
        animationClass.value = 'animate-rainbow'
        break
    }
  }

  watch(animationMode, applyAnimation, { immediate: true })

  onUnmounted(() => {
    if (flashInterval) {
      clearInterval(flashInterval)
    }
  })

  return {
    animationClass,
    animationStyle
  }
}
