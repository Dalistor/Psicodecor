import { reactive } from 'vue'

// Sistema em mm: valores salvos em milimetros

// Helper para criar elemento de texto padrão
function createTextElement(text = '', depth = 1.5, positionX = 0, positionY = 0, positionZ = 0) {
  return {
    id: Date.now() + Math.random(),
    text,
    font: 'Roboto',
    fontSize: 18,
    color: '#ffd500',
    letterSpacing: 0.8,
    depth: depth,
    positionX: positionX,
    positionY: positionY,
    positionZ: positionZ,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    renderType: 'textGeometry',
    backgroundColor: null,
  }
}

// Helper para criar elemento de logo padrão
function createLogoElement() {
  return {
    id: Date.now() + Math.random(),
    imageBase64: '',
    width: 40,
    height: 40,
    color: '#ffffff',
    positionX: -110,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    depth: 2,
    renderType: 'boxObject', // 'boxObject' ou 'imageTexture'
    imageFilters: {
      removeBgThreshold: 30,
      brightness: 0,
      contrast: 0,
      hueShift: 0,
      saturation: 0,
      invert: false,
    },
  }
}

export const parts = reactive({
  base: {
    color: '#0a0a0a',
    width: 300,
    depth: 40,
    height: 25,
    content: createTextElement('Profissão', 0, 0, 0, 0),
  },
  topPlate: {
    color: '#1a1a1a',
    height: 5,
    style: 'top-inset',
  },
  titles: [
    {
      ...createTextElement('Nome', 1.5, 30, 0, 0),
      id: 'title-main',
      fontSize: 25,
      font: 'Roboto',
      letterSpacing: 1.0,
      positionY: 6,
    },
  ],
  logos: [createLogoElement()],
})

export const sceneConfig = {
  camera: {
    position: { x: 220, y: 160, z: 280 },
    target: { x: 0, y: 20, z: 0 },
  },
  lighting: {
    ambient: 0x404060,
    mainLight: { intensity: 1.3, position: { x: 220, y: 260, z: 160 } },
    backLight: { intensity: 0.5, position: { x: -120, y: 140, z: -160 } },
  },
  shadows: true,
  grid: true,
  axes: false,
}

if (import.meta.hot) {
  import.meta.hot.accept()
}
