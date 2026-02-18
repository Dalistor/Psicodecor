<template>
  <q-layout view="lHh Lpr lFf" class="bg-gray-9 text-white">
    <q-header elevated class="bg-dark">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title> Psicodecor </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-gray-8">
      <q-scroll-area class="fit">
        <q-list>
          <q-item-label header class="text-white"> Editor </q-item-label>

          <q-expansion-item label="Base" default-opened>
            <q-input v-model="parts.base.content.text" label="Texto" dense dark />
            <q-input v-model="parts.base.color" label="Cor" type="color" dense />
            <q-input v-model="parts.base.content.color" label="Cor do Texto" type="color" dense />
            <q-slider
              v-model.number="parts.base.height"
              :min="0.1"
              :max="2"
              :step="0.01"
              dark
            />
          </q-expansion-item>

          <q-expansion-item label="Título" default-opened>
            <q-input v-model="parts.title.text" label="Texto" dense dark />
            <q-input v-model="parts.title.color" label="Cor" type="color" dense />
            <q-select
              v-model="parts.title.content.font"
              :options="fontOptions"
              label="Fonte"
              dense
              dark
              emit-value
              map-options
            />
            <q-slider
              v-model.number="parts.title.height"
              :min="0.1"
              :max="2"
              :step="0.01"
              dark
            />
            <q-slider
              v-model.number="parts.title.content.letterSpacing"
              :min="0.1"
              :max="2"
              :step="0.1"
              dark
            />
          </q-expansion-item>

          <q-expansion-item label="Logo" default-opened>
            <q-file
              v-model="logoFile"
              label="Upload PNG"
              accept=".png,.jpg,.jpeg,.webp"
              @update:model-value="handleLogoUpload"
              hint="Selecione uma imagem"
              dark
            />
            <div v-if="parts.logo.imageBase64" class="q-mt-md">
              <img
                :src="parts.logo.imageBase64"
                style="max-width: 100%; max-height: 100px; margin-bottom: 10px"
              />
            </div>
            <q-input v-model="parts.logo.color" label="Cor de Fundo" type="color" dense />
            <q-slider
              v-model.number="parts.logo.width"
              :min="0.1"
              :max="2"
              :step="0.01"
              dark
            />
            <q-slider
              v-model.number="parts.logo.height"
              :min="0.1"
              :max="2"
              :step="0.01"
              dark
            />
            <q-slider
              v-model.number="parts.logo.size"
              :min="0.01"
              :max="0.2"
              :step="0.01"
              dark
            />
          </q-expansion-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { parts } from 'src/composables/data'

const leftDrawerOpen = ref(false)
const logoFile = ref(null)

const fontOptions = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Lato', value: 'Lato' },
  { label: 'Ubuntu', value: 'Ubuntu' },
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
</script>
