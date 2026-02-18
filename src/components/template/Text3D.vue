<template>
  <Mesh :position="position" :rotation="rotation" cast-shadow receive-shadow>
    <TextGeometry :args="[text, options]" />
    <StandardMaterial
      :color="color"
      :emissive="emissive"
      :roughness="roughness"
      :metalness="metalness"
    />
  </Mesh>
</template>

<script setup>
import { computed } from 'vue'
import { Mesh, TextGeometry, StandardMaterial } from 'troisjs'

const props = defineProps({
  text: { type: String, default: '' },
  size: { type: Number, default: 1 },
  height: { type: Number, default: 0.5 },
  color: { type: Number, default: 0xffffff },
  emissive: { type: Number, default: 0x000000 },
  roughness: { type: Number, default: 0.3 },
  metalness: { type: Number, default: 0.1 },
  position: { type: Object, default: () => ({ x: 0, y: 0, z: 0 }) },
  rotation: { type: Object, default: () => ({ x: 0, y: 0, z: 0 }) },
  bevelEnabled: { type: Boolean, default: true },
  bevelSize: { type: Number, default: 0.05 },
  bevelSegments: { type: Number, default: 3 },
})

const options = computed(() => ({
  font: 'helvetiker', // Você pode carregar fontes customizadas
  size: props.size,
  height: props.height,
  curveSegments: 12,
  bevelEnabled: props.bevelEnabled,
  bevelThickness: 0.1,
  bevelSize: props.bevelSize,
  bevelOffset: 0,
  bevelSegments: props.bevelSegments,
}))
</script>
