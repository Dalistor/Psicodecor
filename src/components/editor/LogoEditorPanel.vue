<template>
  <div>
    <q-btn
      color="primary"
      icon="add"
      label="Adicionar Logo"
      size="sm"
      class="q-mb-md full-width"
      @click="$emit('add-logo')"
    />

    <q-expansion-item
      v-for="(logo, idx) in logos"
      :key="logo.id"
      :label="`${idx + 1}. ${logo.imageBase64 ? '✓ Logo' : 'Nova Logo'}`"
      icon="image"
      default-opened
      header-class="bg-gray-9 text-white"
      class="bg-gray-8 rounded q-mb-md"
    >
      <q-card class="bg-gray-9">
        <q-card-section class="q-gutter-md">
          <!-- File input for logo (PNG ou SVG) -->
          <div>
            <q-file
              v-model="logoFiles[idx]"
              label="Carregar Imagem (PNG/SVG)"
              accept="image/png,image/svg+xml"
              @update:model-value="(file) => $emit('upload-logo', { idx, file })"
            >
              <template v-slot:hint> PNG ou SVG apenas </template>
            </q-file>
          </div>

          <!-- Preview da imagem -->
          <div v-if="logo.imageBase64" class="q-pa-md bg-gray-8 rounded">
            <img :src="logo.imageBase64" style="max-width: 100%; max-height: 150px" alt="preview" />
            <div
              v-if="logo.imageBase64.startsWith('data:image/svg+xml')"
              class="text-positive text-caption q-mt-xs"
            >
              ✓ SVG - Extrusão 3D otimizada
            </div>
          </div>

          <!-- Cor (se necessário) -->
          <q-input v-model="logo.color" label="Cor" type="color" dense />

          <!-- Dimensões -->
          <div>
            <div class="text-caption">Largura: {{ logo.width.toFixed(2) }}mm</div>
            <q-slider v-model.number="logo.width" :min="5" :max="150" :step="0.5" dark />
          </div>

          <div>
            <div class="text-caption">Altura: {{ logo.height.toFixed(2) }}mm</div>
            <q-slider v-model.number="logo.height" :min="5" :max="150" :step="0.5" dark />
          </div>

          <!-- Profundidade -->
          <div>
            <div class="text-caption">Profundidade: {{ logo.depth.toFixed(2) }}mm</div>
            <q-slider v-model.number="logo.depth" :min="0" :max="20" :step="0.5" dark />
          </div>

          <!-- Posições -->
          <div>
            <div class="text-caption">Posição X: {{ logo.positionX.toFixed(2) }}</div>
            <div class="row q-gutter-sm items-center">
              <q-slider
                v-model.number="logo.positionX"
                :min="-150"
                :max="150"
                :step="0.01"
                dark
                class="col"
              />
              <q-input
                v-model.number="logo.positionX"
                type="number"
                dense
                dark
                outlined
                :step="0.01"
                style="width: 80px"
              />
            </div>
          </div>

          <div>
            <div class="text-caption">Posição Y: {{ logo.positionY.toFixed(2) }}</div>
            <div class="row q-gutter-sm items-center">
              <q-slider
                v-model.number="logo.positionY"
                :min="-80"
                :max="80"
                :step="0.01"
                dark
                class="col"
              />
              <q-input
                v-model.number="logo.positionY"
                type="number"
                dense
                dark
                outlined
                :step="0.01"
                style="width: 80px"
              />
            </div>
          </div>
          <div>
            <div class="text-caption">Posição Z: {{ logo.positionZ.toFixed(2) }}</div>
            <div class="row q-gutter-sm items-center">
              <q-slider
                v-model.number="logo.positionZ"
                :min="-80"
                :max="80"
                :step="0.01"
                dark
                class="col"
              />
              <q-input
                v-model.number="logo.positionZ"
                type="number"
                dense
                dark
                outlined
                :step="0.01"
                style="width: 80px"
              />
            </div>
          </div>

          <!-- Filtros de Imagem -->
          <div class="text-subtitle2 q-mt-lg">Filtros</div>

          <div>
            <div class="text-caption">Remover Fundo: {{ logo.imageFilters.removeBgThreshold }}</div>
            <q-slider
              v-model.number="logo.imageFilters.removeBgThreshold"
              :min="0"
              :max="255"
              :step="1"
              dark
            />
          </div>

          <div>
            <div class="text-caption">Brilho: {{ logo.imageFilters.brightness }}</div>
            <q-slider
              v-model.number="logo.imageFilters.brightness"
              :min="-100"
              :max="100"
              :step="1"
              dark
            />
          </div>

          <div>
            <div class="text-caption">Contraste: {{ logo.imageFilters.contrast }}</div>
            <q-slider
              v-model.number="logo.imageFilters.contrast"
              :min="-100"
              :max="100"
              :step="1"
              dark
            />
          </div>

          <div>
            <div class="text-caption">Saturação: {{ logo.imageFilters.saturation }}</div>
            <q-slider
              v-model.number="logo.imageFilters.saturation"
              :min="-100"
              :max="100"
              :step="1"
              dark
            />
          </div>

          <div>
            <div class="text-caption">Matiz: {{ logo.imageFilters.hueShift }}</div>
            <q-slider
              v-model.number="logo.imageFilters.hueShift"
              :min="0"
              :max="360"
              :step="1"
              dark
            />
          </div>

          <div>
            <q-checkbox v-model="logo.imageFilters.invert" label="Inverter Cores" dark />
          </div>

          <!-- Botão remover -->
          <q-btn
            color="negative"
            icon="delete"
            label="Remover"
            size="sm"
            class="full-width q-mt-md"
            @click="$emit('delete-logo', idx)"
          />
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue'

const props = defineProps({
  logos: {
    type: Array,
    required: true,
  },
})

defineEmits(['add-logo', 'delete-logo', 'upload-logo'])

const logoFiles = ref({})

const defaultFilters = {
  removeBgThreshold: 30,
  brightness: 0,
  contrast: 0,
  hueShift: 0,
  saturation: 0,
  invert: false,
}

watchEffect(() => {
  props.logos.forEach((logo) => {
    if (!logo.imageFilters) {
      logo.imageFilters = { ...defaultFilters }
      return
    }
    for (const key of Object.keys(defaultFilters)) {
      if (logo.imageFilters[key] === undefined) {
        logo.imageFilters[key] = defaultFilters[key]
      }
    }
  })
})
</script>
