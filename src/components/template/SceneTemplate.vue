<template>
  <div
    ref="container"
    style="width: 100%; height: 100%; overflow: hidden; margin: 0; padding: 0; display: block"
  />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { parts } from 'src/composables/data'

const container = ref(null)
let scene, camera, renderer, controls, animationId
let fontLoaded = false

// Carrega fontes do Google Fonts
function loadFonts() {
  if (fontLoaded) return
  const link = document.createElement('link')
  link.href =
    'https://fonts.googleapis.com/css2?family=Arial&family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Poppins:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&family=Ubuntu:wght@400;700&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
  fontLoaded = true
}

function createTextLabel(
  text,
  fontSize,
  color,
  fontWeight = 'bold',
  fontFace = 'Arial',
  letterSpacing = 0,
) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  const lines = text.split('\n')
  const lineHeight = fontSize * 1.1
  context.font = `${fontWeight} ${fontSize}px "${fontFace}"`

  let maxLineWidth = 0
  lines.forEach((line) => {
    let width = 0
    if (letterSpacing > 0) {
      for (let i = 0; i < line.length; i++) {
        width += context.measureText(line[i]).width
        if (i < line.length - 1) width += letterSpacing
      }
    } else {
      width = context.measureText(line).width
    }
    if (width > maxLineWidth) maxLineWidth = width
  })

  canvas.width = maxLineWidth + 20
  canvas.height = lineHeight * lines.length

  context.font = `${fontWeight} ${fontSize}px "${fontFace}"`
  context.fillStyle = color
  context.textAlign = 'left'
  context.textBaseline = 'bottom'

  lines.forEach((line, index) => {
    const yPos = canvas.height - (lines.length - 1 - index) * lineHeight

    if (letterSpacing > 0) {
      let xPos = (canvas.width - maxLineWidth) / 2
      for (let i = 0; i < line.length; i++) {
        context.fillText(line[i], xPos, yPos)
        xPos += context.measureText(line[i]).width + letterSpacing
      }
    } else {
      const textWidth = context.measureText(line).width
      const xPos = (canvas.width - textWidth) / 2
      context.fillText(line, xPos, yPos)
    }
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 16

  const ratio = canvas.width / canvas.height
  const pHeight = (fontSize / 380) * lines.length
  const pWidth = pHeight * ratio

  const geometry = new THREE.PlaneGeometry(pWidth, pHeight)
  geometry.translate(0, pHeight / 2, 0)

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 0.5,
  })

  return new THREE.Mesh(geometry, material)
}

function createImageLabel(imageBase64, width, height) {
  const texture = new THREE.TextureLoader().load(imageBase64)
  texture.anisotropy = 16

  const geometry = new THREE.PlaneGeometry(width, height)
  geometry.translate(0, height / 2, 0)

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 0.5,
  })

  return new THREE.Mesh(geometry, material)
}

function initScene() {
  if (!container.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)

  const width = container.value.clientWidth || window.innerWidth
  const height = container.value.clientHeight || window.innerHeight

  if (width === 0 || height === 0) {
    console.warn('Container has no dimensions yet')
    setTimeout(initScene, 100)
    return
  }

  camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000)
  camera.position.set(5, 3, 8)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0xffffff)
  container.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.autoRotate = false

  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const light = new THREE.DirectionalLight(0xffffff, 0.8)
  light.position.set(5, 10, 5)
  light.castShadow = true
  scene.add(light)

  createModel()
  animate()
}

function createModel() {
  if (!scene) return
  const oldGroup = scene.getObjectByName('mainGroup')
  if (oldGroup) scene.remove(oldGroup)

  const group = new THREE.Group()
  group.name = 'mainGroup'

  const b = parts.base
  const baseHeight = b.height || 0.5

  // 1. BASE
  const baseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, baseHeight, 1.0),
    new THREE.MeshStandardMaterial({ color: b.color }),
  )
  baseMesh.position.y = baseHeight / 2
  group.add(baseMesh)

  // 2. TÍTULO (Colado na base)
  const t = parts.title
  const titleMesh = createTextLabel(
    t.text,
    120,
    t.color,
    'bold',
    t.content.font,
    t.content.letterSpacing || 0,
  )
  titleMesh.position.set(t.positionX || 0, baseHeight, 0)
  group.add(titleMesh)

  // 3. SUBTÍTULO (Na face frontal)
  const s = parts.base.content
  const subtitleMesh = createTextLabel(s.text, 70, s.color, 'normal', s.font, s.letterSpacing || 0)
  subtitleMesh.position.set(s.positionX || 0, 0, 0.51)
  group.add(subtitleMesh)
  subtitleMesh.translateY(baseHeight / 2 - subtitleMesh.geometry.parameters.height / 2)

  // 4. LOGO (Imagem ou Box)
  const l = parts.logo
  let logoMesh

  if (l.imageBase64) {
    logoMesh = createImageLabel(l.imageBase64, l.width, l.height)
  } else {
    logoMesh = new THREE.Mesh(
      new THREE.BoxGeometry(l.width, l.height, 0.2),
      new THREE.MeshStandardMaterial({
        color: l.color,
        transparent: true,
        opacity: 0.3,
      }),
    )
  }

  logoMesh.position.set(l.positionX || -1.4, baseHeight + l.height / 2, 0)
  group.add(logoMesh)

  scene.add(group)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

function onWindowResize() {
  if (!container.value || !camera || !renderer) return
  const width = container.value.clientWidth
  const height = container.value.clientHeight
  if (width > 0 && height > 0) {
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }
}

let resizeObserver = null

onMounted(async () => {
  await nextTick()
  loadFonts()
  initScene()
  window.addEventListener('resize', onWindowResize)

  // ResizeObserver para monitorar mudanças no tamanho do container
  if (container.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      onWindowResize()
    })
    resizeObserver.observe(container.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  cancelAnimationFrame(animationId)
  if (renderer && renderer.domElement && renderer.domElement.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
  renderer.dispose()
})

watch(
  () => parts,
  () => createModel(),
  { deep: true },
)
</script>
