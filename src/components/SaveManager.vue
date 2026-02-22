<template>
  <div class="save-manager">
    <!-- Botão de expansão -->
    <q-btn
      :icon="isExpanded ? 'expand_more' : 'expand_less'"
      color="dark"
      round
      flat
      @click="toggleExpanded"
      class="expand-btn"
    >
      <q-tooltip>{{ isExpanded ? 'Fechar' : 'Abrir' }} Saves</q-tooltip>
    </q-btn>

    <!-- Painel retrátil -->
    <transition enter-active-class="animated slideInUp" leave-active-class="animated slideOutDown">
      <div v-if="isExpanded" class="save-panel">
        <div class="save-header">
          <h6 class="q-my-none">Salvos</h6>
          <div class="row q-gutter-xs items-center">
            <q-linear-progress
              v-if="saves.loading"
              indeterminate
              size="sm"
              color="primary"
              style="width: 40px; height: 2px"
            />
            <q-btn
              icon="save"
              size="sm"
              flat
              dense
              color="positive"
              @click="openSaveDialog"
              :disable="saves.loading"
            >
              <q-tooltip>Salvar Projeto</q-tooltip>
            </q-btn>
            <q-btn
              icon="refresh"
              size="sm"
              flat
              dense
              color="info"
              @click="saves.refresh()"
              :disable="saves.loading"
            >
              <q-tooltip>Recarregar</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Mensagem de erro -->
        <div v-if="saves.error" class="text-negative q-pa-md text-caption">⚠ {{ saves.error }}</div>

        <!-- Lista de saves -->
        <q-scroll-area style="height: 300px" class="save-list">
          <div v-if="saves.list.length === 0" class="text-center text-grey-5 q-pa-md">
            <p>Nenhum save ainda</p>
          </div>

          <div v-for="save in saves.list" :key="save.id" class="save-item">
            <div class="save-info">
              <div class="save-name">{{ save.name }}</div>
              <div class="save-date">{{ formatDateDisplay(save.created_at) }}</div>
            </div>
            <div class="save-actions">
              <q-btn icon="restore" size="sm" flat dense color="info" @click="loadSave(save.id)">
                <q-tooltip>Carregar</q-tooltip>
              </q-btn>
              <q-btn
                icon="update"
                size="sm"
                flat
                dense
                color="warning"
                @click="() => confirmUpdateSave(save.id)"
              >
                <q-tooltip>Atualizar</q-tooltip>
              </q-btn>
              <q-btn
                icon="delete"
                size="sm"
                flat
                dense
                color="negative"
                @click="() => deleteSaveItem(save.id)"
              >
                <q-tooltip>Deletar</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-scroll-area>
      </div>
    </transition>

    <!-- Dialog customizado simples para salvar (sem q-dialog) -->
    <div
      v-show="showSaveDialog"
      class="custom-dialog-overlay"
      @click.self="showSaveDialog = false"
      @keyup.esc="showSaveDialog = false"
    >
      <div class="custom-dialog">
        <div class="custom-dialog-header">
          <h6>Salvar Projeto</h6>
          <button @click="showSaveDialog = false" class="close-btn">×</button>
        </div>
        <div class="custom-dialog-body">
          <label>Nome do Projeto:</label>
          <input
            v-model="saveName"
            type="text"
            class="custom-input"
            @keyup.enter="performSave"
            @keyup.esc="showSaveDialog = false"
            ref="saveInput"
            placeholder="Digite o nome..."
          />
        </div>
        <div class="custom-dialog-actions">
          <button @click="showSaveDialog = false" class="btn-secondary">Cancelar</button>
          <button @click="performSave" class="btn-primary">Salvar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { saves, formatDateDisplay } from 'src/composables/savesSupabase'
import { parts } from 'src/composables/data'

const isExpanded = ref(false)
const showSaveDialog = ref(false)
const saveName = ref('')
const saveInput = ref(null)

// Carrega lista de saves ao montar
onMounted(() => {
  saves.refresh().catch((error) => {
    console.error('Erro ao carregar saves:', error)
    // Falha silenciosa se Supabase não estiver configurado
  })
})

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

