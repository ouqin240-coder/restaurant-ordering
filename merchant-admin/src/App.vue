<template>
  <router-view />
</template>

<script setup lang="ts">
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; }
body { font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif; }
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: #f1f1f1; }
::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: #aaa; }

/* ─── Element Plus 全局主色换烧烤橙 ─── */
:root {
  --el-color-primary: #FF5722;
  --el-color-primary-light-3: #FF8A65;
  --el-color-primary-light-5: #FFAB91;
  --el-color-primary-light-7: #FFCCBC;
  --el-color-primary-light-8: #FBE9E7;
  --el-color-primary-light-9: #FFF3E0;
  --el-color-primary-dark-2: #E64A19;
}
.el-button--primary {
  --el-button-bg-color: #FF5722;
  --el-button-border-color: #FF5722;
  --el-button-hover-bg-color: #FF8A65;
  --el-button-hover-border-color: #FF8A65;
  --el-button-active-bg-color: #E64A19;
  --el-button-active-border-color: #E64A19;
}
.el-menu-item.is-active {
  background: rgba(255,87,34,0.12) !important;
  color: #FF9800 !important;
}
.el-switch.is-checked .el-switch__core {
  background-color: #FF5722 !important;
  border-color: #FF5722 !important;
}
.el-pagination .is-active {
  background-color: #FF5722 !important;
}
.el-tabs__active-bar {
  background-color: #FF5722 !important;
}
.el-tabs__item.is-active {
  color: #FF5722 !important;
}

/* 图片预览层级高于表格固定列 */
.el-image-viewer__wrapper { z-index: 99999 !important; }
.el-table__fixed-right { z-index: 1 !important; }
</style>
