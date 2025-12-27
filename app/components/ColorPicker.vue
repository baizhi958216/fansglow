<template>
  <div class="space-y-2">
    <h3 class="text-base font-semibold text-gray-800">选择颜色</h3>
    <div class="flex gap-2 flex-wrap items-center">
      <button
        v-for="color in colorPresets"
        :key="color.name"
        @click="selectColor(color.value)"
        :class="[
          'w-12 h-12 rounded-full border-3 transition-all duration-200',
          selectedColor === color.value
            ? 'border-gray-800 scale-110'
            : 'border-gray-300 hover:border-gray-400'
        ]"
        :style="{ backgroundColor: color.value }"
        :aria-label="color.label"
      >
        <span class="sr-only">{{ color.label }}</span>
      </button>

      <!-- Custom color picker -->
      <div class="relative">
        <input
          type="color"
          v-model="customColor"
          @input="selectColor(customColor)"
          class="sr-only"
          id="custom-color-input"
        />
        <label
          for="custom-color-input"
          :class="[
            'w-12 h-12 rounded-full border-3 transition-all duration-200 cursor-pointer flex items-center justify-center',
            isCustomColor
              ? 'border-gray-800 scale-110'
              : 'border-gray-300 hover:border-gray-400'
          ]"
          :style="{ backgroundColor: customColor }"
        >
          <svg
            v-if="!isCustomColor"
            class="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span class="sr-only">自定义颜色</span>
        </label>
      </div>
    </div>
    <p class="text-xs text-gray-600">
      当前: {{ currentColorLabel }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLightStick, colorPresets } from '~/composables/useLightStick'

const { selectedColor, setColor } = useLightStick()

const customColor = ref('#FF0000')

const selectColor = (color: string) => {
  setColor(color)
}

const isCustomColor = computed(() => {
  return !colorPresets.some(c => c.value === selectedColor.value)
})

const currentColorLabel = computed(() => {
  const preset = colorPresets.find(c => c.value === selectedColor.value)
  if (preset) {
    return preset.label
  }
  return `自定义 (${selectedColor.value})`
})
</script>
