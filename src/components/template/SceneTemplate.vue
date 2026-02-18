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
    'https://fonts.googleapis.com/css2?family=Arial&family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Poppins:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&family=Ubuntu:wght@400;700&family=Nunito:wght@400;700&family=Raleway:wght@400;700&family=Merriweather:wght@400;700&family=Oswald:wght@400;700&family=Source+Sans+3:wght@400;700&family=Bebas+Neue&family=Cinzel:wght@400;700&family=Cormorant+Garamond:wght@400;700&family=Abril+Fatface&family=Archivo+Black&family=Fjalla+One&family=Josefin+Sans:wght@400;700&family=Pacifico&family=Bangers&family=Orbitron:wght@400;700&family=Righteous&family=Rajdhani:wght@400;700&family=Sacramento&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
  fontLoaded = true
}

async function ensureFontLoaded(fontFace, fontWeight) {
  if (!document.fonts || !fontFace) return
  try {
    await document.fonts.load(`${fontWeight} 16px "${fontFace}"`)
  } catch {
    // Ignore font loading errors; canvas will fallback.
  }
}

function createTextLabel(
  text,
  fontSize,
  color,
  fontWeight = 'bold',
  fontFace = 'Arial',
  letterSpacing = 0,
  depth = 0,
) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  const lines = text.split('\n')
  const lineHeight = fontSize * 1.0
  context.font = `${fontWeight} ${fontSize}px "${fontFace}"`

  let maxLineWidth = 0
  lines.forEach((line) => {
    let width = 0
    if (letterSpacing !== 0) {
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        width += context.measureText(ch).width
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

    if (letterSpacing !== 0) {
      let xPos = (canvas.width - maxLineWidth) / 2
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        context.fillText(ch, xPos, yPos)
        xPos += context.measureText(ch).width
        if (i < line.length - 1) xPos += letterSpacing
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

  const baseMesh = new THREE.Mesh(geometry, material)
  baseMesh.userData.height = pHeight

  if (!depth || depth <= 0) {
    return baseMesh
  }

  const group = new THREE.Group()
  const maxLayers = 80
  const steps = Math.min(maxLayers, Math.max(1, Math.round(depth / 0.01)))
  const step = depth / steps

  for (let i = 0; i <= steps; i++) {
    const layer = baseMesh.clone()
    layer.position.z = -i * step
    group.add(layer)
  }

  group.userData.height = pHeight
  return group
}

function processImage(imageBase64, options = {}) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Aplica filtros pixel por pixel
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i]
        let g = data[i + 1]
        let b = data[i + 2]
        let a = data[i + 3]

        // Remover fundo (cores claras)
        if (options.removeBg) {
          const threshold = options.bgThreshold || 30
          const brightness = (r + g + b) / 3
          if (brightness > 255 - threshold) {
            data[i + 3] = 0 // Torna transparente
            continue
          }
        }

        // Brilho
        if (options.brightness) {
          r = Math.max(0, Math.min(255, r + options.brightness))
          g = Math.max(0, Math.min(255, g + options.brightness))
          b = Math.max(0, Math.min(255, b + options.brightness))
        }

        // Contraste
        if (options.contrast) {
          const factor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast))
          r = Math.max(0, Math.min(255, factor * (r - 128) + 128))
          g = Math.max(0, Math.min(255, factor * (g - 128) + 128))
          b = Math.max(0, Math.min(255, factor * (b - 128) + 128))
        }

        // Saturação
        if (options.saturate) {
          const gray = 0.2989 * r + 0.587 * g + 0.114 * b
          const satFactor = 1 + options.saturate / 100
          r = Math.max(0, Math.min(255, gray + (r - gray) * satFactor))
          g = Math.max(0, Math.min(255, gray + (g - gray) * satFactor))
          b = Math.max(0, Math.min(255, gray + (b - gray) * satFactor))
        }

        // Rotação de cor (Hue shift)
        if (options.hueShift && options.hueShift !== 0) {
          // Converte RGB para HSL
          r /= 255
          g /= 255
          b /= 255
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          let h,
            s,
            l = (max + min) / 2

          if (max === min) {
            h = s = 0
          } else {
            const d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            switch (max) {
              case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6
                break
              case g:
                h = ((b - r) / d + 2) / 6
                break
              case b:
                h = ((r - g) / d + 4) / 6
                break
            }
          }

          // Aplica shift no hue
          h = (h + options.hueShift / 360) % 1

          // Converte de volta para RGB
          const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
          }

          if (s === 0) {
            r = g = b = l
          } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s
            const p = 2 * l - q
            r = hue2rgb(p, q, h + 1 / 3)
            g = hue2rgb(p, q, h)
            b = hue2rgb(p, q, h - 1 / 3)
          }

          r *= 255
          g *= 255
          b *= 255
        }

        // Inverter cores
        if (options.invert) {
          r = 255 - r
          g = 255 - g
          b = 255 - b
        }

        data[i] = r
        data[i + 1] = g
        data[i + 2] = b
        data[i + 3] = a
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL())
    }

    img.onerror = () => {
      resolve(imageBase64) // Retorna original em caso de erro
    }

    img.src = imageBase64
  })
}

