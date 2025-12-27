import { ref, computed } from 'vue'

export type DisplayMode = 'text' | 'canvas'
export type AnimationMode = 'always-on' | 'breathing' | 'slow-flash' | 'fast-flash' | 'rainbow'

export interface ColorPreset {
  name: string
  value: string
  label: string
}

export const colorPresets: ColorPreset[] = [
  { name: 'miku-green', value: '#39C5BB', label: '初音绿' },
  { name: 'light-red', value: '#FF4444', label: '红色' },
  { name: 'light-blue', value: '#4488FF', label: '蓝色' },
  { name: 'light-pink', value: '#FF88DD', label: '粉色' },
  { name: 'light-yellow', value: '#FFD700', label: '黄色' },
]

const selectedColor = ref<string>(colorPresets[0]!.value)
const displayMode = ref<DisplayMode>('text')
const animationMode = ref<AnimationMode>('always-on')
const textContent = ref<string>('')
const canvasDataUrl = ref<string>('')
const isFullscreen = ref<boolean>(false)

export function useLightStick() {
  const setColor = (color: string) => {
    selectedColor.value = color
  }

  const setDisplayMode = (mode: DisplayMode) => {
    displayMode.value = mode
  }

  const setAnimationMode = (mode: AnimationMode) => {
    animationMode.value = mode
  }

  const setTextContent = (text: string) => {
    textContent.value = text.slice(0, 8) // Enforce 8 character limit
  }

  const setCanvasDataUrl = (dataUrl: string) => {
    canvasDataUrl.value = dataUrl
  }

  const setFullscreen = (value: boolean) => {
    isFullscreen.value = value
  }

  const canEnterFullscreen = computed(() => {
    if (displayMode.value === 'text') {
      return textContent.value.trim().length > 0
    }
    if (displayMode.value === 'canvas') {
      return canvasDataUrl.value.length > 0
    }
    return false
  })

  const displayContent = computed(() => {
    if (displayMode.value === 'text') {
      return textContent.value
    }
    return canvasDataUrl.value
  })

  return {
    // State
    selectedColor,
    displayMode,
    animationMode,
    textContent,
    canvasDataUrl,
    isFullscreen,

    // Computed
    canEnterFullscreen,
    displayContent,

    // Actions
    setColor,
    setDisplayMode,
    setAnimationMode,
    setTextContent,
    setCanvasDataUrl,
    setFullscreen,
  }
}
