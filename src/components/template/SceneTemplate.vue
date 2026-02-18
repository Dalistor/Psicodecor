<template>
  <div ref="container" class="scene-container" style="width: 100%; height: 600px" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { parts } from 'src/composables/data'

const container = ref(null)
let scene, camera, renderer, controls, animationId

function createTextLabel(text, fontSize, color, fontWeight = 'bold', fontFace = 'Arial') {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  const lines = text.split('\n')
  const lineHeight = fontSize * 1.1 // Reduzi um pouco o espaçamento para aproximar da base
  context.font = `${fontWeight} ${fontSize}px ${fontFace}`

  let maxLineWidth = 0
  lines.forEach((line) => {
    const width = context.measureText(line).width
    if (width > maxLineWidth) maxLineWidth = width
  })

  // Canvas ajustado sem folgas extras no topo/base
  canvas.width = maxLineWidth + 10
  canvas.height = lineHeight * lines.length

  context.font = `${fontWeight} ${fontSize}px ${fontFace}`
  context.fillStyle = color
  context.textAlign = 'center'
  context.textBaseline = 'bottom' // Texto alinha pela base do canvas

  lines.forEach((line, index) => {
    // Inverte a ordem para a última linha ficar na base do canvas
    const yPos = canvas.height - (lines.length - 1 - index) * lineHeight
    context.fillText(line, canvas.width / 2, yPos)
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 16

  const ratio = canvas.width / canvas.height
  const pHeight = (fontSize / 380) * lines.length
  const pWidth = pHeight * ratio

  const geometry = new THREE.PlaneGeometry(pWidth, pHeight)
  // AJUSTE CRUCIAL: Move a geometria para que o (0,0,0) seja a borda inferior
  geometry.translate(0, pHeight / 2, 0)

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

  const width = container.value.clientWidth
  const height = container.value.clientHeight
  camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000)
  camera.position.set(5, 3, 8)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const light = new THREE.DirectionalLight(0xffffff, 0.8)
  light.position.set(5, 10, 5)
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
  const titleMesh = createTextLabel(t.text, 120, t.color, 'bold', t.content.font)

  // Como transladamos a geometria, a posição Y é EXATAMENTE o topo da base
  titleMesh.position.set(0.5, baseHeight, 0)
  group.add(titleMesh)

  // 3. SUBTÍTULO (Na face frontal)
  const s = parts.base.content
  const subtitleMesh = createTextLabel(s.text, 70, s.color, 'normal', s.font)
  subtitleMesh.position.set(0, 0, 0.51) // Relativo ao centro do grupo, ajustaremos abaixo
  group.add(subtitleMesh)
  // Ajuste para o subtítulo ficar no centro da altura da base
  subtitleMesh.translateY(baseHeight / 2 - subtitleMesh.geometry.parameters.height / 2)

  // 4. ÍCONE (Box 100% Transparente)
  const l = parts.logo
  const logoMesh = new THREE.Mesh(
    new THREE.BoxGeometry(l.width, l.height, 0.2),
    new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.5,
    }),
  )
  logoMesh.position.set(-1.4, baseHeight + l.height / 2, 0)
  group.add(logoMesh)

  scene.add(group)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

onMounted(async () => {
  await nextTick()
  initScene()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
})

watch(
  () => parts,
  () => createModel(),
  { deep: true },
)
</script>
