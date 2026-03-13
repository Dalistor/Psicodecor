import { reactive } from 'vue'

export const saves = reactive({
  list: [],
  loading: false,
  error: null,
  diskSpace: {
    free: 0,
    total: 0,
  },

  async getDiskSpace() {
    try {
      if (window.fsApi && window.fsApi.getDiskSpace) {
        const stats = await window.fsApi.getDiskSpace()
        this.diskSpace = stats
      }
    } catch (error) {
      console.error('Erro ao ler espaço do disco', error)
    }
  },

  async refresh() {
    try {
      this.loading = true
      this.error = null

      if (!window.fsApi) {
        throw new Error('API Local de arquivos não encontrada. Execute via Electron.')
      }

      const projects = await window.fsApi.listProjects()
      this.list = projects || []

      await this.getDiskSpace()
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
      this.error = null

      const newSave = await window.fsApi.saveProject({
        name: projectName,
        projectData: JSON.parse(JSON.stringify(projectData)),
      })

      // Adiciona no início da lista para mockar o reorder
      this.list.unshift(newSave)

      await this.getDiskSpace()
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
      this.error = null
      const projectData = await window.fsApi.loadProject(saveId)
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
      this.error = null

      await window.fsApi.deleteProject(saveId)
      this.list = this.list.filter((s) => s.id !== saveId)

      await this.getDiskSpace()
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
      this.error = null

      const updatedSave = await window.fsApi.updateProject({
        id: saveId,
        projectData: JSON.parse(JSON.stringify(projectData)),
      })

      const saveIndex = this.list.findIndex((s) => s.id === saveId)
      if (saveIndex !== -1) {
        this.list[saveIndex] = updatedSave
      }

      await this.getDiskSpace()
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
