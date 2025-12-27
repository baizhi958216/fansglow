<template>
  <div class="space-y-3">
    <div class="relative">
      <input
        v-model="localText"
        type="text"
        maxlength="8"
        placeholder="输入应援文字 (最多8字)"
        class="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-gray-800 focus:outline-none transition-colors"
        @input="handleInput"
      />
      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
        {{ localText.length }}/8
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLightStick } from '~/composables/useLightStick'

const { textContent, setTextContent } = useLightStick()

const localText = ref(textContent.value)

const handleInput = () => {
  setTextContent(localText.value)
}

watch(textContent, (newValue) => {
  localText.value = newValue
})
</script>
