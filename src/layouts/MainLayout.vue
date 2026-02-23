<template>
  <q-layout view="lHh Lpr lFf" class="bg-gray-9 text-white">
    <q-header elevated class="bg-dark">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title> Psicodecor </q-toolbar-title>
        <q-btn flat dense round icon="refresh" @click="reloadApp" title="Recarregar Aplicação" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-gray-8"
      style="
        overflow-y: hidden;
        position: relative;
        display: flex;
        flex-direction: column;
        pointer-events: auto;
      "
      :width="drawerWidth"
    >
      <div
        class="resize-handle"
        @mousedown="startResize"
        style="
          position: absolute;
          right: 0;
          top: 0;
          width: 4px;
          height: 100%;
          cursor: col-resize;
          background-color: rgba(255, 255, 255, 0.1);
          z-index: 100;
          transition: background-color 0.2s;
        "
        @mouseenter="$event.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'"
        @mouseleave="$event.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'"
      />

      <!-- Abas de navegação -->
      <q-tabs
        v-model="activeTab"
        dense
        class="text-white"
        active-color="primary"
        indicator-color="primary"
        align="left"
        style="background-color: rgba(0, 0, 0, 0.3)"
      >
        <q-tab name="base" label="Base" icon="home" />
        <q-tab name="titles" label="Títulos" icon="text_fields" />
        <q-tab name="logos" label="Logos" icon="image" />
      </q-tabs>

      <!-- Conteúdo das abas -->
      <q-scroll-area class="flex-1" style="flex-grow: 1">
        <q-tab-panels v-model="activeTab" animated>
          <!-- ABA: BASE -->
          <q-tab-panel name="base" class="q-pa-md">
            <BaseEditorPanel
              :font-options="fontOptions"
              :top-plate-style-options="topPlateStyleOptions"
              :render-type-options="renderTypeOptions"
            />
          </q-tab-panel>

          <!-- ABA: TÍTULOS -->
          <q-tab-panel name="titles" class="q-pa-md">
            <TitleEditorPanel
              :titles="parts.titles"
              :font-options="fontOptions"
              :render-type-options="renderTypeOptions"
              @add-title="addTitle"
              @delete-title="deleteTitle"
            />
          </q-tab-panel>

          <!-- ABA: LOGOS -->
          <q-tab-panel name="logos" class="q-pa-md">
            <LogoEditorPanel
              :logos="parts.logos"
              @add-logo="addLogo"
              @delete-logo="deleteLogo"
              @upload-logo="handleLogoUpload"
            />
          </q-tab-panel>
        </q-tab-panels>
      </q-scroll-area>
    </q-drawer>

    <q-page-container style="overflow: hidden; height: 100%">
      <router-view style="width: 100%; height: 100%; display: block" />
    </q-page-container>

    <!-- Save Manager -->
    <SaveManager />
  </q-layout>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { parts } from 'src/composables/data'
import BaseEditorPanel from 'src/components/editor/BaseEditorPanel.vue'
import TitleEditorPanel from 'src/components/editor/TitleEditorPanel.vue'
import LogoEditorPanel from 'src/components/editor/LogoEditorPanel.vue'
import SaveManager from 'src/components/SaveManager.vue'

// Estado do layout
const leftDrawerOpen = ref(false)
const drawerWidth = ref(450)
let isResizing = false
let startX = 0
let startWidth = 0
const activeTab = ref('base')

// Configurações de opções
const renderTypeOptions = [{ label: 'TextGeometry 3D', value: 'textGeometry' }]

const fontOptions = [
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Great Vibes', value: 'Great Vibes' },
  { label: 'Allura', value: 'Allura' },
  { label: 'Alex Brush', value: 'Alex Brush' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Ubuntu', value: 'Ubuntu' },
]

const topPlateStyleOptions = [
  { label: 'Canto Vivo', value: 'flat' },
  { label: 'Chanfrado Padrão', value: 'bevel' },
  { label: 'Chanfrado Leve', value: 'bevel-soft' },
  { label: 'Chanfrado Forte', value: 'bevel-strong' },
  { label: 'Filetado', value: 'bevel-round' },
  { label: 'Topo Rebaixado', value: 'top-inset' },
]

// Funções de UI
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

// Funções para gerenciar títulos
function addTitle() {
  parts.titles.push({
    id: Date.now() + Math.random(),
    text: 'Novo Título',
    font: 'Roboto',
    fontSize: 45,
    color: '#ffc504',
    letterSpacing: 1.0,
    depth: 2,
    positionX: 0,
    positionY: 6,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    renderType: 'textGeometry',
  })
}

function deleteTitle(idx) {
  parts.titles.splice(idx, 1)
}

// Funções para gerenciar logos
function addLogo() {
  parts.logos.push({
    id: Date.now() + Math.random(),
    imageBase64: '',
    width: 40,
    height: 40,
    color: '#ffffff',
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    depth: 2,
    imageFilters: {
      removeBgThreshold: 30,
      brightness: 0,
      contrast: 0,
      hueShift: 0,
      saturation: 0,
      invert: false,
    },
  })
}

function deleteLogo(idx) {
  parts.logos.splice(idx, 1)
}

function handleLogoUpload({ idx, file }) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    parts.logos[idx].imageBase64 = e.target.result
  }
  reader.readAsDataURL(file)
}

// Recarregar aplicação
function reloadApp() {
  location.reload()
}

// Funções de resize do drawer
function startResize(e) {
  isResizing = true
  startX = e.clientX
  startWidth = drawerWidth.value
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(e) {
  if (!isResizing) return
  const delta = e.clientX - startX
  const newWidth = Math.max(300, Math.min(900, startWidth + delta))
  drawerWidth.value = newWidth
}

function stopResize() {
  isResizing = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
/* Permitir que a página e o canvas recebam eventos mesmo com drawer aberto */
:deep(.q-page-container) {
  pointer-events: auto;
  z-index: 0;
}

/* Garantir que o canvas do Three.js está acessível */
:deep(canvas) {
  pointer-events: auto;
}

/* O drawer fica acima mas sem bloquear a página */
:deep(.q-drawer__content) {
  pointer-events: auto;
}
</style>
