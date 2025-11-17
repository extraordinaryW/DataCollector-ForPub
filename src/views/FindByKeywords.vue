<template>
  <div class="panel">
    <div class="panel-header">
      <h2>根据作者查询</h2>
      <div class="header-actions">
        <div v-if="fileLoading" class="file-loading">正在解析文件...</div>
        <input
          ref="fileImport"
          type="file"
          accept=".xlsx,.xls"
          style="display: none;"
          @change="handleFileImport"
        />
        <button class="ghost" :disabled="loading" @click="triggerFileInput">导入</button>
        <button class="ghost" @click="emit('close')">关闭</button>
      </div>
    </div>

    <div class="form-grid">
      <label>平台</label>
      <div class="seg">
        <label><input type="radio" value="douyin" v-model="platform" /> 抖音</label>
        <label><input type="radio" value="bilibili" v-model="platform" /> B站</label>
      </div>
      <label>输入模式</label>
      <div class="seg">
        <label><input type="radio" value="none" v-model="inputMode" /> 置空</label>
        <label><input type="radio" value="ids" v-model="inputMode" /> 按用户ID</label>
        <label><input type="radio" value="names" v-model="inputMode" /> 按用户名称</label>
      </div>

      <label v-if="inputMode==='ids' && inputMode !== 'none'">用户ID列表（每行用\n或逗号分隔，最多100个）</label>
      <textarea v-if="inputMode==='ids'" v-model="authorIdsInput" rows="4" placeholder="2803301701\n2803301702"></textarea>

      <label v-if="inputMode==='names' && inputMode !== 'none'">用户名称列表（每行用\n或逗号分隔，最多100个）</label>
      <textarea v-if="inputMode==='names'" v-model="authorNamesInput" rows="4" placeholder="用户名A\n用户名B"></textarea>

      <label>关键词列表（每行用\n或逗号分隔）</label>
      <textarea v-model="keywordsInput" rows="4" placeholder="歌手2025\n歌手2024"></textarea>

      <label>屏蔽词列表（每行用\n或逗号分隔）</label>
      <textarea v-model="blockedWordsInput" rows="4" placeholder="女歌手2025\n男歌手2025"></textarea>

      <label>开始日期 start_date</label>
      <input type="date" v-model="startDate" />

      <label>结束日期 end_date</label>
      <input type="date" v-model="endDate" />

      <label>limit（每页上限，≤2000）</label>
      <input type="number" v-model.number="limit" min="1" max="2000" />

      <label>主贴<b>排序字段</b></label>
      <div class="seg">
        <label><input type="radio" value="interaction" v-model="sort" />互动量</label>
        <label><input type="radio" value="publish_time" v-model="sort" />发布时间</label>
      </div>

      <label>主贴<b>排序顺序</b></label>
      <div class="seg">
        <label><input type="radio" value="asc" v-model="sortOrder" />升序</label>
        <label><input type="radio" value="desc" v-model="sortOrder" />降序</label>
      </div>

      <label>情感类型</label>
      <div class="seg">
        <label><input type="radio" value="1" v-model="sentiment" />正面</label>
        <label><input type="radio" value="0" v-model="sentiment" />中性</label>
        <label><input type="radio" value="-1" v-model="sentiment" />负面</label>
      </div>

      <label>主贴类型</label>
      <div class="seg">
        <label><input type="checkbox" value="video" v-model="postType" />视频</label>
        <label><input type="checkbox" value="image" v-model="postType" />图文</label>
      </div>

      <label>是否为广告贴</label>
      <div class="seg">
        <label><input type="radio" value="0" v-model="isAd" />不是广告</label>
        <label><input type="radio" value="1" v-model="isAd" />是广告</label>
        <label><input type="radio" value="2" v-model="isAd" />非常规视频（如直播切片）</label>
      </div>
    </div>

    <div class="actions">
      <button :disabled="loading" @click="submitSearch">查询</button>
      <button :disabled="loading || (!returnedScrollId)" @click="nextPage">下一批次</button>
      <button :disabled="loading || results.length===0" @click="downloadExcel">导出Excel</button>
      <button class="ghost" :disabled="loading" @click="resetAll">重置结果</button>
    </div>

    <p class="hint">提示：时间范围最大支持100天；不可同时传入用户名称与用户ID；根据“平台”切换调用不同接口。</p>

    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    <div v-if="loading" class="loading">正在加载...</div>

    <div v-if="results.length>0" class="result">
      <div class="result-meta">
        <span>返回 {{ results.length }} 条</span>
        <!-- <n-ellipsis v-if="returnedScrollId">scroll_id：{{ returnedScrollId }}</n-ellipsis> -->
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
import { ref, shallowRef, computed } from 'vue'
import { exportJsonToExcel } from '@/utils/exportExcel'
import { NDataTable } from 'naive-ui'
import { createKeywordsColumns } from '@/columns/findByKeywordsColumns'
import { getKeywordsHeaderMap } from '@/columns/findByKeywordsHeaderMap'
const emit = defineEmits(['close'])

