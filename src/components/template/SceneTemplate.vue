<template>
  <div
    ref="container"
    style="
      width: 100%;
      height: 100%;
      overflow: hidden;
      margin: 0;
      padding: 0;
      display: block;
      pointer-events: auto;
    "
  />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { parts, sceneConfig } from 'src/composables/data'

const container = ref(null)
let scene, camera, renderer, controls, animationId
let fontLoaded = false
let fonts = {} // Cache de fontes carregadas
let isCreatingModel = false // Flag para evitar chamadas concorrentes

function degToRad(deg) {
  return ((deg || 0) * Math.PI) / 180
}

function loadFonts() {
  if (fontLoaded) return

  // Fontes usadas no canvas dependem de fontes instaladas no sistema.
  // As fontes 3D sao carregadas apenas via JSON em public/fonts.
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

function getFontUrl(filename) {
  return new URL(encodeURI(`fonts/${filename}`), window.location.href).toString()
}

// Mapa de fontes Google para fonts JSON (Three.js possui poucas fontes nativas)
const fontLoadMap = {
  Roboto: getFontUrl('Roboto-VariableFont_wdth,wght.json'),
  'Open Sans': getFontUrl('OpenSans-VariableFont_wdth,wght.json'),
  'Great Vibes': getFontUrl('GreatVibes-Regular.json'),
  Allura: getFontUrl('Allura-Regular.json'),
  'Alex Brush': getFontUrl('AlexBrush-Regular.json'),
  Merriweather: getFontUrl('Merriweather-VariableFont_opsz,wdth,wght.json'),
  'Playfair Display': getFontUrl('PlayfairDisplay-VariableFont_wght.json'),
  Ubuntu: getFontUrl('Ubuntu-Regular.json'),
}

async function loadFontFromUrl(fontUrl) {
  const loader = new FontLoader()
  return await new Promise((resolve, reject) => {
    loader.load(fontUrl, resolve, undefined, reject)
  })
}

async function loadThreeFont(fontFace) {
  if (fonts[fontFace]) return fonts[fontFace]

  const fontUrl = fontLoadMap[fontFace] || fontLoadMap.Roboto
  try {
    const font = await loadFontFromUrl(fontUrl)
    fonts[fontFace] = font
    return font
  } catch {
    try {
      const font = await loadFontFromUrl(fontLoadMap.Roboto)
      fonts[fontFace] = font
      return font
    } catch (fallbackError) {
      console.error('Erro ao carregar fonte:', fallbackError)
      return null
    }
  }
}

async function createTextGeometryMesh(text, fontSize, color, fontFace, letterSpacing, depth) {
  try {
    // TextGeometry tem limitações com caracteres especiais
    // Vamos normalizar o texto e alertar o usuário sobre limitações

    // Caracteres suportados: ASCII + Latin Extended (inclui acentos: ã, õ, ç, é, á, etc)
    // Aceita: U+0020-U+007E (ASCII) + U+00A0-U+00FF (Latin-1 Supplement) + U+0100-U+017F (Latin Extended-A)
    const supportedCharset = /[\u0020-\u007E\u00A0-\u00FF\u0100-\u017F]/
    const rawChars = text.split('')
    const unsupported = rawChars
      .filter((ch) => !supportedCharset.test(ch))
      .map((ch) => ch.charCodeAt(0))

    if (unsupported.length > 0) {
      console.warn(
        `TextGeometry: Caracteres nao presentes nos glyphs da fonte (${unsupported.join(', ')}). Substituindo por '?'.`,
      )
    }

    const safeText = rawChars.map((ch) => (supportedCharset.test(ch) ? ch : '?')).join('')

    const spacing = Number(letterSpacing) || 0

    const font = await loadThreeFont(fontFace)
    if (!font) {
      return null
    }

    // fontSize agora está em mm
    const scaledSize = fontSize

    // Usar múltiplas geometrias para suportar letterSpacing adequadamente
    if (Math.abs(spacing) > 0.001) {
      const group = new THREE.Group()
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.4,
        metalness: 0.1,
      })

      const charData = []

      for (const ch of safeText) {
        const charGeom = new TextGeometry(ch, {
          font: font,
          size: scaledSize,
          depth: depth,
          curveSegments: 4,
          bevelEnabled: depth > 0,
          bevelThickness: depth * 0.5,
          bevelSize: depth * 0.3,
          bevelSegments: 3,
          bevelOffset: 0,
          lineHeight: 1.2,
        })

        charGeom.computeBoundingBox()
        if (!charGeom.boundingBox) {
          continue
        }

        const bbox = charGeom.boundingBox
        const width = bbox.max.x - bbox.min.x
        const height = bbox.max.y - bbox.min.y

        // Centralizar na X apenas, manter Y em baseline comum
        const offsetX = (bbox.max.x + bbox.min.x) / 2
        const offsetZ = (bbox.max.z + bbox.min.z) / 2
        charGeom.translate(-offsetX, 0, -offsetZ)

        charData.push({
          geometry: charGeom,
          width: width,
          height: height,
          minY: bbox.min.y,
          maxY: bbox.max.y,
        })
      }

      if (charData.length === 0) {
        return null
      }

      // Calcular largura total com espaçamentos
      const totalWidth = charData.reduce((sum, d) => sum + d.width, 0) + spacing * (charData.length - 1)

      // Calcular altura comum (maior altura entre todos)
      const maxHeight = Math.max(...charData.map((d) => d.height))
      const minYComum = Math.min(...charData.map((d) => d.minY))

      // Usar a mesma baseline de padding que sem spacing
      const baselinePadding = Math.max(0.5, fontSize * 0.08)
      const centerYOffset = minYComum + baselinePadding

      // Posicionar caracteres a partir do centro
      let cursorX = -totalWidth / 2

      for (const { geometry: charGeom, width } of charData) {
        const mesh = new THREE.Mesh(charGeom, material)
        mesh.position.x = cursorX + width / 2
        mesh.position.y = -centerYOffset
        group.add(mesh)
        cursorX += width + spacing
      }

      group.userData.height = maxHeight
      group.userData.isTextGeometry = true
      return group
    }

    const geometry = new TextGeometry(safeText, {
      font: font,
      size: scaledSize,
      depth: depth,
      curveSegments: 4,
      bevelEnabled: depth > 0,
      bevelThickness: depth * 0.5,
      bevelSize: depth * 0.3,
      bevelSegments: 3,
      bevelOffset: 0,
      lineHeight: 1.2,
    })

    geometry.computeBoundingBox()
    if (geometry.boundingBox) {
      const bbox = geometry.boundingBox
      const offsetX = (bbox.max.x + bbox.min.x) / 2
      const baselinePadding = Math.max(0.5, fontSize * 0.08)
      const offsetY = bbox.min.y + baselinePadding
      const offsetZ = (bbox.max.z + bbox.min.z) / 2
      geometry.translate(-offsetX, -offsetY, -offsetZ)
    }

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.4,
      metalness: 0.1,
    })

    const mesh = new THREE.Mesh(geometry, material)
    if (geometry.boundingBox) {
      mesh.userData.height = geometry.boundingBox.max.y - geometry.boundingBox.min.y
    }
    mesh.userData.isTextGeometry = true
    return mesh
  } catch (err) {
    console.error('Erro ao criar TextGeometry:', err)
    return null
  }
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

