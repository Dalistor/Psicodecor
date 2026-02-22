<template>
  <router-view />
</template>

<style>
html,
body,
#q-app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Garante que todos os containers do Quasar tenham 100% de altura */
.q-layout,
.q-page-container,
.q-page {
  height: 100% !important;
}
</style>

<script setup>
import { onErrorCaptured } from 'vue'

// Captura erros globais
onErrorCaptured((err) => {
  console.error('[App] Erro crítico capturado:', err)
  console.error('[App] Stack:', err?.stack)
  return false // Impede propagação
})

console.log('[App] Psicodecor iniciado')
</script>
