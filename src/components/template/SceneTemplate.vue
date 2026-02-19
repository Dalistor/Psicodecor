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
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { parts, sceneConfig } from 'src/composables/data'

const container = ref(null)
let scene, camera, renderer, controls, animationId
let fontLoaded = false
let fonts = {} // Cache de fontes carregadas
let isCreatingModel = false // Flag para evitar chamadas concorrentes

const CANVAS_PX_PER_MM = 4

// Carrega fontes do Google Fonts
function loadFonts() {
  if (fontLoaded) return

  // Link para todas as fontes Google usadas no projeto
  const link = document.createElement('link')
  link.href =
    'https://fonts.googleapis.com/css2?family=Arial&family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Poppins:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&family=Ubuntu:wght@400;700&family=Nunito:wght@400;700&family=Raleway:wght@400;700&family=Merriweather:wght@400;700&family=Oswald:wght@400;700&family=Source+Sans+3:wght@400;700&family=Bebas+Neue&family=Cinzel:wght@400;700&family=Cormorant+Garamond:wght@400;700&family=Abril+Fatface&family=Archivo+Black&family=Fjalla+One&family=Josefin+Sans:wght@400;700&family=Pacifico&family=Bangers&family=Orbitron:wght@400;700&family=Righteous&family=Rajdhani:wght@400;700&family=Sacramento&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Allura&family=Lobster&family=Satisfy&family=Kaushan+Script&display=swap'
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

// Mapa de fontes Google para fonts JSON (Three.js possui poucas fontes nativas)
const fontLoadMap = {
  Arial: 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/helvetiker_bold.typeface.json',
  Roboto: '/fonts/Roboto_Regular.json',
  'Open Sans': '/fonts/Open Sans_Regular.json',
  Poppins:
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/helvetiker_bold.typeface.json',
  Montserrat:
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/helvetiker_bold.typeface.json',
  Lato: 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/helvetiker_bold.typeface.json',
  Ubuntu: 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/helvetiker_bold.typeface.json',
  Nunito: 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/helvetiker_bold.typeface.json',
  Raleway:
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/helvetiker_bold.typeface.json',
  'Source Sans 3':
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/helvetiker_bold.typeface.json',
  Oswald: 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/optimer_bold.typeface.json',
  'Bebas Neue':
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/optimer_bold.typeface.json',
  'Archivo Black':
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/optimer_bold.typeface.json',
  'Fjalla One':
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/optimer_bold.typeface.json',
  Orbitron: 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/optimer_bold.typeface.json',
  Rajdhani: 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/optimer_bold.typeface.json',
  Righteous: 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/optimer_bold.typeface.json',
  'Playfair Display':
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/gentilis_bold.typeface.json',
  Merriweather:
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/gentilis_bold.typeface.json',
  Cinzel: 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/gentilis_bold.typeface.json',
  'Cormorant Garamond':
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/gentilis_bold.typeface.json',
  'Abril Fatface':
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/gentilis_bold.typeface.json',
  'Josefin Sans':
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/helvetiker_bold.typeface.json',
  Pacifico: 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/gentilis_bold.typeface.json',
  Bangers: 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/optimer_bold.typeface.json',
  Sacramento:
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/gentilis_bold.typeface.json',
  'Dancing Script':
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/gentilis_bold.typeface.json',
  'Great Vibes': '/fonts/Great Vibes_Regular.json',
  Allura: '/fonts/Allura_Regular.json',
  Lobster: 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/optimer_bold.typeface.json',
  Satisfy: 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/gentilis_bold.typeface.json',
  'Kaushan Script':
    'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/fonts/gentilis_bold.typeface.json',
}

async function loadThreeFont(fontFace) {
  if (fonts[fontFace]) return fonts[fontFace]

  const fontUrl = fontLoadMap[fontFace] || fontLoadMap.Roboto
  try {
    const loader = new FontLoader()
    const font = await new Promise((resolve, reject) => {
      loader.load(fontUrl, resolve, undefined, reject)
    })
    fonts[fontFace] = font
    return font
  } catch {
    // Fallback para Roboto se falhar
    const loader = new FontLoader()
    const font = await new Promise((resolve) => {
      loader.load(fontLoadMap.Roboto, resolve)
    })
    fonts[fontFace] = font
    return font
  }
}

async function createTextGeometryMesh(text, fontSize, color, fontFace, letterSpacing, depth) {
  try {
    // TextGeometry tem limitações com caracteres especiais
    // Vamos normalizar o texto e alertar o usuário sobre limitações

    // Caracteres suportados pela maioria das fontes JSON
    const supportedCharset = /[a-zA-Z0-9 \-.,!?;:'"()[\]{}@#$%^&*+=<>/\\/|`~ªºñíéáóú]/
    const unsupported = text
      .split('')
      .filter((ch) => !supportedCharset.test(ch))
      .map((ch) => ch.charCodeAt(0))

    if (unsupported.length > 0) {
      console.warn(
        `TextGeometry: Caracteres especiais não suportados em 3D (${unsupported.join(', ')}). Usando fallback para canvas.`,
      )
      // Retorna fallback
      return createTextLabel(text, fontSize, color, 'bold', fontFace, letterSpacing, depth, null)
    }

    const font = await loadThreeFont(fontFace)

    // fontSize agora está em mm
    const scaledSize = fontSize

    const geometry = new TextGeometry(text, {
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
      letterSpacing: (letterSpacing / Math.max(fontSize, 0.01)) * scaledSize * 0.5,
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
    mesh.userData.isTextGeometry = true
    return mesh
  } catch (err) {
    console.error('Erro ao criar TextGeometry:', err)
    // Fallback para boxObject
    return createTextLabel(text, fontSize, color, 'bold', fontFace, letterSpacing, depth, null)
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
  backgroundColor = null,
) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  const lines = text.split('\n')
  const fontSizePx = Math.max(1, fontSize * CANVAS_PX_PER_MM)
  const letterSpacingPx = letterSpacing * CANVAS_PX_PER_MM
  const lineHeight = fontSizePx * 1.0
  context.font = `${fontWeight} ${fontSizePx}px "${fontFace}", Arial, sans-serif`

  let maxLineWidth = 0
  lines.forEach((line) => {
    let width = 0
    if (letterSpacingPx !== 0) {
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        width += context.measureText(ch).width
        if (i < line.length - 1) width += letterSpacingPx
      }
    } else {
      width = context.measureText(line).width
    }
    if (width > maxLineWidth) maxLineWidth = width
  })

  // Adiciona padding para centralizar melhor o texto
  const paddingX = 20
  const paddingY = lineHeight * 0.5 // Padding proporcional ao tamanho da fonte

  canvas.width = maxLineWidth + paddingX * 2
  canvas.height = lineHeight * lines.length + paddingY * 2

  context.font = `${fontWeight} ${fontSizePx}px "${fontFace}", Arial, sans-serif`

  // Fill background if provided
  if (backgroundColor) {
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  context.fillStyle = color
  context.textAlign = 'left'
  context.textBaseline = 'middle' // Mudado para middle para melhor centralização

  lines.forEach((line, index) => {
    // Centraliza verticalmente considerando o padding
    const yPos = paddingY + lineHeight * (index + 0.5)

    if (letterSpacingPx !== 0) {
      let xPos = paddingX + (maxLineWidth - 0) / 2
      // Calcula largura total da linha com letter spacing
      let totalLineWidth = 0
      for (let i = 0; i < line.length; i++) {
        totalLineWidth += context.measureText(line[i]).width
        if (i < line.length - 1) totalLineWidth += letterSpacingPx
      }
      xPos = paddingX + (maxLineWidth - totalLineWidth) / 2

      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        context.fillText(ch, xPos, yPos)
        xPos += context.measureText(ch).width
        if (i < line.length - 1) xPos += letterSpacingPx
      }
    } else {
      const textWidth = context.measureText(line).width
      const xPos = paddingX + (maxLineWidth - textWidth) / 2
      context.fillText(line, xPos, yPos)
    }
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 16

  const ratio = canvas.width / canvas.height
  // Altura em mm
  const pHeight = fontSize
  const pWidth = pHeight * ratio

  // Se não tem profundidade, usa plano simples
  if (!depth || depth <= 0) {
    const geometry = new THREE.PlaneGeometry(pWidth, pHeight)
    geometry.translate(0, pHeight / 2, 0)

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      roughness: 0.5,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData.height = pHeight
    return mesh
  }

  // Se tem profundidade, cria objeto 3D sólido usando faces separadas
  const group = new THREE.Group()

  // Material com textura do texto para frente e trás
  const textureMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    roughness: 0.5,
  })

  // Material para laterais (cor do texto)
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.6,
  })

  // Face frontal (com textura do texto)
  const frontGeom = new THREE.PlaneGeometry(pWidth, pHeight)
  const frontMesh = new THREE.Mesh(frontGeom, textureMaterial)
  frontMesh.position.set(0, pHeight / 2, depth / 2)
  group.add(frontMesh)

  // Face traseira (com textura do texto)
  const backGeom = new THREE.PlaneGeometry(pWidth, pHeight)
  const backMesh = new THREE.Mesh(backGeom, textureMaterial)
  backMesh.position.set(0, pHeight / 2, -depth / 2)
  backMesh.rotation.y = Math.PI
  group.add(backMesh)

  // Lateral direita
  const rightGeom = new THREE.PlaneGeometry(depth, pHeight)
  const rightMesh = new THREE.Mesh(rightGeom, sideMaterial)
  rightMesh.position.set(pWidth / 2, pHeight / 2, 0)
  rightMesh.rotation.y = Math.PI / 2
  group.add(rightMesh)

  // Lateral esquerda
  const leftGeom = new THREE.PlaneGeometry(depth, pHeight)
  const leftMesh = new THREE.Mesh(leftGeom, sideMaterial)
  leftMesh.position.set(-pWidth / 2, pHeight / 2, 0)
  leftMesh.rotation.y = -Math.PI / 2
  group.add(leftMesh)

  // Topo
  const topGeom = new THREE.PlaneGeometry(pWidth, depth)
  const topMesh = new THREE.Mesh(topGeom, sideMaterial)
  topMesh.position.set(0, pHeight, 0)
  topMesh.rotation.x = -Math.PI / 2
  group.add(topMesh)

  // Base
  const bottomGeom = new THREE.PlaneGeometry(pWidth, depth)
  const bottomMesh = new THREE.Mesh(bottomGeom, sideMaterial)
  bottomMesh.position.set(0, 0, 0)
  bottomMesh.rotation.x = Math.PI / 2
  group.add(bottomMesh)

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

function createExtrudedImageLabel(imageBase64, width, height, depth = 2) {
  const texture = new THREE.TextureLoader().load(imageBase64)
  texture.anisotropy = 16

  const group = new THREE.Group()

  // Material com textura para frente e trás
  const textureMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    roughness: 0.4,
    metalness: 0.1,
  })

  // Material para laterais (cor neutra escura)
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.7,
  })

  // Material preto para o fundo
  const backMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.8,
  })

  // Face frontal (com textura)
  const frontGeom = new THREE.PlaneGeometry(width, height)
  const frontMesh = new THREE.Mesh(frontGeom, textureMaterial)
  frontMesh.position.set(0, height / 2, depth / 2)
  group.add(frontMesh)

  // Face traseira (fundo preto, sem espelhar)
  const backGeom = new THREE.PlaneGeometry(width, height)
  const backMesh = new THREE.Mesh(backGeom, backMaterial)
  backMesh.position.set(0, height / 2, -depth / 2)
  backMesh.rotation.y = Math.PI
  group.add(backMesh)

  // Lateral direita
  const rightGeom = new THREE.PlaneGeometry(depth, height)
  const rightMesh = new THREE.Mesh(rightGeom, sideMaterial)
  rightMesh.position.set(width / 2, height / 2, 0)
  rightMesh.rotation.y = Math.PI / 2
  group.add(rightMesh)

  // Lateral esquerda
  const leftGeom = new THREE.PlaneGeometry(depth, height)
  const leftMesh = new THREE.Mesh(leftGeom, sideMaterial)
  leftMesh.position.set(-width / 2, height / 2, 0)
  leftMesh.rotation.y = -Math.PI / 2
  group.add(leftMesh)

  // Topo
  const topGeom = new THREE.PlaneGeometry(width, depth)
  const topMesh = new THREE.Mesh(topGeom, sideMaterial)
  topMesh.position.set(0, height, 0)
  topMesh.rotation.x = -Math.PI / 2
  group.add(topMesh)

  // Base
  const bottomGeom = new THREE.PlaneGeometry(width, depth)
  const bottomMesh = new THREE.Mesh(bottomGeom, sideMaterial)
  bottomMesh.position.set(0, 0, 0)
  bottomMesh.rotation.x = Math.PI / 2
  group.add(bottomMesh)

  group.userData.height = height
  return group
}

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

