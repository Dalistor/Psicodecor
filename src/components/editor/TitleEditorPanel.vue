<template>
  <div>
    <q-btn
      color="primary"
      icon="add"
      label="Adicionar Título"
      size="sm"
      class="q-mb-md full-width"
      @click="$emit('add-title')"
    />

    <q-expansion-item
      v-for="(title, idx) in titles"
      :key="title.id || idx"
      :label="`${idx + 1}. ${title.text || 'Novo Título'}`"
      icon="text_fields"
      default-opened
      header-class="bg-gray-9 text-white"
      class="bg-gray-8 rounded q-mb-md"
    >
      <q-card class="bg-gray-9">
        <q-card-section class="q-gutter-md">
          <q-input v-model="title.text" label="Texto" dense dark outlined />
          <q-input v-model="title.color" label="Cor" type="color" dense />
          <q-select
            v-model="title.font"
            :options="fontOptions"
            label="Fonte"
            dense
            dark
            outlined
            emit-value
            map-options
          />
          <div>
            <div class="text-caption">Tamanho: {{ title.fontSize.toFixed(0) }}</div>
            <q-slider v-model.number="title.fontSize" :min="8" :max="120" :step="1" dark />
          </div>
          <div>
            <div class="text-caption">Espaçamento: {{ title.letterSpacing.toFixed(2) }}</div>
            <q-slider v-model.number="title.letterSpacing" :min="-5" :max="30" :step="0.1" dark />
          </div>
          <div>
            <div class="text-caption">Profundidade: {{ title.depth.toFixed(2) }}mm</div>
            <q-slider v-model.number="title.depth" :min="0" :max="20" :step="0.5" dark />
          </div>
          <div>
            <div class="text-caption">Tipo de Renderização</div>
            <q-select
              v-model="title.renderType"
              :options="renderTypeOptions"
              label="Modo"
              dense
              dark
              outlined
              emit-value
              map-options
            />
          </div>
          <div v-if="title.renderType === 'boxObject'">
            <div class="text-caption">Cor de Fundo</div>
            <div class="row q-gutter-sm items-center">
              <q-input
                v-model="title.backgroundColor"
                label="Fundo"
                type="color"
                dense
                style="width: 100px"
              />
              <q-btn
                v-if="title.backgroundColor"
                flat
                dense
                icon="clear"
                color="white"
                size="sm"
                @click="title.backgroundColor = null"
              >
                <q-tooltip>Transparente</q-tooltip>
              </q-btn>
              <div class="text-caption text-grey-5">
                {{ title.backgroundColor ? '' : 'Transparente' }}
              </div>
            </div>
          </div>
          <div>
            <div class="text-caption">
              Posição X: {{ (Number(title.positionX) || 0).toFixed(2) }}
            </div>
            <div class="row q-gutter-sm items-center">
              <q-slider
                v-model.number="title.positionX"
                :min="-150"
                :max="150"
                :step="0.01"
                dark
                class="col"
              />
              <q-input
                v-model.number="title.positionX"
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
              Posição Y: {{ (Number(title.positionY) || 0).toFixed(2) }}
            </div>
            <div class="row q-gutter-sm items-center">
              <q-slider
                v-model.number="title.positionY"
                :min="-80"
                :max="80"
                :step="0.01"
                dark
                class="col"
              />
              <q-input
                v-model.number="title.positionY"
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
              Posição Z: {{ (Number(title.positionZ) || 0).toFixed(2) }}
            </div>
            <div class="row q-gutter-sm items-center">
              <q-slider
                v-model.number="title.positionZ"
                :min="-80"
                :max="80"
                :step="0.01"
                dark
                class="col"
              />
              <q-input
                v-model.number="title.positionZ"
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
              Rotação X: {{ (Number(title.rotationX) || 0).toFixed(0) }}°
            </div>
            <div class="row q-gutter-sm items-center">
              <q-slider
                v-model.number="title.rotationX"
                :min="-180"
                :max="180"
                :step="1"
                dark
                class="col"
              />
              <q-input
                v-model.number="title.rotationX"
                type="number"
                dense
                dark
                outlined
                :step="1"
                style="width: 80px"
              />
            </div>
          </div>
          <div>
            <div class="text-caption">
              Rotação Y: {{ (Number(title.rotationY) || 0).toFixed(0) }}°
            </div>
            <div class="row q-gutter-sm items-center">
              <q-slider
                v-model.number="title.rotationY"
                :min="-180"
                :max="180"
                :step="1"
                dark
                class="col"
              />
              <q-input
                v-model.number="title.rotationY"
                type="number"
                dense
                dark
                outlined
                :step="1"
                style="width: 80px"
              />
            </div>
          </div>
          <div>
            <div class="text-caption">
              Rotação Z: {{ (Number(title.rotationZ) || 0).toFixed(0) }}°
            </div>
            <div class="row q-gutter-sm items-center">
              <q-slider
                v-model.number="title.rotationZ"
                :min="-180"
                :max="180"
                :step="1"
                dark
                class="col"
              />
              <q-input
                v-model.number="title.rotationZ"
                type="number"
                dense
                dark
                outlined
                :step="1"
                style="width: 80px"
              />
            </div>
          </div>
          <q-btn
            color="negative"
            icon="delete"
            label="Remover"
            size="sm"
            class="full-width"
            @click="$emit('delete-title', idx)"
          />
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup>
import { watchEffect } from 'vue'
const props = defineProps({
  titles: {
    type: Array,
    required: true,
  },
  fontOptions: {
    type: Array,
    required: true,
  },
  renderTypeOptions: {
    type: Array,
    required: true,
  },
})

defineEmits(['add-title', 'delete-title'])

watchEffect(() => {
  if (!Array.isArray(props.titles)) return
  props.titles.forEach((title) => {
    title.positionX = Number(title.positionX) || 0
    title.positionY = Number(title.positionY) || 0
    title.positionZ = Number(title.positionZ) || 0
    if (title.rotationX === undefined || title.rotationX === null) {
      title.rotationX = 0
    }
    if (title.rotationY === undefined || title.rotationY === null) {
      title.rotationY = 0
    }
    if (title.rotationZ === undefined || title.rotationZ === null) {
      title.rotationZ = 0
    }
  })
})
</script>
