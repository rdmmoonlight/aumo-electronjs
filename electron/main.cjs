async function startElectron() {
  const { app, BrowserWindow, shell } = await import('electron');
  const { default: path } = await import('node:path');

  const isDev = !app.isPackaged;
  const PROD_URL = 'https://aumo.onrender.com';

  function createWindow() {
    const mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      autoHideMenuBar: true, // Sembunyikan menu bar File/Edit/View bawaan agar lebih bersih
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Buka link eksternal (target="_blank") di browser default OS, bukan jendela baru Electron
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (!url.startsWith(PROD_URL) && !url.startsWith('http://localhost:5173')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
      return { action: 'allow' };
    });

    if (isDev) {
      mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadURL(PROD_URL);
    }

    // Tangani jika gagal memuat URL (misalnya saat offline atau server Render sedang bangun)
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      // Abaikan error pembatalan navigasi internal (-3)
      if (errorCode === -3) return;

      const offlineHtml = `
        <html>
          <body style="font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #334155;">
            <h2>Gagal Terhubung ke Server</h2>
            <p style="color: #64748b; max-width: 400px; text-align: center;">
              Pastikan koneksi internet Anda aktif atau server sedang dalam proses bangun (cold start).
            </p>
            <p style="font-size: 12px; color: #94a3b8;">Error: ${errorDescription} (${errorCode})</p>
            <button onclick="window.location.href='${validatedURL}'" style="margin-top: 16px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
              Coba Lagi
            </button>
          </body>
        </html>
      `;
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(offlineHtml)}`);
    });
  }

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

startElectron();
