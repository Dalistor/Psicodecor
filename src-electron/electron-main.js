import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

const currentDir = fileURLToPath(new URL('.', import.meta.url))

let mainWindow

// Setup do diretório de saves
async function setupSavesDir() {
  const userDataPath = app.getPath('userData')
  const savesDir = path.join(userDataPath, 'saves')
  try {
    await fs.mkdir(savesDir, { recursive: true })
  } catch (error) {
    console.error('Erro ao criar diretório root de saves:', error)
  }
  return savesDir
}

function parseJSON(content) {
  try {
    return JSON.parse(content)
  } catch {
    return null
  }
}

// Configuração IPC
async function setupIpcHandlers() {
  const savesDir = await setupSavesDir()

  ipcMain.handle('get-disk-space', async () => {
    try {
      // statfs retorna informações de espaço no Linux, macOS e Windows(experimental)
      const stats = await fs.statfs(savesDir)
      const freeSpace = stats.bavail * stats.bsize
      const totalSpace = stats.blocks * stats.bsize
      return {
        free: freeSpace,
        total: totalSpace,
      }
    } catch (error) {
      console.error('Erro ao ler espaço em disco:', error)
      return { free: 0, total: 0 }
    }
  })

  ipcMain.handle('list-projects', async () => {
    try {
      const files = await fs.readdir(savesDir)
      const projects = []

      for (const file of files) {
        if (!file.endsWith('.json')) continue

        const filePath = path.join(savesDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const data = parseJSON(content)

        if (data) {
          projects.push({
            id: file.replace('.json', ''),
            name: data.name,
            created_at: data.created_at,
            updated_at: data.updated_at,
            // Não enviamos todo o conteúdo listando para ser mais rápido
          })
        }
      }

      // Ordena por data decrescente
      return projects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } catch (error) {
      console.error('Erro ao listar projetos:', error)
      throw error
    }
  })

  ipcMain.handle('save-project', async (_, { name, projectData }) => {
    try {
      const id = Date.now().toString()
      const saveObject = {
        id,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        project_data: projectData,
      }

      const filePath = path.join(savesDir, `${id}.json`)
      await fs.writeFile(filePath, JSON.stringify(saveObject, null, 2), 'utf-8')

      return saveObject // Retorna o save (semelhante ao row do banco)
    } catch (error) {
      console.error('Erro ao salvar o projeto:', error)
      throw error
    }
  })

  ipcMain.handle('load-project', async (_, id) => {
    try {
      const filePath = path.join(savesDir, `${id}.json`)
      const content = await fs.readFile(filePath, 'utf-8')
      const data = parseJSON(content)

      if (!data) throw new Error('Projeto corrompido ou inválido')

      return data.project_data
    } catch (error) {
      console.error('Erro ao carregar o projeto:', error)
      throw error
    }
  })

  ipcMain.handle('update-project', async (_, { id, projectData }) => {
    try {
      const filePath = path.join(savesDir, `${id}.json`)
      const content = await fs.readFile(filePath, 'utf-8')
      const existingData = parseJSON(content)

      if (!existingData) throw new Error('Projeto não encontrado ou corrompido')

      const saveObject = {
        ...existingData,
        updated_at: new Date().toISOString(),
        project_data: projectData,
      }

      await fs.writeFile(filePath, JSON.stringify(saveObject, null, 2), 'utf-8')

      return saveObject
    } catch (error) {
      console.error('Erro ao atualizar o projeto:', error)
      throw error
    }
  })

  ipcMain.handle('delete-project', async (_, id) => {
    try {
      const filePath = path.join(savesDir, `${id}.json`)
      await fs.rm(filePath, { force: true })
      return true
    } catch (error) {
      console.error('Erro ao deletar o projeto:', error)
      throw error
    }
  })
}

async function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, 'icons/icon.png'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(
        currentDir,
        path.join(
          process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
          'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION,
        ),
      ),
    },
  })

  // Remover menu bar em produção
  if (!process.env.DEV) {
    Menu.setApplicationMenu(null)
  }

  if (process.env.DEV) {
    await mainWindow.loadURL(process.env.APP_URL)
  } else {
    await mainWindow.loadFile('index.html')
  }

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools()
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  await setupIpcHandlers()
  createWindow()
})

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
