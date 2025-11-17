<template>
  <n-config-provider>
    <n-message-provider>
      <div>    
        <img src="./assets/douyin.svg" class="logo" alt="Vite logo" />
        <img src="./assets/bilibili.svg" class="logo vue" alt="Vue logo" />
      </div>
      <Home msg="抖音 + B站 数据中台" @open-find-by-author="openFindByAuthor" @open-find-by-user="openFindByUser" @open-find-by-keywords="openFindByKeywords" />

      <div v-if="showFindByAuthor" style="margin-top: 16px;">
        <FindByAuthor @close="closeFindByAuthor" />
      </div>

      <div v-if="showFindByUser" style="margin-top: 16px;">
        <FindByUser @close="closeFindByUser" />
      </div>

      <div v-if="showFindByKeywords" style="margin-top: 16px">
        <FindByKeywords @close="closeFindByKeywords" />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { ref } from 'vue'
import Home from './components/Home.vue'
import { NMessageProvider, NConfigProvider } from 'naive-ui'
import FindByAuthor from './views/FindByAuthor.vue'
import FindByUser from './views/FindByUser.vue'
import FindByKeywords from './views/FindByKeywords.vue'

const showFindByAuthor = ref(false)
const showFindByUser = ref(false)
const showFindByKeywords = ref(false)
function openFindByAuthor() {
  showFindByAuthor.value = true
  showFindByKeywords.value = false
  showFindByUser.value = false
}
function closeFindByAuthor() {
  showFindByAuthor.value = false
}
function openFindByUser() {
  showFindByUser.value = true
  showFindByKeywords.value = false
  showFindByAuthor.value = false
}
function closeFindByUser() {
  showFindByUser.value = false
}
function openFindByKeywords() {
  showFindByKeywords.value = true
  showFindByAuthor.value = false
  showFindByUser.value = false
}
function closeFindByKeywords() {
  showFindByKeywords.value = false
}
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
