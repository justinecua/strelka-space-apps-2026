// Opens the built Strelka website (the dist folder) in a desktop window, so it can ship as a .exe or .app.
// Links to other websites open in the normal browser instead of inside the app.
// The pages are served from app://strelka/ rather than file://, because the speech engine downloads its
// voice model with fetch(), which browsers don't allow for file:// addresses.
const { app, BrowserWindow, net, protocol, shell } = require('electron')
const path = require('path')
const { pathToFileURL } = require('url')

const DIST = path.join(__dirname, '..', 'dist')
const HOME = 'app://strelka/index.html'

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
])

// app://strelka/models/x.tar.gz → dist/models/x.tar.gz. Nothing outside dist can be reached.
function serveDist() {
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url)
    const file = path.normalize(path.join(DIST, decodeURIComponent(pathname)))
    if (!file.startsWith(DIST)) return new Response('Not found', { status: 404 })
    return net.fetch(pathToFileURL(file).href)
  })
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,
    minHeight: 600,
    title: 'Strelka',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  window.loadURL(HOME)

  // Links with target="_blank" (the NASA sources) open in the user's browser.
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Any other attempt to leave the app also goes to the browser.
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
}

app.whenReady().then(() => {
  serveDist()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