function createImageLabel(imageBase64, width, height, depth = 0) {
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

  const baseMesh = new THREE.Mesh(geometry, material)

  if (!depth || depth <= 0) {
    return baseMesh
  }

  const group = new THREE.Group()
  const maxLayers = 80
  const steps = Math.min(maxLayers, Math.max(1, Math.round(depth / 0.01)))
  const step = depth / steps

  for (let i = 0; i <= steps; i++) {
    const layer = baseMesh.clone()
    layer.position.z = -i * step
    group.add(layer)
  }

  return group
}

function createTopInsetGeometry(width, height, depth, inset) {
  const geometry = new THREE.BoxGeometry(width, height, depth, 1, 1, 1)
  const position = geometry.attributes.position
  const scaleX = (width - inset * 2) / width
  const scaleZ = (depth - inset * 2) / depth

  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i)
    if (y > 0) {
      position.setX(i, position.getX(i) * scaleX)
      position.setZ(i, position.getZ(i) * scaleZ)
    }
  }

  position.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
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
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0xffffff)

  // Garante que o canvas preencha todo o container
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'

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

  // Força múltiplos resizes iniciais para garantir dimensões corretas
  setTimeout(() => onWindowResize(), 50)
  setTimeout(() => onWindowResize(), 150)
  setTimeout(() => onWindowResize(), 300)
}