// NOTE: Extrusao de imagem foi substituida por sprites empilhados.

// Função para extrudar SVG (melhor solução para logos e letras)
function createExtrudedSVG(svgDataUrl, depth = 2, color = '#ffffff', scale = 1, invertY = true) {
  return new Promise((resolve, reject) => {
    const loader = new SVGLoader()

    // Converte data URL para string SVG
    let svgString
    if (svgDataUrl.startsWith('data:image/svg+xml')) {
      const base64Data = svgDataUrl.split(',')[1]
      svgString = decodeURIComponent(escape(atob(base64Data)))
    } else {
      svgString = svgDataUrl
    }

    try {
      const data = loader.parse(svgString)
      const paths = data.paths
      const group = new THREE.Group()

      // Processa cada caminho do SVG
      paths.forEach((path) => {
        const shapes = SVGLoader.createShapes(path)

        shapes.forEach((shape) => {
          const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: depth,
            bevelEnabled: false,
          })

          // Use a cor do path ou a cor fornecida
          const fillColor = path.userData.style.fill
          const material = new THREE.MeshStandardMaterial({
            color: fillColor && fillColor !== 'none' ? fillColor : color,
            roughness: 0.5,
            metalness: 0.1,
          })

          const mesh = new THREE.Mesh(geometry, material)
          group.add(mesh)
        })
      })

      // Centraliza e ajusta escala
      const box = new THREE.Box3().setFromObject(group)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      group.children.forEach((child) => {
        child.geometry.translate(-center.x, -center.y, 0)
      })

      // Aplica escala (considera invertY para SVG nativo vs texto convertido)
      if (invertY) {
        // SVG nativo: inverte Y porque SVG tem Y invertido
        group.scale.set(scale, -scale, scale)
        // Rota para ficar de frente
        group.rotation.x = Math.PI
      } else {
        // Texto convertido: mantém orientação natural
        group.scale.set(scale, scale, scale)
        // Sem rotação adicional
      }

      group.userData.height = size.y * scale
      resolve(group)
    } catch (error) {
      console.error('Erro ao processar SVG:', error)
      reject(error)
    }
  })
}