function createImageLabel(imageBase64, width, height, depth = 0) {
  const texture = new THREE.TextureLoader().load(imageBase64)
  texture.anisotropy = 16

  // Se não tem profundidade, usa plano simples
  if (!depth || depth <= 0) {
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

  // Se tem profundidade, cria geometria 3D sólida
  const geometry = new THREE.BoxGeometry(width, height, depth)
  geometry.translate(0, height / 2, 0)

  // Cor baseada na textura (usando cinza escuro como padrão para laterais)
  const sideColor = 0x333333

  // Materiais: textura na frente e atrás, cor sólida nas laterais
  const materials = [
    new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.5 }), // Lateral direita
    new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.5 }), // Lateral esquerda
    new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.5 }), // Topo
    new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.5 }), // Base
    new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.5 }), // Frente
    new THREE.MeshStandardMaterial({ map: texture.clone(), transparent: true, roughness: 0.5 }), // Trás
  ]

  return new THREE.Mesh(geometry, materials)
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

    titleMesh.position.set(
      title.positionX,
      baseHeight + plateHeight + title.positionY,
      title.positionZ || 0,
    )
    group.add(titleMesh)
  }

  // 3. SUBTÍTULO (Na face frontal)
  const s = parts.base.content
  await ensureFontLoaded(s.font, 'normal')

  // Detectar caracteres especiais
  const subtitleHasSpecial = /[^a-zA-Z0-9 \-.,!?;:'"()[\]{}@#$%^&*+=<>/\\/|`~ªºñíéáóú]/.test(s.text)
  const subtitleUseTextGeometry = s.renderType === 'textGeometry' && !subtitleHasSpecial

  let subtitleMesh
  if (subtitleUseTextGeometry) {
    subtitleMesh = await createTextGeometryMesh(
      s.text,
      s.fontSize,
      s.color,
      s.font,
      s.letterSpacing,
      s.depth,
    )
    subtitleMesh.position.set(
      s.positionX,
      baseHeight / 2 + s.positionY,
      plateDepth / 2 + 0.5 + (s.positionZ || 0),
    )
  } else {
    subtitleMesh = createTextLabel(
      s.text,
      s.fontSize,
      s.color,
      'normal',
      s.font,
      s.letterSpacing,
      s.depth,
      s.backgroundColor || null,
    )
    subtitleMesh.position.set(s.positionX, 0, plateDepth / 2 + 0.5 + (s.positionZ || 0))
    subtitleMesh.translateY(baseHeight / 2 - (subtitleMesh.userData.height || 0) / 2 + s.positionY)
  }
  group.add(subtitleMesh)

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

        // Renderização 3D sólida com extrusão ou box
        if (logoDepth > 0) {
          logoMesh = createExtrudedImageLabel(processedImage, logoWidth, logoHeight, logoDepth)
        } else {
          logoMesh = createImageLabel(processedImage, logoWidth, logoHeight, logoDepth)
        }
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

// Throttle para evitar múltiplas reconstruções rápidas (~30fps)
let modelUpdateTimeout = null
let lastModelUpdate = 0
const modelUpdateInterval = 33

function throttledModelUpdate() {
  const now = performance.now()
  const elapsed = now - lastModelUpdate

  if (elapsed >= modelUpdateInterval) {
    lastModelUpdate = now
    createModel()
    return
  }

  if (modelUpdateTimeout) {
    clearTimeout(modelUpdateTimeout)
  }

  modelUpdateTimeout = setTimeout(() => {
    lastModelUpdate = performance.now()
    createModel()
  }, modelUpdateInterval - elapsed)
}

watch(
  () => parts,
  () => throttledModelUpdate(),
  { deep: true },
)
</script>
