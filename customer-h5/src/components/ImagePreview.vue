<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="show" class="image-preview-overlay" @click="$emit('close')">
        <img :src="src" class="image-preview-img" @click.stop />
        <div class="image-preview-close" @click="$emit('close')">✕</div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
defineProps<{ show: boolean; src: string }>();
defineEmits(['close']);
</script>

<style>
.image-preview-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(0, 0, 0, 0.9) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 99999 !important;
}

.image-preview-img {
  max-width: 90vw !important;
  max-height: 85vh !important;
  object-fit: contain !important;
  border-radius: 8px;
  user-select: none;
  -webkit-user-drag: none;
}

.image-preview-close {
  position: absolute !important;
  top: 20px !important;
  right: 20px !important;
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  font-size: 18px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