// 表单状态
const platform = ref('douyin') // 'douyin' | 'bilibili'
const sort = ref('interaction') // 'interaction' | 'publish_time'
const sortOrder = ref('desc') // 'asc' | 'desc'
const sentiment = ref('1') // 1: 正面, 0: 中性, -1: 负面
const postType = ref(['video']) // 'video' | 'image'
const isAd = ref('0') // 0: 不是广告, 1: 是广告, 2: 非常规视频（如直播切片）
const douyinEndpointUrl = ref(import.meta.env.VITE_DOUYIN_KEYWORDS_API_BASE)
const biliEndpointUrl = ref(import.meta.env.VITE_BILIBILI_KEYWORDS_API_BASE) 
const finalEndpointUrl = computed(() => platform.value === 'douyin' ? douyinEndpointUrl.value : biliEndpointUrl.value)
const apiKey = ref(import.meta.env.VITE_API_KEY)
const limit = ref(100)
const inputMode = ref('none') // 'none' | 'ids' | 'names'
const authorIdsInput = ref('')
const authorNamesInput = ref('')
const keywordsInput = ref('')
const blockedWordsInput = ref('')
const startDate = ref('') // yyyy-MM-dd
const endDate = ref('')   // yyyy-MM-dd
const turbo = ref(false)

// 运行状态
const loading = ref(false)
const fileLoading = ref(false)
const errorMessage = ref('')
const results = shallowRef([])
const returnedScrollId = ref('')

const fileImport = ref(null)

const parsedAuthorIds = computed(() => parseList(authorIdsInput.value))
const parsedAuthorNames = computed(() => parseList(authorNamesInput.value))
const parsedKeywords = computed(() => parseList(keywordsInput.value))
const parsedBlockedWords = computed(() => parseList(blockedWordsInput.value))

// 页面中的表格数据
const columns = computed(() => createKeywordsColumns(platform.value))
const pagination = {
  pageSize: 10
};

// 动态设置横向滚动宽度
const scrollX = ref(5000);

