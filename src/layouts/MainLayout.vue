<template>
  <q-layout view="lHh Lpr lFf" class="bg-gray-9 text-white">
    <q-header elevated class="bg-dark">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title> Psicodecor </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-gray-8"
      style="overflow-y: hidden; position: relative"
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
      <q-scroll-area class="fit" style="height: 100%">
        <q-list class="q-pa-md">
          <q-item-label header class="text-white q-mb-md"> Editor </q-item-label>

          <q-expansion-item label="Base" default-opened class="q-mb-sm">
            <q-card class="bg-gray-9 q-pa-md">
              <q-input v-model="parts.base.color" label="Cor" type="color" dense class="q-mt-md" />
              <q-input
                v-model="parts.topPlate.color"
                label="Cor da Chapa"
                type="color"
                dense
                class="q-mt-md"
              />
              <q-select
                v-model="parts.topPlate.style"
                :options="topPlateStyleOptions"
                label="Estilo da Chapa"
                dense
                dark
                outlined
                emit-value
                map-options
                class="q-mt-md"
              />
              <div class="q-mt-md">
                <div class="text-caption">
                  Altura da Chapa: {{ parts.topPlate.height.toFixed(2) }}
                </div>
                <q-slider
                  v-model.number="parts.topPlate.height"
                  :min="0.02"
                  :max="0.3"
                  :step="0.01"
                  dark
                />
              </div>
              <q-input
                v-model="parts.base.content.color"
                label="Cor do Texto"
                type="color"
                dense
                class="q-mt-md"
              />
              <div class="q-mt-md">
                <div class="text-caption">Altura: {{ parts.base.height.toFixed(2) }}</div>
                <q-slider
                  v-model.number="parts.base.height"
                  :min="0.1"
                  :max="2"
                  :step="0.01"
                  dark
                />
              </div>
            </q-card>
          </q-expansion-item>

          <q-expansion-item label="Título" default-opened class="q-mb-sm">
            <q-card class="bg-gray-9 q-pa-md">
              <q-input
                v-model="parts.title.text"
                label="Texto"
                type="textarea"
                dense
                dark
                outlined
              />
              <q-input v-model="parts.title.color" label="Cor" type="color" dense class="q-mt-md" />
              <q-select
                v-model="parts.title.content.font"
                :options="fontOptions"
                label="Fonte"
                dense
                dark
                outlined
                emit-value
                map-options
                class="q-mt-md"
              />
              <div class="q-mt-md">
                <div class="text-caption">
                  Tamanho: {{ parts.title.content.fontSize.toFixed(0) }}
                </div>
                <q-slider
                  v-model.number="parts.title.content.fontSize"
                  :min="20"
                  :max="240"
                  :step="1"
                  dark
                />
              </div>
              <div class="q-mt-md">
                <div class="text-caption">
                  Espaçamento: {{ parts.title.content.letterSpacing.toFixed(2) }}
                </div>
                <q-slider
                  v-model.number="parts.title.content.letterSpacing"
                  :min="-5"
                  :max="30"
                  :step="0.1"
                  dark
                />
              </div>
              <div class="q-mt-md">
                <div class="text-caption">
                  Profundidade: {{ parts.title.content.depth.toFixed(2) }}
                </div>
                <q-slider
                  v-model.number="parts.title.content.depth"
                  :min="0"
                  :max="0.3"
                  :step="0.01"
                  dark
                />
              </div>
              <div class="q-mt-md">
                <div class="text-caption">Posição X: {{ parts.title.positionX.toFixed(2) }}</div>
                <q-slider
                  v-model.number="parts.title.positionX"
                  :min="-3"
                  :max="3"
                  :step="0.1"
                  dark
                />
              </div>
              <div class="q-mt-md">
                <div class="text-caption">Posição Y: {{ parts.title.positionY.toFixed(2) }}</div>
                <q-slider
                  v-model.number="parts.title.positionY"
                  :min="-2"
                  :max="2"
                  :step="0.1"
                  dark
                />
              </div>
            </q-card>
          </q-expansion-item>

          <q-expansion-item label="Subtítulo" default-opened class="q-mb-sm">
            <q-card class="bg-gray-9 q-pa-md">
              <q-input v-model="parts.base.content.text" label="Texto" dense dark outlined />
              <q-input
                v-model="parts.base.content.color"
                label="Cor"
                type="color"
                dense
                class="q-mt-md"
              />
              <q-select
                v-model="parts.base.content.font"
                :options="fontOptions"
                label="Fonte"
                dense
                dark
                outlined
                emit-value
                map-options
                class="q-mt-md"
              />
              <div class="q-mt-md">
                <div class="text-caption">
                  Tamanho: {{ parts.base.content.fontSize.toFixed(0) }}
                </div>
                <q-slider
                  v-model.number="parts.base.content.fontSize"
                  :min="14"
                  :max="180"
                  :step="1"
                  dark
                />
              </div>
              <div class="q-mt-md">
                <div class="text-caption">
                  Espaçamento: {{ parts.base.content.letterSpacing.toFixed(2) }}
                </div>
                <q-slider
                  v-model.number="parts.base.content.letterSpacing"
                  :min="-5"
                  :max="30"
                  :step="0.1"
                  dark
                />
              </div>
              <div class="q-mt-md">
                <div class="text-caption">
                  Profundidade: {{ parts.base.content.depth.toFixed(2) }}
                </div>
                <q-slider
                  v-model.number="parts.base.content.depth"
                  :min="0"
                  :max="0.3"
                  :step="0.01"
                  dark
                />
              </div>
              <div class="q-mt-md">
                <div class="text-caption">
                  Posição X: {{ parts.base.content.positionX.toFixed(2) }}
                </div>
                <q-slider
                  v-model.number="parts.base.content.positionX"
                  :min="-3"
                  :max="3"
                  :step="0.1"
                  dark
                />
              </div>
              <div class="q-mt-md">
                <div class="text-caption">
                  Posição Y: {{ parts.base.content.positionY.toFixed(2) }}
                </div>
                <q-slider
                  v-model.number="parts.base.content.positionY"
                  :min="-2"
                  :max="2"
                  :step="0.1"
                  dark
                />
              </div>
            </q-card>
          </q-expansion-item>

          <q-expansion-item label="Logo" default-opened class="q-mb-sm">
            <q-card class="bg-gray-9 q-pa-md">
              <q-file
                v-model="logoFile"
                label="Upload PNG"
                accept=".png,.jpg,.jpeg,.webp"
                @update:model-value="handleLogoUpload"
                hint="Selecione uma imagem"
                dark
                outlined
              />
              <div v-if="parts.logo.imageBase64" class="q-mt-md text-center">
                <img :src="parts.logo.imageBase64" style="max-width: 100%; max-height: 80px" />
              </div>
              <q-input
                v-model="parts.logo.color"
                label="Cor de Fundo"
                type="color"
                dense
                class="q-mt-md"
              />
              <div class="q-mt-md">
                <div class="text-caption">Largura: {{ parts.logo.width.toFixed(2) }}</div>
                <q-slider v-model.number="parts.logo.width" :min="0.1" :max="2" :step="0.01" dark />
              </div>
              <div class="q-mt-md">
                <div class="text-caption">Altura: {{ parts.logo.height.toFixed(2) }}</div>
                <q-slider
                  v-model.number="parts.logo.height"
                  :min="0.1"
                  :max="2"
                  :step="0.01"
                  dark
                />
              </div>
              <div class="q-mt-md">
                <div class="text-caption">Profundidade: {{ parts.logo.depth.toFixed(2) }}</div>
                <q-slider v-model.number="parts.logo.depth" :min="0" :max="0.3" :step="0.01" dark />
              </div>
              <div class="q-mt-md">
                <div class="text-caption">Posição X: {{ parts.logo.positionX.toFixed(2) }}</div>
                <q-slider
                  v-model.number="parts.logo.positionX"
                  :min="-3"
                  :max="3"
                  :step="0.1"
                  dark
                />
              </div>
              <div class="q-mt-md">
                <div class="text-caption">Posição Y: {{ parts.logo.positionY.toFixed(2) }}</div>
                <q-slider
                  v-model.number="parts.logo.positionY"
                  :min="-3"
                  :max="3"
                  :step="0.1"
                  dark
                />
              </div>

              <q-separator class="q-my-md" dark />
              <div class="text-caption text-weight-bold q-mb-sm">Edição de Imagem</div>

              <q-checkbox
                v-model="parts.logo.removeBg"
                label="Remover Fundo (cores claras)"
                dark
                dense
                class="q-mb-sm"
              />

              <div v-if="parts.logo.removeBg" class="q-mt-md">
                <div class="text-caption">
                  Sensibilidade: {{ parts.logo.bgThreshold.toFixed(0) }}
                </div>
                <q-slider
                  v-model.number="parts.logo.bgThreshold"
                  :min="0"
                  :max="255"
                  :step="1"
                  dark
                />
              </div>

              <div class="q-mt-md">
                <div class="text-caption">Brilho: {{ parts.logo.brightness.toFixed(0) }}</div>
                <q-slider
                  v-model.number="parts.logo.brightness"
                  :min="-100"
                  :max="100"
                  :step="1"
                  dark
                />
              </div>

              <div class="q-mt-md">
                <div class="text-caption">Contraste: {{ parts.logo.contrast.toFixed(0) }}</div>
                <q-slider
                  v-model.number="parts.logo.contrast"
                  :min="-100"
                  :max="100"
                  :step="1"
                  dark
                />
              </div>

              <div class="q-mt-md">
                <div class="text-caption">Saturação: {{ parts.logo.saturate.toFixed(0) }}</div>
                <q-slider
                  v-model.number="parts.logo.saturate"
                  :min="-100"
                  :max="100"
                  :step="1"
                  dark
                />
              </div>

              <div class="q-mt-md">
                <div class="text-caption">
                  Rotação de Cor: {{ parts.logo.hueShift.toFixed(0) }}°
                </div>
                <q-slider v-model.number="parts.logo.hueShift" :min="0" :max="360" :step="1" dark />
              </div>

              <q-checkbox
                v-model="parts.logo.invert"
                label="Inverter Cores"
                dark
                dense
                class="q-mt-sm"
              />
            </q-card>
          </q-expansion-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container style="overflow: hidden; height: 100%">
      <router-view style="width: 100%; height: 100%; display: block" />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { parts } from 'src/composables/data'

