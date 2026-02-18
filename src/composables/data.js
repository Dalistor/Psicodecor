import { reactive } from 'vue'

export const parts = reactive({
  base: {
    color: '#0a0a0a',
    weight: 500,
    height: 0.5,
    content: {
      text: 'Teste',
      font: 'Arial',
      fontSize: 70,
      align: 'center',
      lineHeight: 100,
      letterSpacing: 0.5,
      depth: 0.05,
      color: '#ffd500',
      positionX: 0,
      positionY: 0,
    },
  },
  topPlate: {
    color: '#1a1a1a',
    height: 0.06,
    style: 'bevel',
  },
  title: {
    color: '#ffc504',
    text: `Título do Projeto`,
    weight: 80,
    height: 0.4,
    positionX: 0,
    positionY: 0,
    content: {
      font: 'Roboto',
      fontSize: 120,
      align: 'center',
      lineHeight: 1.2,
      letterSpacing: 1.0,
      depth: 0.05,
    },
  },
  logo: {
    svg: '',
    imageBase64: '',
    width: 1.0,
    height: 1.0,
    size: 0.05,
    color: '#ffffff',
    positionX: -1.4,
    positionY: 0,
    depth: 0.05,
    // Edição de imagem
    removeBg: false,
    bgThreshold: 30,
    brightness: 0,
    contrast: 0,
    hueShift: 0,
    saturate: 0,
    invert: false,
  },
})

export const sceneConfig = {
  camera: {
    position: { x: 5, y: 3, z: 8 },
    target: { x: 0, y: 0.3, z: 0 },
  },
  lighting: {
    ambient: 0x404060,
    mainLight: { intensity: 1.5, position: { x: 5, y: 8, z: 5 } },
    backLight: { intensity: 0.5, position: { x: -3, y: 4, z: -3 } },
  },
  shadows: true,
  grid: true,
  axes: false,
}

if (import.meta.hot) {
  import.meta.hot.accept()
}
