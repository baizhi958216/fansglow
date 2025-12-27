<template>
  <div class="space-y-3">
    <!-- Canvas Container -->
    <div
      ref="containerRef"
      :class="[
        'relative bg-black rounded-lg overflow-hidden',
        isCanvasFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      ]"
      :style="isCanvasFullscreen ? {} : { aspectRatio: '3/4' }"
    >
      <canvas
        ref="canvasRef"
        class="w-full h-full touch-none"
      />

      <!-- Fullscreen Toggle Button -->
      <button
        @click="toggleCanvasFullscreen"
        class="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 rounded-lg p-2 shadow-lg transition-all z-20"
        :title="isCanvasFullscreen ? '退出全屏' : '全屏编辑'"
      >
        <svg v-if="!isCanvasFullscreen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Floating Image Controls -->
      <div
        v-if="selectedImageIndex !== null && selectedImage && controlsPosition"
        :style="{
          position: 'absolute',
          left: controlsPosition.x + 'px',
          top: controlsPosition.y + 'px',
          transform: 'translate(-50%, -100%)',
          marginTop: '-10px'
        }"
        class="bg-white rounded-lg shadow-lg p-3 space-y-2 z-10 min-w-[200px]"
        @mousedown.stop
        @touchstart.stop
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-gray-700">图片调整</span>
          <button
            @click="handleDeleteImage"
            class="text-red-600 hover:text-red-700 text-xs"
          >
            🗑️
          </button>
        </div>

        <!-- Rotation -->
        <div class="space-y-1">
          <div class="flex justify-between items-center">
            <label class="text-xs text-gray-600">旋转</label>
            <span class="text-xs font-mono text-gray-700">{{ selectedImage.rotation }}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            :value="selectedImage.rotation"
            @input="handleRotationChange"
            class="w-full h-1"
          />
        </div>

        <!-- Scale -->
        <div class="space-y-1">
          <div class="flex justify-between items-center">
            <label class="text-xs text-gray-600">缩放</label>
            <span class="text-xs font-mono text-gray-700">{{ (selectedImage.scale * 100).toFixed(0) }}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            :value="selectedImage.scale"
            @input="handleScaleChange"
            class="w-full h-1"
          />
        </div>

        <!-- Opacity -->
        <div class="space-y-1">
          <div class="flex justify-between items-center">
            <label class="text-xs text-gray-600">透明度</label>
            <span class="text-xs font-mono text-gray-700">{{ (selectedImage.opacity * 100).toFixed(0) }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="selectedImage.opacity"
            @input="handleOpacityChange"
            class="w-full h-1"
          />
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex gap-3">
      <button
        @click="handleUndo"
        :disabled="!canUndo"
        :class="[
          'flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200',
          canUndo
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        ]"
      >
        撤销
      </button>
      <button
        @click="handleClear"
        :disabled="!canUndo && images.length === 0"
        :class="[
          'flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200',
          canUndo || images.length > 0
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        ]"
      >
        清空
      </button>
      <button
        @click="handleDone"
        :disabled="!canUndo && images.length === 0"
        :class="[
          'flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200',
          canUndo || images.length > 0
            ? 'bg-gray-900 text-white hover:bg-gray-800 active:scale-95'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        ]"
      >
        完成
      </button>
    </div>

    <!-- Image Controls -->
    <div class="space-y-3">
      <!-- Preset Light Sticks -->
      <div>
        <h4 class="text-sm font-semibold text-gray-700 mb-2">预设应援棒</h4>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="preset in presetSticks"
            :key="preset.name"
            @click="addPresetStick(preset)"
            class="px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-gray-700 rounded-lg text-sm font-medium transition-all active:scale-95 flex items-center gap-1"
          >
            {{ preset.icon }} {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Upload Custom Image -->
      <div class="flex gap-3">
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          @change="handleImageUpload"
          class="hidden"
        />
        <button
          @click="triggerFileInput"
          class="flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200 active:scale-95"
        >
          📷 上传图片
        </button>
      </div>
    </div>

    <p class="text-sm text-gray-600">
      在黑色画布上绘制你的应援内容，点击图片可拖动和调整
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useLightStick } from '~/composables/useLightStick'
import { useCanvas } from '~/composables/useCanvas'

const { selectedColor, setCanvasDataUrl } = useLightStick()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isCanvasFullscreen = ref(false)