const leftDrawerOpen = ref(false)
const logoFile = ref(null)
const drawerWidth = ref(260)
let isResizing = false
let startX = 0
let startWidth = 0

const fontOptions = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Lato', value: 'Lato' },
  { label: 'Ubuntu', value: 'Ubuntu' },
  { label: 'Nunito', value: 'Nunito' },
  { label: 'Raleway', value: 'Raleway' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Oswald', value: 'Oswald' },
  { label: 'Source Sans 3', value: 'Source Sans 3' },
  { label: 'Bebas Neue', value: 'Bebas Neue' },
  { label: 'Cinzel', value: 'Cinzel' },
  { label: 'Cormorant Garamond', value: 'Cormorant Garamond' },
  { label: 'Abril Fatface', value: 'Abril Fatface' },
  { label: 'Archivo Black', value: 'Archivo Black' },
  { label: 'Fjalla One', value: 'Fjalla One' },
  { label: 'Josefin Sans', value: 'Josefin Sans' },
  { label: 'Pacifico', value: 'Pacifico' },
  { label: 'Bangers', value: 'Bangers' },
  { label: 'Orbitron', value: 'Orbitron' },
  { label: 'Righteous', value: 'Righteous' },
  { label: 'Rajdhani', value: 'Rajdhani' },
  { label: 'Sacramento', value: 'Sacramento' },
]

const topPlateStyleOptions = [
  { label: 'Canto Vivo', value: 'flat' },
  { label: 'Chanfrado Padrão', value: 'bevel' },
  { label: 'Chanfrado Leve', value: 'bevel-soft' },
  { label: 'Chanfrado Forte', value: 'bevel-strong' },
  { label: 'Filetado', value: 'bevel-round' },
  { label: 'Topo Rebaixado', value: 'top-inset' },
]

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function handleLogoUpload(file) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    parts.logo.imageBase64 = e.target.result
  }
  reader.readAsDataURL(file)
}

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
  const newWidth = Math.max(200, Math.min(600, startWidth + delta))
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
