<template>
  <q-expansion-item
    label="Placa Base"
    icon="home"
    default-opened
    header-class="bg-gray-9 text-white"
    class="bg-gray-8 rounded q-mb-md"
  >
    <q-card class="bg-gray-9">
      <q-card-section class="q-gutter-md">
        <q-input v-model="base.color" label="Cor Base" type="color" dense />
        <q-input v-model="topPlate.color" label="Cor da Chapa" type="color" dense />
        <q-select
          v-model="topPlate.style"
          :options="topPlateStyleOptions"
          label="Estilo da Chapa"
          dense
          dark
          outlined
          emit-value
          map-options
        />
        <div>
          <div class="text-caption">Altura da Chapa: {{ topPlate.height.toFixed(2) }}mm</div>
          <q-slider v-model.number="topPlate.height" :min="1" :max="15" :step="0.5" dark />
        </div>
        <div>
          <div class="text-caption">Altura da Base: {{ base.height.toFixed(2) }}mm</div>
          <q-slider v-model.number="base.height" :min="5" :max="80" :step="0.5" dark />
        </div>
        <div>
          <div class="text-caption">Profundidade da Base: {{ base.depth.toFixed(2) }}mm</div>
          <q-slider v-model.number="base.depth" :min="10" :max="120" :step="0.5" dark />
        </div>
      </q-card-section>
    </q-card>
  </q-expansion-item>

  <!-- Subtítulo -->
  <q-expansion-item
    label="Subtítulo"
    icon="text_fields"
    default-opened
    header-class="bg-gray-9 text-white"
    class="bg-gray-8 rounded"
  >
    <q-card class="bg-gray-9">
      <q-card-section class="q-gutter-md">
        <q-input v-model="parts.base.content.text" label="Texto" dense dark outlined />
        <q-input v-model="parts.base.content.color" label="Cor" type="color" dense />
        <q-select
          v-model="parts.base.content.font"
          :options="fontOptions"
          label="Fonte"
          dense
          dark
          outlined
          emit-value
          map-options
        />
        <div>
          <div class="text-caption">Tamanho: {{ parts.base.content.fontSize.toFixed(0) }}</div>
          <q-slider
            v-model.number="parts.base.content.fontSize"
            :min="6"
            :max="80"
            :step="1"
            dark
          />
        </div>
        <div>
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
        <div>
          <div class="text-caption">Profundidade: {{ parts.base.content.depth.toFixed(2) }}mm</div>
          <q-slider v-model.number="parts.base.content.depth" :min="0" :max="20" :step="0.5" dark />
        </div>
        <div>
          <div class="text-caption">Tipo de Renderização</div>
          <q-select
            v-model="parts.base.content.renderType"
            :options="renderTypeOptions"
            label="Modo"
            dense
            dark
            outlined
            emit-value
            map-options
          />
        </div>
        <div v-if="parts.base.content.renderType === 'boxObject'">
          <div class="text-caption">Cor de Fundo</div>
          <div class="row q-gutter-sm items-center">
            <q-input
              v-model="parts.base.content.backgroundColor"
              label="Fundo"
              type="color"
              dense
              style="width: 100px"
            />
            <q-btn
              v-if="parts.base.content.backgroundColor"
              flat
              dense
              icon="clear"
              color="white"
              size="sm"
              @click="parts.base.content.backgroundColor = null"
            >
              <q-tooltip>Transparente</q-tooltip>
            </q-btn>
            <div class="text-caption text-grey-5">
              {{ parts.base.content.backgroundColor ? '' : 'Transparente' }}
            </div>
          </div>
        </div>
        <div>
          <div class="text-caption">
            Posição X: {{ (Number(parts.base.content.positionX) || 0).toFixed(2) }}
          </div>
          <div class="row q-gutter-sm items-center">
            <q-slider
              v-model.number="parts.base.content.positionX"
              :min="-150"
              :max="150"
              :step="0.01"
              dark
              class="col"
            />
            <q-input
              v-model.number="parts.base.content.positionX"
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
          <div class="text-caption">
            Posição Y: {{ (Number(parts.base.content.positionY) || 0).toFixed(2) }}
          </div>
          <div class="row q-gutter-sm items-center">
            <q-slider
              v-model.number="parts.base.content.positionY"
              :min="-80"
              :max="80"
              :step="0.01"
              dark
              class="col"
            />
            <q-input
              v-model.number="parts.base.content.positionY"
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
          <div class="text-caption">
            Posição Z: {{ (Number(parts.base.content.positionZ) || 0).toFixed(2) }}
          </div>
          <div class="row q-gutter-sm items-center">
            <q-slider
              v-model.number="parts.base.content.positionZ"
              :min="-80"
              :max="80"
              :step="0.01"
              dark
              class="col"
            />
            <q-input
              v-model.number="parts.base.content.positionZ"
              type="number"
              dense
              dark
              outlined
              :step="0.01"
              style="width: 80px"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { parts } from 'src/composables/data'

defineProps({
  fontOptions: {
    type: Array,
    required: true,
  },
  topPlateStyleOptions: {
    type: Array,
    required: true,
  },
  renderTypeOptions: {
    type: Array,
    required: true,
  },
})

const base = computed(() => parts.base)
const topPlate = computed(() => parts.topPlate)

watchEffect(() => {
  const content = parts.base.content
  content.positionX = Number(content.positionX) || 0
  content.positionY = Number(content.positionY) || 0
  content.positionZ = Number(content.positionZ) || 0
})
</script>