function createStackedImageLabel(texture, width, height, depth = 2) {
  const group = new THREE.Group()

  const layers = Math.max(2, Math.ceil(depth * 2))
  const step = depth / (layers - 1)
  const startZ = -depth / 2

  const geometry = new THREE.PlaneGeometry(width, height)
  geometry.translate(0, height / 2, 0)

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 0.5,
  })

  for (let i = 0; i < layers; i += 1) {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.z = startZ + step * i
    group.add(mesh)
  }

  group.userData.height = height
  return group
}

function createImageLabel(imageBase64, width, height, depth = 0) {
  const texture = new THREE.TextureLoader().load(imageBase64)
  texture.anisotropy = 16

  // Se tem profundidade, cria pilha de sprites para dar efeito 3D
  if (depth && depth > 0) {
    return createStackedImageLabel(texture, width, height, depth)
  }

  // Sem profundidade, usa plano simples
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
  try {
    console.log('[SceneTemplate] initScene começando...')
    if (!container.value) {
      console.warn('[SceneTemplate] container.value não existe')
      return
    }

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xffffff)

    const width = container.value.clientWidth || window.innerWidth
    const height = container.value.clientHeight || window.innerHeight

    if (width === 0 || height === 0) {
      console.warn('[SceneTemplate] Container has no dimensions yet')
      setTimeout(initScene, 100)
      return
    }

    console.log('[SceneTemplate] Criando camera e renderer...')

    camera = new THREE.PerspectiveCamera(35, width / height, 1, 4000)
    camera.position.set(
      sceneConfig.camera.position.x,
      sceneConfig.camera.position.y,
      sceneConfig.camera.position.z,
    )

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
    controls.target.set(
      sceneConfig.camera.target.x,
      sceneConfig.camera.target.y,
      sceneConfig.camera.target.z,
    )
    // Importante: define quais botões do mouse ativam os controles
    // mouseButtons: LEFT = orbit, MIDDLE = zoom, RIGHT = pan
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    }
    controls.update()

    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const light = new THREE.DirectionalLight(0xffffff, sceneConfig.lighting.mainLight.intensity)
    light.position.set(
      sceneConfig.lighting.mainLight.position.x,
      sceneConfig.lighting.mainLight.position.y,
      sceneConfig.lighting.mainLight.position.z,
    )
    light.castShadow = true
    scene.add(light)

    const backLight = new THREE.DirectionalLight(0xffffff, sceneConfig.lighting.backLight.intensity)
    backLight.position.set(
      sceneConfig.lighting.backLight.position.x,
      sceneConfig.lighting.backLight.position.y,
      sceneConfig.lighting.backLight.position.z,
    )
    scene.add(backLight)

    createModel()
    animate()

    // Força múltiplos resizes iniciais para garantir dimensões corretas
    setTimeout(() => onWindowResize(), 50)
    setTimeout(() => onWindowResize(), 150)
    setTimeout(() => onWindowResize(), 300)

    console.log('[SceneTemplate] initScene completo')
  } catch (error) {
    console.error('[SceneTemplate] Erro ao inicializar cena:', error)
    console.error('[SceneTemplate] Stack:', error?.stack)
  }
}

