import { reactive } from 'vue'
import { supabase } from 'src/lib/supabase'

// Constantes
const STORAGE_BUCKET = 'project-logos'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB por arquivo

// Função auxiliar para converter base64 para Blob
function base64ToBlob(base64String, mimeType = 'image/png') {
  const bstr = atob(base64String.split(',')[1])
  const n = bstr.length
  const u8arr = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }
  return new Blob([u8arr], { type: mimeType })
}

// Função para fazer upload de arquivo para o storage
async function uploadLogoFile(saveId, logoId, fileBase64) {
  try {
    // Determina MIME type
    const mimeType = fileBase64.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png'

    // Cria blob do arquivo
    const blob = base64ToBlob(fileBase64, mimeType)

    // Valida tamanho
    if (blob.size > MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande: ${(blob.size / 1024 / 1024).toFixed(2)}MB (máx 10MB)`)
    }

    // Caminho único no storage
    const timestamp = Date.now()
    const ext = mimeType === 'image/svg+xml' ? 'svg' : 'png'
    const storagePath = `${saveId}/${logoId}-${timestamp}.${ext}`

    // Faz upload
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, blob, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) throw uploadError

    return storagePath
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    throw error
  }
}

// Função para deletar arquivo do storage
async function deleteLogoFile(storagePath) {
  try {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])

    if (error) throw error
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    // Não lança erro aqui pra não quebrar o fluxo de delete do save
  }
}

// Função para obter URL pública do arquivo
function getLogoUrl(storagePath) {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)
  return data?.publicUrl || null
}

// Estado reativo de saves
export const saves = reactive({
  list: [],
  loading: false,
  error: null,

  async refresh() {
    try {
      this.loading = true
      this.error = null

      const { data, error } = await supabase
        .from('saves')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      this.list = data || []
    } catch (error) {
      console.error('Erro ao carregar saves:', error)
      this.error = error.message
      throw error
    } finally {
      this.loading = false
    }
  },

  async save(projectName, projectData) {
    try {
      this.loading = true

      // Cria save no banco primeiro
      const { data: saveData, error: saveError } = await supabase
        .from('saves')
        .insert({
          name: projectName,
          project_data: projectData,
          created_at: new Date().toISOString(),
        })
        .select()

      if (saveError) throw saveError

      const newSave = saveData[0]
      const saveId = newSave.id

      // Faz upload dos arquivos dos logos
      const logoUploadPromises = projectData.logos
        .filter((logo) => logo.imageBase64)
        .map(async (logo) => {
          try {
            const storagePath = await uploadLogoFile(saveId, logo.id, logo.imageBase64)

            // Registra no banco
            await supabase.from('save_logo_files').insert({
              save_id: saveId,
              logo_id: logo.id,
              storage_path: storagePath,
            })
          } catch (error) {
            console.error(`Erro ao fazer upload do logo ${logo.id}:`, error)
            // Continua mesmo se algum arquivo falhar
          }
        })

      await Promise.all(logoUploadPromises)

      this.list.unshift(newSave)

      return newSave
    } catch (error) {
      console.error('Erro ao salvar:', error)
      this.error = error.message
      throw error
    } finally {
      this.loading = false
    }
  },

  async load(saveId) {
    try {
      const { data, error } = await supabase
        .from('saves')
        .select('project_data')
        .eq('id', saveId)
        .single()

      if (error) throw error

      const projectData = data.project_data

      // Carrega as URLs dos logos do storage
      const { data: logoFiles, error: logoError } = await supabase
        .from('save_logo_files')
        .select('*')
        .eq('save_id', saveId)

      if (!logoError && logoFiles) {
        // Mapeia storage paths para logo IDs
        const logoUrlMap = {}
        logoFiles.forEach((file) => {
          logoUrlMap[file.logo_id] = getLogoUrl(file.storage_path)
        })

        // Carrega imagens do storage e converte para base64
        for (const logo of projectData.logos) {
          if (logoUrlMap[logo.id]) {
            try {
              const response = await fetch(logoUrlMap[logo.id])
              const blob = await response.blob()
              const reader = new FileReader()

              await new Promise((resolve, reject) => {
                reader.onload = resolve
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })

              logo.imageBase64 = reader.result
            } catch (error) {
              console.error(`Erro ao carregar logo ${logo.id}:`, error)
            }
          }
        }
      }

      return projectData
    } catch (error) {
      console.error('Erro ao carregar projeto:', error)
      this.error = error.message
      throw error
    }
  },

  async delete(saveId) {
    try {
      this.loading = true

      // Carrega logo files para deletar arquivos
      const { data: logoFiles } = await supabase
        .from('save_logo_files')
        .select('storage_path')
        .eq('save_id', saveId)

      // Deleta arquivos do storage
      if (logoFiles) {
        const deletePromises = logoFiles.map((file) => deleteLogoFile(file.storage_path))
        await Promise.all(deletePromises)
      }

      // Deleta registros do banco (cascade vai deletar as logo files também)
      const { error } = await supabase.from('saves').delete().eq('id', saveId)

      if (error) throw error

      this.list = this.list.filter((s) => s.id !== saveId)
    } catch (error) {
      console.error('Erro ao deletar:', error)
      this.error = error.message
      throw error
    } finally {
      this.loading = false
    }
  },

  async update(saveId, projectData) {
    try {
      this.loading = true

      // Carrega logo files antigos
      const { data: oldLogoFiles } = await supabase
        .from('save_logo_files')
        .select('*')
        .eq('save_id', saveId)

      // Cria mapa de logo IDs antigos
      const oldLogoMap = {}
      if (oldLogoFiles) {
        oldLogoFiles.forEach((file) => {
          if (!oldLogoMap[file.logo_id]) {
            oldLogoMap[file.logo_id] = []
          }
          oldLogoMap[file.logo_id].push(file)
        })
      }

      // Cria mapa dos logos novos
      const newLogoMap = {}
      projectData.logos.forEach((logo) => {
        newLogoMap[logo.id] = logo
      })

      // Remove logos que não existem mais
      for (const [logoId, files] of Object.entries(oldLogoMap)) {
        if (!newLogoMap[logoId]) {
          // Logo foi deletado, remove todos os arquivos
          for (const file of files) {
            await deleteLogoFile(file.storage_path)
            await supabase.from('save_logo_files').delete().eq('id', file.id)
          }
        } else if (newLogoMap[logoId].imageBase64) {
          // Logo existe mas tem nova imagem, remove arquivo antigo
          for (const file of files) {
            await deleteLogoFile(file.storage_path)
            await supabase.from('save_logo_files').delete().eq('id', file.id)
          }
        }
      }

      // Atualiza dados no banco
      const { error: updateError } = await supabase
        .from('saves')
        .update({
          project_data: projectData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', saveId)

      if (updateError) throw updateError

      // Faz upload dos novos arquivos de logos
      const logoUploadPromises = projectData.logos
        .filter((logo) => logo.imageBase64)
        .map(async (logo) => {
          try {
            const storagePath = await uploadLogoFile(saveId, logo.id, logo.imageBase64)
            await supabase.from('save_logo_files').insert({
              save_id: saveId,
              logo_id: logo.id,
              storage_path: storagePath,
            })
          } catch (error) {
            console.error(`Erro ao fazer upload do logo ${logo.id}:`, error)
          }
        })

      await Promise.all(logoUploadPromises)

      // Atualiza save na lista
      const saveIndex = this.list.findIndex((s) => s.id === saveId)
      if (saveIndex !== -1) {
        this.list[saveIndex].project_data = projectData
        this.list[saveIndex].updated_at = new Date().toISOString()
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      this.error = error.message
      throw error
    } finally {
      this.loading = false
    }
  },
})

export function formatDateDisplay(isoDate) {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
