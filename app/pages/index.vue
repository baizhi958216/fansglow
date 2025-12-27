<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
    <div class="max-w-md mx-auto space-y-8">

      <!-- Settings Card -->
      <div class="bg-white rounded-2xl shadow-lg p-6 space-y-6">
        <!-- Color Picker -->
        <ColorPicker />

        <!-- Display Mode Selector -->
        <div class="space-y-3">
          <h3 class="text-lg font-semibold text-gray-800">显示模式</h3>
          <div class="flex gap-3">
            <button
              @click="setDisplayMode('text')"
              :class="[
                'flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200',
                displayMode === 'text'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              文字
            </button>
            <button
              @click="setDisplayMode('canvas')"
              :class="[
                'flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200',
                displayMode === 'canvas'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              手写
            </button>
          </div>
        </div>

        <!-- Text Input (shown when text mode is selected) -->
        <TextInput v-if="displayMode === 'text'" />

        <!-- Canvas Drawing (shown when canvas mode is selected) -->
        <CanvasDrawing v-if="displayMode === 'canvas'" />

        <!-- Animation Selector -->
        <AnimationSelector />

        <!-- Start Button -->
        <button
          @click="enterFullscreen"
          :disabled="!canEnterFullscreen"
          :class="[
            'w-full py-4 rounded-lg font-bold text-lg transition-all duration-200',
            canEnterFullscreen
              ? 'bg-gray-900 text-white hover:bg-gray-800 active:scale-95'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          立即应援
        </button>

        <p class="text-xs text-center text-gray-500">
          点击屏幕任意位置退出全屏
        </p>
      </div>

      <!-- Info -->
      <div class="text-center text-sm text-gray-500">
        <p>离线可用 · 无需安装</p>
      </div>
    </div>

    <!-- Light Display Component -->
    <LightDisplay />
  </div>
</template>

<script setup lang="ts">
import { useLightStick } from '~/composables/useLightStick'

const {
  displayMode,
  canEnterFullscreen,
  setDisplayMode,
  setFullscreen
} = useLightStick()

const enterFullscreen = async () => {
  if (!canEnterFullscreen.value) return

  try {
    await document.documentElement.requestFullscreen()
    setFullscreen(true)
  } catch (error) {
    console.error('Failed to enter fullscreen:', error)
    // Fallback: still show the display even if fullscreen fails
    setFullscreen(true)
  }
}
</script>
