<template>
  <div class="space-y-3">
    <h3 class="text-lg font-semibold text-gray-800">动画模式</h3>
    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="mode in animationModes"
        :key="mode.value"
        @click="selectAnimation(mode.value)"
        :class="[
          'py-3 px-4 rounded-lg font-semibold transition-all duration-200 text-left',
          animationMode === mode.value
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
      >
        <div class="text-sm">{{ mode.label }}</div>
        <div class="text-xs opacity-75 mt-1">{{ mode.description }}</div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLightStick } from '~/composables/useLightStick'
import type { AnimationMode } from '~/composables/useLightStick'

const { animationMode, setAnimationMode } = useLightStick()

interface AnimationModeOption {
  value: AnimationMode
  label: string
  description: string
}

const animationModes: AnimationModeOption[] = [
  { value: 'always-on', label: '常亮', description: '持续发光' },
  { value: 'breathing', label: '呼吸灯', description: '平滑渐变' },
  { value: 'slow-flash', label: '慢闪', description: '~1.5秒' },
  { value: 'fast-flash', label: '快闪', description: '~0.5秒' },
  { value: 'rainbow', label: '霓虹灯', description: '五颜六色' },
]

const selectAnimation = (mode: AnimationMode) => {
  setAnimationMode(mode)
}
</script>