const {
  strokes,
  images,
  selectedImageIndex,
  undo,
  clear,
  getDataUrl,
  initCanvas,
  addImage,
  deleteSelectedImage,
  updateSelectedImageRotation,
  updateSelectedImageOpacity,
  updateSelectedImageScale,
  getSelectedImage
} = useCanvas(canvasRef, selectedColor)

const canUndo = computed(() => strokes.value.length > 0)
const selectedImage = computed(() => getSelectedImage())

// Preset light stick patterns
interface PresetStick {
  name: string
  label: string
  icon: string
  svg: string
}

const presetSticks: PresetStick[] = [
  {
    name: 'lightstick',
    label: '应援棒',
    icon: '✨',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 500">
      <!-- Handle (bottom part) -->
      <rect x="80" y="320" width="40" height="160" rx="20" fill="#2a2a2a"/>
      <!-- Grip texture -->
      <rect x="80" y="340" width="40" height="4" rx="2" fill="#404040"/>
      <rect x="80" y="360" width="40" height="4" rx="2" fill="#404040"/>
      <rect x="80" y="380" width="40" height="4" rx="2" fill="#404040"/>
      <rect x="80" y="400" width="40" height="4" rx="2" fill="#404040"/>
      <rect x="80" y="420" width="40" height="4" rx="2" fill="#404040"/>
      <!-- Connection piece -->
      <ellipse cx="100" cy="310" rx="25" ry="15" fill="#3a3a3a"/>
      <!-- Light tube (main glowing part) -->
      <rect x="75" y="40" width="50" height="280" rx="25" fill="currentColor" opacity="0.95"/>
      <!-- Inner glow layers -->
      <rect x="80" y="45" width="40" height="270" rx="20" fill="currentColor" opacity="0.8"/>
      <rect x="85" y="50" width="30" height="260" rx="15" fill="white" opacity="0.4"/>
      <!-- Top cap -->
      <ellipse cx="100" cy="40" rx="25" ry="12" fill="currentColor" opacity="0.9"/>
      <ellipse cx="100" cy="40" rx="20" ry="10" fill="white" opacity="0.3"/>
      <!-- Bottom cap of light tube -->
      <ellipse cx="100" cy="320" rx="25" ry="12" fill="currentColor" opacity="0.9"/>
    </svg>`
  },
  {
    name: 'heart',
    label: '爱心',
    icon: '💖',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M100 180 L40 120 Q20 100 20 75 Q20 50 40 35 Q60 20 80 35 Q90 45 100 60 Q110 45 120 35 Q140 20 160 35 Q180 50 180 75 Q180 100 160 120 Z" fill="currentColor"/>
    </svg>`
  },
  {
    name: 'star',
    label: '星星',
    icon: '⭐',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M100 20 L115 70 L170 70 L125 105 L145 160 L100 125 L55 160 L75 105 L30 70 L85 70 Z" fill="currentColor"/>
    </svg>`
  },
  {
    name: 'crown',
    label: '皇冠',
    icon: '👑',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M20 150 L30 80 L60 110 L100 50 L140 110 L170 80 L180 150 Z M40 160 L160 160 L160 180 L40 180 Z" fill="currentColor"/>
    </svg>`
  },
  {
    name: 'music',
    label: '音符',
    icon: '🎵',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <ellipse cx="60" cy="150" rx="25" ry="20" fill="currentColor"/>
      <ellipse cx="140" cy="130" rx="25" ry="20" fill="currentColor"/>
      <rect x="80" y="40" width="8" height="110" fill="currentColor"/>
      <rect x="160" y="30" width="8" height="100" fill="currentColor"/>
      <path d="M88 40 Q120 20 168 30 L168 50 Q120 40 88 60 Z" fill="currentColor"/>
    </svg>`
  },
  {
    name: 'flower',
    label: '花朵',
    icon: '🌸',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="20" fill="currentColor"/>
      <ellipse cx="100" cy="60" rx="25" ry="35" fill="currentColor" opacity="0.8"/>
      <ellipse cx="100" cy="140" rx="25" ry="35" fill="currentColor" opacity="0.8"/>
      <ellipse cx="60" cy="100" rx="35" ry="25" fill="currentColor" opacity="0.8"/>
      <ellipse cx="140" cy="100" rx="35" ry="25" fill="currentColor" opacity="0.8"/>
    </svg>`
  },
  {
    name: 'diamond',
    label: '钻石',
    icon: '💎',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M100 30 L160 80 L100 170 L40 80 Z M60 80 L100 150 L140 80 L100 50 Z" fill="currentColor"/>
    </svg>`
  }
]

const addPresetStick = async (preset: PresetStick) => {
  try {
    // Create a canvas to render the SVG
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = 400
    tempCanvas.height = 400
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    // Get current color
    const color = selectedColor.value

    // Create SVG with color
    const coloredSvg = preset.svg.replace(/currentColor/g, color)
    const svgBlob = new Blob([coloredSvg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)

    // Load and draw SVG
    const img = new Image()
    img.onload = async () => {
      tempCtx.drawImage(img, 0, 0, 400, 400)
      URL.revokeObjectURL(url)

      // Convert to blob and add to canvas
      tempCanvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `${preset.name}.png`, { type: 'image/png' })
          await addImage(file)
        }
      }, 'image/png')
    }
    img.src = url
  } catch (error) {
    console.error('Failed to add preset stick:', error)
    alert('添加预设图案失败，请重试')
  }
}

// Calculate position for floating controls
const controlsPosition = computed(() => {
  if (!selectedImage.value || !canvasRef.value) return null

  const img = selectedImage.value
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()

  // Calculate the center of the image
  const centerX = img.x + (img.width * img.scale) / 2
  const centerY = img.y + (img.height * img.scale) / 2

  // Position controls above the image
  // Convert canvas coordinates to screen coordinates
  const canvasWidth = rect.width
  const canvasHeight = rect.height
  const scaleX = canvas.width / window.devicePixelRatio / canvasWidth
  const scaleY = canvas.height / window.devicePixelRatio / canvasHeight

  return {
    x: centerX,
    y: centerY - (img.height * img.scale) / 2
  }
})

const toggleCanvasFullscreen = async () => {
  if (!containerRef.value) return

  try {
    if (!isCanvasFullscreen.value) {
      // Enter fullscreen
      if (containerRef.value.requestFullscreen) {
        await containerRef.value.requestFullscreen()
      } else if ((containerRef.value as any).webkitRequestFullscreen) {
        await (containerRef.value as any).webkitRequestFullscreen()
      } else if ((containerRef.value as any).mozRequestFullScreen) {
        await (containerRef.value as any).mozRequestFullScreen()
      } else if ((containerRef.value as any).msRequestFullscreen) {
        await (containerRef.value as any).msRequestFullscreen()
      }
      isCanvasFullscreen.value = true
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
      }
      isCanvasFullscreen.value = false
    }

    // Wait for DOM update
    await nextTick()

    // Reinitialize canvas with new size
    setTimeout(() => {
      initCanvas()
    }, 100)
  } catch (error) {
    console.error('Fullscreen error:', error)
  }
}

// Handle fullscreen change events
const handleFullscreenChange = () => {
  const isFullscreen = !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  )

  if (!isFullscreen && isCanvasFullscreen.value) {
    isCanvasFullscreen.value = false
    nextTick(() => {
      setTimeout(() => {
        initCanvas()
      }, 100)
    })
  }
}

const handleUndo = () => {
  undo()
}

const handleClear = () => {
  if (confirm('确定要清空画布吗?')) {
    clear()
  }
}

const handleDone = () => {
  const dataUrl = getDataUrl()
  setCanvasDataUrl(dataUrl)
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    try {
      await addImage(file)
    } catch (error) {
      alert('图片上传失败，请重试')
      console.error(error)
    }
    // Reset input so the same file can be selected again
    target.value = ''
  }
}

const handleDeleteImage = () => {
  if (confirm('确定要删除选中的图片吗?')) {
    deleteSelectedImage()
  }
}

const handleRotationChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  updateSelectedImageRotation(parseFloat(target.value))
}

const handleScaleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  updateSelectedImageScale(parseFloat(target.value))
}

const handleOpacityChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  updateSelectedImageOpacity(parseFloat(target.value))
}

onMounted(() => {
  // Small delay to ensure canvas is properly sized
  setTimeout(() => {
    initCanvas()
  }, 100)

  // Add fullscreen change listeners
  if (process.client) {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (process.client) {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
  }
})
</script>

<style scoped>
canvas {
  cursor: crosshair;
}
</style>