async function createModel() {
  if (!scene) return

  // Evita chamadas concorrentes
  if (isCreatingModel) {
    return
  }
  isCreatingModel = true

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

  // Força renderização para limpar cena visualmente
  if (renderer) {
    renderer.clear()
    renderer.render(scene, camera)
  }

  const group = new THREE.Group()
  group.name = 'mainGroup'

  const b = parts.base
  const baseHeight = b.height || 25
  const plateHeight = parts.topPlate.height || 5
  const plateWidth = b.width || 300
  const plateDepth = b.depth || 40
  const plateStyle = parts.topPlate.style || 'bevel'
  const plateBevelBase = Math.min(plateHeight * 0.8, plateWidth / 8, plateDepth / 8)

  // 1. BASE
  const baseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(plateWidth, baseHeight, plateDepth),
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

  // 2. TÍTULOS (Múltiplos)
  for (const title of parts.titles) {
    await ensureFontLoaded(title.font, 'bold')

    // Usa TextGeometry com typeface.json
    const titleMesh = await createTextGeometryMesh(
      title.text,
      title.fontSize,
      title.color,
      title.font,
      title.letterSpacing,
      title.depth,
    )
    if (!titleMesh) {
      continue
    }

    titleMesh.position.set(
      title.positionX,
      baseHeight + plateHeight + title.positionY,
      title.positionZ || 0,
    )
    titleMesh.rotation.x = degToRad(title.rotationX)
    titleMesh.rotation.y = degToRad(title.rotationY)
    titleMesh.rotation.z = degToRad(title.rotationZ)
    group.add(titleMesh)
  }

  // 3. SUBTÍTULO (Na face frontal)
  const s = parts.base.content
  await ensureFontLoaded(s.font, 'normal')

  const subtitleMesh = await createTextGeometryMesh(
    s.text,
    s.fontSize,
    s.color,
    s.font,
    s.letterSpacing,
    s.depth,
  )
  if (subtitleMesh) {
    const subtitleHeight = subtitleMesh.userData.height || 0
    subtitleMesh.position.set(
      s.positionX,
      baseHeight / 2 - subtitleHeight / 2 + s.positionY,
      plateDepth / 2 + 0.5 + (s.positionZ || 0),
    )
    group.add(subtitleMesh)
  }

  // 4. LOGOS (Múltiplos)
  for (const logo of parts.logos) {
    let logoMesh

    const logoWidth = logo.width || 40
    const logoHeight = logo.height || 40
    const logoDepth = logo.depth || 0
    if (logo.imageBase64) {
      // Verifica se é SVG
      const isSVG = logo.imageBase64.startsWith('data:image/svg+xml')

      if (isSVG) {
        // Renderização SVG extrudado (melhor para logos e letras)
        try {
          const svgScale = Math.min(logoWidth, logoHeight) / 100 // Escala baseada no tamanho desejado
          logoMesh = await createExtrudedSVG(
            logo.imageBase64,
            logoDepth,
            logo.color || '#ffffff',
            svgScale,
            true,
          )
          // Corrige SVG invertido e espelhado
          logoMesh.rotation.z = Math.PI
          logoMesh.scale.x *= -1
        } catch (error) {
          console.error('Erro ao processar SVG:', error)
          // Fallback para box simples
          logoMesh = new THREE.Mesh(
            new THREE.BoxGeometry(logoWidth, logoHeight, Math.max(logoDepth, 2)),
            new THREE.MeshStandardMaterial({ color: logo.color, transparent: true, opacity: 0.3 }),
          )
        }
      } else {
        // PNG - processa a imagem com os filtros antes de criar a textura
        const filters = logo.imageFilters || {}
        const processedImage = await processImage(logo.imageBase64, {
          removeBg: filters.removeBgThreshold > 0 || logo.removeBg,
          bgThreshold: filters.removeBgThreshold ?? logo.bgThreshold,
          brightness: filters.brightness ?? logo.brightness,
          contrast: filters.contrast ?? logo.contrast,
          saturate: filters.saturation ?? logo.saturate,
          hueShift: filters.hueShift ?? logo.hueShift,
          invert: filters.invert ?? logo.invert,
        })

        // Renderização com sprites empilhados para dar impressao 3D
        logoMesh = createImageLabel(processedImage, logoWidth, logoHeight, logoDepth)
      }
    } else {
      logoMesh = new THREE.Mesh(
        new THREE.BoxGeometry(logoWidth, logoHeight, Math.max(logoDepth, 2)),
        new THREE.MeshStandardMaterial({
          color: logo.color,
          transparent: true,
          opacity: 0.3,
        }),
      )
    }

    logoMesh.position.set(
      logo.positionX,
      baseHeight + plateHeight + logoHeight / 2 + logo.positionY,
      logo.positionZ || 0,
    )
    logoMesh.rotation.x += degToRad(logo.rotationX)
    logoMesh.rotation.y += degToRad(logo.rotationY)
    logoMesh.rotation.z += degToRad(logo.rotationZ)
    group.add(logoMesh)
  }

  scene.add(group)

  // Força uma renderização limpa após adicionar os novos objetos
  if (renderer) {
    renderer.clear()
    renderer.render(scene, camera)
  }

  // Libera flag para permitir próxima criação
  isCreatingModel = false
}

