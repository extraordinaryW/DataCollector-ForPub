<script setup>
defineProps({
  msg: String,
})

const emit = defineEmits(['open-find-by-author', 'open-find-by-user'])

function openFindByAuthor() {
  emit('open-find-by-author')
}

function openFindByUser() {
  emit('open-find-by-user')
}
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="demand">
    <button type="button" @click="openFindByAuthor">根据作者查询</button>
    <button style="margin-left: 20px;" type="button" @click="openFindByUser">根据用户查询</button>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
