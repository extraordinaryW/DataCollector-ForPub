<template>
  <div class="panel">
    <div class="panel-header">
      <h2>根据用户查询</h2>
      <div class="header-actions">
        <div v-if="fileLoading" class="file-loading">正在解析文件...</div>
        <input
          ref="fileImport"
          type="file"
          accept=".xlsx,.xls"
          style="display: none;"
          @change="handleFileImport"
        />
        <!-- <button class="ghost" :disabled="loading" @click="triggerFileInput">导入</button> -->
        <button class="ghost" @click="emit('close')">关闭</button>
      </div>
    </div>

    <div class="form-grid">
      <label>平台</label>
      <div class="seg">
        <label><input type="radio" value="douyin" v-model="platform" /> 抖音</label>
        <label><input type="radio" value="bilibili" v-model="platform" /> B站</label>
      </div>

      <label>用户名称列表（每行用\n或逗号分隔，最多100个） </label>
      <textarea v-model="authorNamesInput" rows="4" placeholder="用户名A\n用户名B"></textarea>

      <label>limit（每页上限，≤2000）</label>
      <input type="number" v-model.number="limit" min="1" max="2000" placeholder="100" />
    </div>

    <div class="actions">
      <button :disabled="loading" @click="submitSearch">查询</button>
      <button :disabled="loading || (!returnedScrollId)" @click="nextPage">下一批次</button>
      <button :disabled="loading || results.length===0" @click="downloadExcel">导出Excel</button>
      <button :disabled="loading" @click="resetAll">重置结果</button>
    </div>

    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    <div v-if="loading" class="loading">正在加载...</div>

    <div v-if="results.length>0" class="result">
      <div class="result-meta">
        <span>返回 {{ results.length }}条</span>
        <!-- <n-ellipsis v-if="returnedScrollId">scroll_id：{{ returnedScrollId }}</n-ellipsis> -->
        <span>最大粉丝数过滤：</span>
        <n-space>
          <n-switch v-model:value="maxFollowersFilter" />
        </n-space>
      </div>
      <n-data-table
        :bordered="false"
        :single-line="false"
        :columns="columns"
        :data="results"
        :max-height="350"
        :min-row-height="48"
        :pagination="pagination"
        :scroll-x="scrollX"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed,watch } from 'vue'
import { exportJsonToExcel } from '@/utils/exportExcel'
import { NDataTable, NSpace, NSwitch } from 'naive-ui'
import { createUserColumns } from '@/columns/findByUserColumns'
import { getUserHeaderMap } from '@/columns/findByUserHeaderMap'
const emit = defineEmits(['close'])

const platform = ref('douyin') // 'douyin' | 'bilibili'
const douyinEndpointUrl = ref(import.meta.env.VITE_DOUYIN_USER_API_BASE)
const biliEndpointUrl = ref(import.meta.env.VITE_BILIBILI_USER_API_BASE)
const finalEndpointUrl = computed(() => platform.value === 'douyin' ? douyinEndpointUrl.value : biliEndpointUrl.value)
const apiKey = ref(import.meta.env.VITE_API_KEY)
const limit = ref(100)
const authorNamesInput = ref('')

const loading = ref(false)
const fileLoading = ref(false)
const errorMessage = ref('')
const results = shallowRef([])
const rawResults = shallowRef([])
const rawMaxFollowers = ref([])
const returnedScrollId = ref('')

const fileImport = ref(null)

const parsedAuthorNames = computed(() => parseList(authorNamesInput.value))
const maxFollowersFilter = ref(false)

watch(maxFollowersFilter, (enabled) => {
  results.value = enabled ? rawMaxFollowers.value : rawResults.value
})

// 页面中的表格数据
const columns = computed(() => createUserColumns(platform.value))
const pagination = {
  pageSize: 10
};

// 动态设置横向滚动宽度
const scrollX = ref(5000);

async function handleFileImport(event) {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    fileLoading.value = true
    errorMessage.value = ''

    // 这里需要安装 xlsx 库：npm install xlsx
    const XLSX = await import('xlsx')
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)
        
        // 将导入的数据添加到结果中
        results.value = jsonData
        
        // 清空文件输入，允许重复导入同一个文件
        event.target.value = ''
      } catch (err) {
        errorMessage.value = '解析Excel文件失败：' + err.message
      } finally {
        fileLoading.value = false
      }
    }
    reader.onerror = () => {
      errorMessage.value = '读取文件失败'
      fileLoading.value = false
    }
    reader.readAsArrayBuffer(file)
  } catch (err) {
    errorMessage.value = '导入失败：' + err.message
    fileLoading.value = false
  }
}