async function openSaveDialog() {
  saveName.value = ''
  showSaveDialog.value = true

  await nextTick()

  if (saveInput.value) {
    saveInput.value.focus()
  } else {
    // Fallback: procura input manualmente
    const inputs = document.querySelectorAll('.custom-input')
    if (inputs.length > 0) {
      inputs[0].focus()
    }
  }
}

async function performSave() {
  const trimmedName = saveName.value.trim()

  if (!trimmedName) {
    return
  }

  try {
    // Cria cópia dos dados atuais
    const projectData = {
      base: { ...parts.base },
      topPlate: { ...parts.topPlate },
      titles: parts.titles.map((t) => ({ ...t })),
      subtitles: parts.subtitles ? [...parts.subtitles] : [],
      logos: parts.logos.map((l) => ({ ...l })),
    }

    await saves.save(trimmedName, projectData)
    showSaveDialog.value = false
  } catch (error) {
    console.error('Erro ao salvar:', error)
  }
}

async function loadSave(saveId) {
  try {
    const projectData = await saves.load(saveId)

    // Atualiza cada propriedade individualmente para manter reatividade
    Object.keys(projectData.base).forEach((key) => {
      parts.base[key] = projectData.base[key]
    })

    Object.keys(projectData.topPlate).forEach((key) => {
      parts.topPlate[key] = projectData.topPlate[key]
    })

    parts.titles = projectData.titles.map((t, idx) => ({
      id: t.id ?? `${Date.now()}-title-${idx}`,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      ...t,
    }))
    parts.logos = projectData.logos.map((l, idx) => ({
      id: l.id ?? `${Date.now()}-logo-${idx}`,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      ...l,
    }))

    // Emite evento para recriar modelo
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('reload-scene'))
    }, 100)
  } catch (error) {
    console.error('Erro ao carregar:', error)
  }
}

async function deleteSaveItem(saveId) {
  try {
    await saves.delete(saveId)
    await saves.refresh()
  } catch (error) {
    console.error('Erro ao deletar:', error)
  }
}

async function confirmUpdateSave(saveId) {
  try {
    // Cria cópia dos dados atuais
    const projectData = {
      base: { ...parts.base },
      topPlate: { ...parts.topPlate },
      titles: parts.titles.map((t) => ({ ...t })),
      subtitles: parts.subtitles ? [...parts.subtitles] : [],
      logos: parts.logos.map((l) => ({ ...l })),
    }

    await saves.update(saveId, projectData)
    await saves.refresh()
  } catch (error) {
    console.error('Erro ao atualizar:', error)
  }
}
</script>

<style scoped lang="scss">
.save-manager {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.expand-btn {
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.save-panel {
  background: rgba(30, 30, 30, 0.95);
  border-radius: 8px 8px 0 0;
  border: 1px solid #555;
  min-width: 350px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);

  .save-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #555;
  }

  h6 {
    color: #fff;
    font-weight: 500;
  }
}

.save-list {
  background: rgba(20, 20, 20, 0.8);
}

.save-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #333;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}

.save-info {
  flex: 1;
  overflow: hidden;
}

.save-name {
  color: #fff;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.save-date {
  color: #888;
  font-size: 12px;
  margin-top: 4px;
}

.save-actions {
  display: flex;
  gap: 4px;
  margin-left: 10px;
  flex-shrink: 0;
}

/* Dialog customizado */
.custom-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.custom-dialog {
  background: #1e1e1e;
  border-radius: 8px;
  min-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border: 1px solid #555;
}

.custom-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #555;

  h6 {
    margin: 0;
    color: #fff;
    font-size: 18px;
    font-weight: 500;
  }
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.custom-dialog-body {
  padding: 20px;

  label {
    display: block;
    color: #ccc;
    margin-bottom: 8px;
    font-size: 14px;
  }
}

.custom-input {
  width: 100%;
  padding: 10px 12px;
  background: #2a2a2a;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #1976d2;
  }
}

.custom-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #555;

  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &.btn-secondary {
      background: #444;
      color: #fff;

      &:hover {
        background: #555;
      }
    }

    &.btn-primary {
      background: #1976d2;
      color: #fff;

      &:hover {
        background: #1565c0;
      }
    }
  }
}

.animated {
  animation-duration: 0.3s;
}

.slideInUp {
  animation: slideInUp 0.3s ease-out;
}

.slideOutDown {
  animation: slideOutDown 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideOutDown {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
}
</style>