const TARGET_FPS = 60
const FRAME_INTERVAL = 1000 / TARGET_FPS
let lastFrameTime = 0

function animate(time) {
  animationId = requestAnimationFrame(animate)
  if (time - lastFrameTime < FRAME_INTERVAL) return
  lastFrameTime = time
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
  try {
    console.log('[SceneTemplate] onMounted iniciado')
    await nextTick()
    loadFonts()
    initScene()

    // Listeners para resize
    window.addEventListener('resize', debouncedResize)

    // Listener para reload de saves
    window.addEventListener('reload-scene', () => {
      createModel()
    })

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
    console.log('[SceneTemplate] onMounted completo')
  } catch (error) {
    console.error('[SceneTemplate] Erro crítico no onMounted:', error)
    console.error('[SceneTemplate] Stack:', error?.stack)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', debouncedResize)
  window.removeEventListener('reload-scene', () => {
    createModel()
  })

  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  if (modelUpdateRafId) {
    cancelAnimationFrame(modelUpdateRafId)
    modelUpdateRafId = null
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

// Atualiza em tempo real, no maximo uma vez por frame
let modelUpdateRafId = null

function throttledModelUpdate() {
  if (modelUpdateRafId) return
  modelUpdateRafId = requestAnimationFrame(() => {
    modelUpdateRafId = null
    createModel()
  })
}

watch(
  () => parts,
  () => throttledModelUpdate(),
  {
    deep: true,
    flush: 'post', // Executa APÓS o DOM ser atualizado
  },
)
</script>