function parseList(raw) {
  // 支持按行或逗号分隔，自动去重与去空白
  const items = raw
    .split(/\r?\n|,/)
    .map(s => s.trim())
    .filter(Boolean)
  const seen = new Set()
  const unique = []
  for (const v of items) {
    if (!seen.has(v)) {
      seen.add(v)
      unique.push(v)
    }
  }
  return unique.slice(0, 100) // 限制最多100个
}

function buildParams(isNextPage = false) {
  const params = new URLSearchParams()
  params.set('author_names', parsedAuthorNames.value.join(','))
  params.set('api_key', apiKey.value)
  params.set('limit', String(Number(limit.value) || 100))
  
  const sid = isNextPage ? returnedScrollId.value : ''
  if (sid) params.set('scroll_id', sid)
  return params
}

async function submitSearch() {
  errorMessage.value = ''
  results.value = []
  returnedScrollId.value = ''

  const err = validateParams(false)
  if (err) {
    errorMessage.value = err
    return
  }

  const params = buildParams(false)
  await doRequest(params)
}

async function nextPage() {
  errorMessage.value = ''
  const err = validateParams(true)
  if (err) {
    errorMessage.value = err
    return
  }

  const params = buildParams(true)
  await doRequest(params)
}

function validateParams(isNextPage = false) {
  if (parsedAuthorNames.value.length === 0) return '请至少填写一个用户名称'
  // 翻页请求：只需要 scroll_id 与必要上下文参数
  if (!finalEndpointUrl.value) return '请填写对应平台的后端接口地址'
  if (!apiKey.value) return '请填写 api_key'

  if (isNextPage) {
    if (!returnedScrollId.value) return '缺少 scroll_id，无法继续翻页'
    return ''
  }
  
  if (!authorNamesInput.value) return '请输入您要查询的用户名称'

  const lim = Number(limit.value)
  if (!Number.isFinite(lim) || lim <= 0) return 'limit 必须为正整数'
  if (lim > 2000) return 'limit 不能超过 2000'
  return ''
}

async function doRequest(params) {
  loading.value = true
  try {
    const url = finalEndpointUrl.value + (params.toString() ? ('?' + params.toString()) : '')
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '')
      throw new Error('请求失败：' + resp.status + ' ' + resp.statusText + (txt ? ('\n' + txt) : ''))
    }
    const data = await resp.json()
    // 约定后端返回：{ data: [...], scroll_id: '...', total?: number }
    const list = Array.isArray(data?.data?.data) ? data.data.data : []
    const maxFollowersList = Array.isArray(data?.data?.max_followers) ? data.data.max_followers : []
    rawResults.value = list.map(r => Object.freeze({...r}))
    rawMaxFollowers.value = maxFollowersList.map(r => Object.freeze({...r}))
    results.value = maxFollowersFilter.value ? rawMaxFollowers.value : rawResults.value
    returnedScrollId.value = data?.data?.scroll_id || ''
  } catch (e) {
    errorMessage.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

function resetAll() {
  returnedScrollId.value = ''
  rawResults.value = []
  rawMaxFollowers.value = []
  results.value = []
}

function downloadExcel() {
  const headerMap = getUserHeaderMap(platform.value)
  exportJsonToExcel(results.value, `${platform.value}_users.xlsx`, 'Sheet1', undefined, headerMap)
}

</script>

<style scoped>
:deep(.n-data-table-th) {
  font-weight: bold;
  background-color: #f9fafb;
}
.panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.header-actions {
  display: flex;
  gap:12px;
  align-items: center;
}
.form-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap:10px 12px;
  align-items: center;
  margin-right: 8px;
}
.form-grid input[type="text"],
.form-grid input[type="date"],
.form-grid input:not([type]),
.form-grid input[type="number"],
.form-grid textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}
.seg {
  display: flex;
  gap: 16px;
}
.actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}
.ghost {
  background: transparent;
  border: 1px solid #d1d5db;
  padding: 6px 10px;
  border-radius: 6px;
}
.hint { color: #6b7280; margin-top: 8px; }
.error { color: #b91c1c; margin-top: 8px; white-space: pre-wrap; }
.result { margin-top: 12px; }
.result-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  color: #374151; 
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
  justify-content: center;
}
</style>