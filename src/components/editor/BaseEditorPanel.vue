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
        <q-input v-model="subtitle.text" label="Texto" dense dark outlined />
        <q-input v-model="subtitle.color" label="Cor" type="color" dense />
        <q-select
          v-model="subtitle.font"
          :options="fontOptions"
          label="Fonte"
          dense
          dark
          outlined
          emit-value
          map-options
        />
        <div>
          <div class="text-caption">Tamanho: {{ subtitle.fontSize.toFixed(0) }}</div>
          <q-slider v-model.number="subtitle.fontSize" :min="6" :max="80" :step="1" dark />
        </div>
        <div>
          <div class="text-caption">Espaçamento: {{ subtitle.letterSpacing.toFixed(2) }}</div>
          <q-slider v-model.number="subtitle.letterSpacing" :min="-5" :max="30" :step="0.1" dark />
        </div>
        <div>
          <div class="text-caption">Profundidade: {{ subtitle.depth.toFixed(2) }}mm</div>
          <q-slider v-model.number="subtitle.depth" :min="0" :max="20" :step="0.5" dark />
        </div>
        <div>
          <div class="text-caption">Tipo de Renderização</div>
          <q-select
            v-model="subtitle.renderType"
            :options="renderTypeOptions"
            label="Modo"
            dense
            dark
            outlined
            emit-value
            map-options
          />
        </div>
        <div v-if="subtitle.renderType === 'boxObject'">
          <div class="text-caption">Cor de Fundo</div>
          <div class="row q-gutter-sm items-center">
            <q-input
              v-model="subtitle.backgroundColor"
              label="Fundo"
              type="color"
              dense
              style="width: 100px"
            />
            <q-btn
              v-if="subtitle.backgroundColor"
              flat
              dense
              icon="clear"
              color="white"
              size="sm"
              @click="subtitle.backgroundColor = null"
            >
              <q-tooltip>Transparente</q-tooltip>
            </q-btn>
            <div class="text-caption text-grey-5">
              {{ subtitle.backgroundColor ? '' : 'Transparente' }}
            </div>
          </div>
        </div>
        <div>
          <div class="text-caption">Posição X: {{ subtitle.positionX.toFixed(2) }}</div>
          <div class="row q-gutter-sm items-center">
            <q-slider
              v-model.number="subtitle.positionX"
              :min="-150"
              :max="150"
              :step="0.01"
              dark
              class="col"
            />
            <q-input
              v-model.number="subtitle.positionX"
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
          <div class="text-caption">Posição Y: {{ subtitle.positionY.toFixed(2) }}</div>
          <div class="row q-gutter-sm items-center">
            <q-slider
              v-model.number="subtitle.positionY"
              :min="-80"
              :max="80"
              :step="0.01"
              dark
              class="col"
            />
            <q-input
              v-model.number="subtitle.positionY"
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
          <div class="text-caption">Posição Z: {{ subtitle.positionZ.toFixed(2) }}</div>
          <div class="row q-gutter-sm items-center">
            <q-slider
              v-model.number="subtitle.positionZ"
              :min="-80"
              :max="80"
              :step="0.01"
              dark
              class="col"
            />
            <q-input
              v-model.number="subtitle.positionZ"
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
import { computed } from 'vue'
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
const subtitle = computed(() => parts.base.content)
</script>