async function createModel() {
  if (!scene) return

  // Remove e limpa o grupo anterior corretamente
  const oldGroup = scene.getObjectByName('mainGroup')
  if (oldGroup) {
    // Percorre todos os objetos e faz dispose
    oldGroup.traverse((obj) => {
      if (obj.geometry) {
        obj.geometry.dispose()
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((material) => {
            if (material.map) material.map.dispose()
            material.dispose()
          })
        } else {
          if (obj.material.map) obj.material.map.dispose()
          obj.material.dispose()
        }
      }
    })
    scene.remove(oldGroup)
  }

  const group = new THREE.Group()
  group.name = 'mainGroup'

  const b = parts.base
  const baseHeight = b.height || 0.5
  const plateHeight = parts.topPlate.height || 0.06
  const plateWidth = 4.5
  const plateDepth = 1.0
  const plateStyle = parts.topPlate.style || 'bevel'
  const plateBevelBase = Math.min(plateHeight * 0.8, plateWidth / 8, plateDepth / 8)

  // 1. BASE
  const baseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, baseHeight, 1.0),
    new THREE.MeshStandardMaterial({ color: b.color }),
  )
  baseMesh.position.y = baseHeight / 2
  group.add(baseMesh)

  // 1.1 CHAPA SUPERIOR
  let plateGeometry
  const bevelConfig = {
    bevelEnabled: true,
    bevelSize: plateBevelBase,
    bevelThickness: plateBevelBase,
    bevelSegments: 1,
    steps: 1,
  }

  if (plateStyle === 'bevel-soft') {
    bevelConfig.bevelSize = plateBevelBase * 0.5
    bevelConfig.bevelThickness = plateBevelBase * 0.5
    bevelConfig.bevelSegments = 1
  } else if (plateStyle === 'bevel-strong') {
    bevelConfig.bevelSize = plateBevelBase * 1.2
    bevelConfig.bevelThickness = plateBevelBase * 1.2
    bevelConfig.bevelSegments = 1
  } else if (plateStyle === 'bevel-round') {
    bevelConfig.bevelSize = plateBevelBase * 0.9
    bevelConfig.bevelThickness = plateBevelBase * 0.9
    bevelConfig.bevelSegments = 4
  }

  if (plateStyle === 'flat') {
    plateGeometry = new THREE.BoxGeometry(plateWidth, plateHeight, plateDepth)
  } else if (plateStyle === 'top-inset') {
    const inset = Math.min(plateHeight * 0.8, plateWidth / 6, plateDepth / 6)
    plateGeometry = createTopInsetGeometry(plateWidth, plateHeight, plateDepth, inset)
  } else {
    const plateShape = new THREE.Shape()
    plateShape.moveTo(-plateWidth / 2, -plateDepth / 2)
    plateShape.lineTo(plateWidth / 2, -plateDepth / 2)
    plateShape.lineTo(plateWidth / 2, plateDepth / 2)
    plateShape.lineTo(-plateWidth / 2, plateDepth / 2)
    plateShape.closePath()

    plateGeometry = new THREE.ExtrudeGeometry(plateShape, {
      depth: plateHeight,
      bevelEnabled: bevelConfig.bevelEnabled,
      bevelSize: bevelConfig.bevelSize,
      bevelThickness: bevelConfig.bevelThickness,
      bevelSegments: bevelConfig.bevelSegments,
      steps: bevelConfig.steps,
    })
    plateGeometry.center()
    plateGeometry.rotateX(Math.PI / 2)
  }

  const plateMesh = new THREE.Mesh(
    plateGeometry,
    new THREE.MeshStandardMaterial({ color: parts.topPlate.color }),
  )
  plateMesh.position.y = baseHeight + plateHeight / 2
  group.add(plateMesh)

  const plateEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(plateGeometry),
    new THREE.LineBasicMaterial({ color: 0x666666 }),
  )
  plateEdges.position.copy(plateMesh.position)
  group.add(plateEdges)

  // 2. TÍTULO (Colado na base)
  const t = parts.title
  await ensureFontLoaded(t.content.font, 'bold')
  const titleMesh = createTextLabel(
    t.text,
    t.content.fontSize || 120,
    t.color,
    'bold',
    t.content.font,
    t.content.letterSpacing || 0,
    t.content.depth || 0,
  )
  titleMesh.position.set(t.positionX || 0, baseHeight + plateHeight + (t.positionY || 0), 0)
  group.add(titleMesh)

  // 3. SUBTÍTULO (Na face frontal)
  const s = parts.base.content
  await ensureFontLoaded(s.font, 'normal')
  const subtitleMesh = createTextLabel(
    s.text,
    s.fontSize || 70,
    s.color,
    'normal',
    s.font,
    s.letterSpacing || 0,
    s.depth || 0,
  )
  subtitleMesh.position.set(s.positionX || 0, 0, 0.51)
  group.add(subtitleMesh)
  subtitleMesh.translateY(
    baseHeight / 2 - (subtitleMesh.userData.height || 0) / 2 + (s.positionY || 0),
  )

  // 4. LOGO (Imagem ou Box)
  const l = parts.logo
  let logoMesh

  const logoDepth = l.depth || 0
  if (l.imageBase64) {
    // Processa a imagem com os filtros antes de criar a textura
    const processedImage = await processImage(l.imageBase64, {
      removeBg: l.removeBg,
      bgThreshold: l.bgThreshold,
      brightness: l.brightness,
      contrast: l.contrast,
      saturate: l.saturate,
      hueShift: l.hueShift,
      invert: l.invert,
    })
    logoMesh = createImageLabel(processedImage, l.width, l.height, logoDepth)
  } else {
    logoMesh = new THREE.Mesh(
      new THREE.BoxGeometry(l.width, l.height, Math.max(logoDepth, 0.2)),
      new THREE.MeshStandardMaterial({
        color: l.color,
        transparent: true,
        opacity: 0.3,
      }),
    )
  }

  logoMesh.position.set(
    l.positionX || -1.4,
    baseHeight + plateHeight + l.height / 2 + (l.positionY || 0),
    0,
  )
  group.add(logoMesh)

  scene.add(group)

  // Força uma renderização limpa após adicionar os novos objetos
  if (renderer) {
    renderer.clear()
    renderer.render(scene, camera)
  }
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

  console.log('Resize detectado:', { width, height, devicePixelRatio: window.devicePixelRatio })

  if (width > 0 && height > 0) {
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    // Atualiza o tamanho do renderer
    renderer.setSize(width, height, false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Garante que o canvas mantém as dimensões corretas
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
  }
}

