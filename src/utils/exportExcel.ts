import * as XLSX from 'xlsx'

const EXCEL_CELL_MAX_LENGTH = 32767

function toCellString(v: any) {
  if (v == null) return v
  const s =
    typeof v === 'string'
      ? v
      : typeof v === 'object'
      ? JSON.stringify(v)
      : String(v)
  if (s.length > EXCEL_CELL_MAX_LENGTH) {
    // 预留 3 个字符给省略号
    return s.slice(0, EXCEL_CELL_MAX_LENGTH - 3) + '...'
  }
  return s
}

export function exportJsonToExcel<T extends Record<string, any>>(
    data: T[],
    fileName = 'data.xlsx',
    sheetName = 'Sheet1',
    headerOrder?: (keyof T)[],
    headerMap?: Record<string, string>,
) {
    const rows = headerOrder
        ? data.map(row => {
            const o: any = {}
            headerOrder.forEach(k => { o[String(k)] = row[k] })
            return o
        })
        : data
    
    const normalized = rows.map(r => {
        const n: any = {}
        for (const k in r) {
            const v = r[k]
            n[k] = toCellString(v)
        }
        return n
    })

    const ws = XLSX.utils.json_to_sheet(normalized)
    
    // 如果提供了字段名映射，则替换表头
    if (headerMap && ws['!ref']) {
        const range = XLSX.utils.decode_range(ws['!ref'])
        // 遍历第一行的所有列
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
            const cell = ws[cellAddress]
            if (cell && cell.v && headerMap[cell.v]) {
                cell.v = headerMap[cell.v]
            }
        }
    }
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    XLSX.writeFile(wb, fileName)
}