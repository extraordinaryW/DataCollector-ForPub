import { app, BrowserWindow, nativeTheme } from 'electron'
import path from 'node:path'

// 统一颜色配置为 sRGB，避免不同环境下颜色偏差
app.commandLine.appendSwitch('force-color-profile', 'srgb')
// 强制浅色主题，避免受系统暗色偏好影响
nativeTheme.themeSource = 'light'

function createWindow() {
    const win = new BrowserWindow({
        width: 2000,
        height:1400,
        useContentSize: true,
        backgroundColor: '#ffffff',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            zoomFactor: 1.0,
        },
    })

    // 初始缩放设为 1，允许用户根据需要调整（不再锁死）
    win.webContents.setZoomFactor(1)
    if (process.env.NODE_ENV === 'development') {
    // 开发模式加载 Vite 服务
        win.loadURL('http://localhost:5173')
    } else {
    // 生产模式加载打包好的 index.html
        win.loadFile(path.join(__dirname, '../dist/index.html'))
    }
}


app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})