// Debounce para evitar muitas chamadas durante resize
let resizeTimeout = null
function debouncedResize() {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  resizeTimeout = setTimeout(() => {
    requestAnimationFrame(() => {
      onWindowResize()
    })
  }, 50)
}

// Detectar mudanças de DPI/zoom
function setupResolutionMonitoring() {
  // Monitora mudanças de pixel ratio (zoom do navegador ou mudança de monitor)
  const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)

  const handleResolutionChange = () => {
    console.log('Resolução da tela mudou:', window.devicePixelRatio)
    onWindowResize()
    // Reregistra o listener com o novo pixel ratio
    setupResolutionMonitoring()
  }

  // Remove listeners antigos se existirem
  if (mediaQuery.removeEventListener) {
    mediaQuery.removeEventListener('change', handleResolutionChange)
  }

  // Adiciona novo listener
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleResolutionChange)
  }
}

let resizeObserver = null

onMounted(async () => {
  await nextTick()
  loadFonts()
  initScene()

  // Listeners para resize
  window.addEventListener('resize', debouncedResize)

  // Setup de monitoramento de resolução/DPI
  setupResolutionMonitoring()

  // ResizeObserver para monitorar mudanças no tamanho do container (mais preciso)
  if (container.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          // Chama diretamente para ser mais responsivo
          requestAnimationFrame(() => {
            onWindowResize()
          })
        }
      }
    })
    resizeObserver.observe(container.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', debouncedResize)
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  if (modelUpdateTimeout) {
    clearTimeout(modelUpdateTimeout)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  cancelAnimationFrame(animationId)
  if (renderer && renderer.domElement && renderer.domElement.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }

  // Limpa todas as texturas e materiais da cena
  if (scene) {
    scene.traverse((obj) => {
      if (obj.geometry) {
        obj.geometry.dispose()
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((material) => {
            if (material.map) material.map.dispose()
            material.dispose()
          })
        } else {
          if (obj.material.map) obj.material.map.dispose()
          obj.material.dispose()
        }
      }
    })
  }

  if (renderer) {
    renderer.dispose()
  }
})

// Debounce para evitar múltiplas reconstruções rápidas
let modelUpdateTimeout = null
function debouncedModelUpdate() {
  if (modelUpdateTimeout) {
    clearTimeout(modelUpdateTimeout)
  }
  modelUpdateTimeout = setTimeout(() => {
    createModel()
  }, 100)
}

watch(
  () => parts,
  () => debouncedModelUpdate(),
  { deep: true },
)
</script>
