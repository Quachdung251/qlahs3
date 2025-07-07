const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '../public/vite.svg'),
    title: 'Hệ Thống Quản Lý Vụ Án',
    show: false
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Set up menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Thoát',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Tải lại' },
        { role: 'forceReload', label: 'Tải lại mạnh' },
        { role: 'toggleDevTools', label: 'Công cụ phát triển' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom mặc định' },
        { role: 'zoomIn', label: 'Phóng to' },
        { role: 'zoomOut', label: 'Thu nhỏ' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toàn màn hình' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize', label: 'Thu nhỏ' },
        { role: 'close', label: 'Đóng' }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: 'Về ứng dụng' },
        { type: 'separator' },
        { role: 'services', label: 'Dịch vụ' },
        { type: 'separator' },
        { role: 'hide', label: 'Ẩn' },
        { role: 'hideothers', label: 'Ẩn khác' },
        { role: 'unhide', label: 'Hiện tất cả' },
        { type: 'separator' },
        { role: 'quit', label: 'Thoát' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});