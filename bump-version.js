#!/usr/bin/env node
/**
 * Script para incrementar a versão do package.json
 * Uso: node bump-version.js [type]
 * type: 'major', 'minor', 'patch' (padrão: 'patch')
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packagePath = path.join(__dirname, 'package.json')
const type = process.argv[2] || 'patch'

try {
  const packageJSON = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
  const [major, minor, patch] = packageJSON.version.split('.').map(Number)

  let newVersion
  switch (type.toLowerCase()) {
    case 'major':
      newVersion = `${major + 1}.0.0`
      break
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`
      break
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`
  }

  packageJSON.version = newVersion
  fs.writeFileSync(packagePath, JSON.stringify(packageJSON, null, 2) + '\n', 'utf-8')

  console.log(`✓ Versão atualizada: ${packageJSON.version}`)
  process.exit(0)
} catch (error) {
  console.error('✗ Erro ao atualizar versão:', error.message)
  process.exit(1)
}