function triggerFileInput() {
  fileImport.value?.click()
}

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
        const names = jsonData.map(item => item.name).filter(Boolean)
        const ids = jsonData.map(item => item.id).filter(Boolean)
        // 将导入的数据添加到结果中
        if (names.length > 0) {
          authorNamesInput.value = names.join('\n')
        } else if (ids.length > 0) {
          authorIdsInput.value = ids.join('\n')
        }
        // 清空文件输入，允许重复导入同一个文件
        event.target.value = ''
      } catch (err) {
        errorMessage.value = '解析Excel文件失败：' + err.message
      } finally {
        fileLoading.value = false
      }
    }
    reader.onerror = () => {
      errorMessage.value = '导入用户ID/名称失败'
      fileLoading.value = false
    }
    reader.readAsArrayBuffer(file)
  } catch (err) {
    errorMessage.value = '导入用户ID/名称失败：' + err.message
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

function daysBetweenInclusive(start, end) {
  if (!start || !end) return 0
  const s = new Date(start + 'T00:00:00Z')
  const e = new Date(end + 'T23:59:59Z')
  const ms = e.getTime() - s.getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1
}

function validateParams(isNextPage = false) {
  // 翻页请求：只需要 scroll_id 与必要上下文参数
  if (!finalEndpointUrl.value) return '请填写对应平台的后端接口地址'
  if (!apiKey.value) return '请填写 api_key'

  if (isNextPage) {
    if (!returnedScrollId.value) return '缺少 scroll_id，无法继续翻页'
    return ''
  }

  if (inputMode.value !== 'none') {
    if (inputMode.value === 'ids') {
      if (parsedAuthorIds.value.length === 0) return '请至少填写一个用户ID'
      if (parsedAuthorNames.value.length > 0) return '不可同时传入用户名称与用户ID'
    } else {
      if (parsedAuthorNames.value.length === 0) return '请至少填写一个用户名称'
      if (parsedAuthorIds.value.length > 0) return '不可同时传入用户名称与用户ID'
    }
  }
  
  if (keywordsInput.value.length === 0) return '请填写关键词'

  if (!startDate.value) return '请填写开始日期'
  if (!endDate.value) return '请填写结束日期'
  if (startDate.value > endDate.value) return '开始日期不能大于结束日期'
  if (daysBetweenInclusive(startDate.value, endDate.value) > 100) return '时间范围最大为100天'

  const lim = Number(limit.value)
  if (!Number.isFinite(lim) || lim <= 0) return 'limit 必须为正整数'
  if (lim > 2000) return 'limit 不能超过 2000'
  return ''
}

function dateToTimestamp(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes, seconds] = [0, 0, 0]

  const utcTime = Date.UTC(year, month - 1, day, hours, minutes, seconds)

  const timeStamp = utcTime - 8 * 60 * 60 * 1000

  return timeStamp  
}

function buildBody(isNextPage = false) {
  const query = {}
  if (inputMode.value === 'ids') {
    query.author_ids = parsedAuthorIds.value
  } else {
    query.author_names = parsedAuthorNames.value
  }
  if (!isNextPage) {
    query.start_date = dateToTimestamp(startDate.value)
    query.end_date = dateToTimestamp(endDate.value)
    query.keywords = parsedKeywords.value
    query.blocked_words = parsedBlockedWords.value
    query.sentiment = Number(sentiment.value)
    query.post_type = postType.value
    query.is_ad = Number(isAd.value)
    query.sort = sort.value
    query.sort_order = sortOrder.value
    query.turbo = !!turbo.value
    query.limit = Number(limit.value) || 100
  }
  const sid = isNextPage ? returnedScrollId.value : ''
  if (sid) query.scroll_id = sid
  return {
    api_key: apiKey.value,
    query
  }
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

  const body = buildBody(false)
  await doRequest(body)
}

async function nextPage() {
  errorMessage.value = ''
  const err = validateParams(true)
  if (err) {
    errorMessage.value = err
    return
  }
  const body = buildBody(true)
  await doRequest(body)
}

async function doRequest(body) {
  loading.value = true
  try {
    const url = finalEndpointUrl.value
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '')
      throw new Error('请求失败：' + resp.status + ' ' + resp.statusText + (txt ? ('\n' + txt) : ''))
    }
    const data = await resp.json()
    // 约定后端返回：{ data: [...], scroll_id: '...', total?: number }
    const list = Array.isArray(data?.data?.data) ? data.data.data : []
    results.value = list.map(r => Object.freeze({...r}))
    returnedScrollId.value = data?.data?.scroll_id || ''
  } catch (e) {
    errorMessage.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

function resetAll() {
  results.value = []
  returnedScrollId.value = ''
}

function downloadExcel() {
  const headerMap = getKeywordsHeaderMap(platform.value)
  exportJsonToExcel(results.value, `${platform.value}_posts.xlsx`, 'Sheet1', undefined, headerMap)
}
</script>

<style scoped>
.panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  gap: 10px 12px;
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
.loading { margin-top: 8px; }
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

