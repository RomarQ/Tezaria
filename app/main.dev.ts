/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import { app, ipcMain, BrowserWindow} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import path from 'path';

import settings from './constants/info';

export default class AppUpdater {
    constructor() {
        console.log('INIT ' + new Date);
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        autoUpdater.checkForUpdatesAndNotify();
    }
}

let mainWindow:BrowserWindow  = null;

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
) {
    require('electron-debug')();
}

const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

    return Promise.all(
        extensions.map(name => installer.default(installer[name], forceDownload))
    ).catch(console.log);
};

/**
 * Add event listeners...
 */

// + Custom loader events

ipcMain.on('start-loader', (event:any, arg:any) => {
    console.log(event, arg);

    event.sender.send('start-loader', 'start');
});

ipcMain.on('stop-loader', (event:any, arg:any) => {
    console.log(arg)
    event.sender.send('start-loader', 'stop')
});

// - Custom loader events

app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('ready', async () => {
    if (process.env.NODE_ENV === 'development' ||
        process.env.DEBUG_PROD === 'true'
    ) {
        await installExtensions();
    }

    mainWindow = new BrowserWindow({
        show: false,
        center: true,
        height: 800,
        width: 1280,
        title: `${settings.name} - ${settings.version}`,
        icon : path.join(__dirname, '..', 'resources/assets/icon.png')
    });
        
    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadURL(`file://${__dirname}/app.html`);
    console.log(__dirname, path.join(__dirname, '..', 'resources/assets/icon.png'))
    mainWindow.webContents.openDevTools();

    // @TODO: Use 'ready-to-show' event
    //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('LOADED ' + new Date)
        if (!mainWindow) {
        throw new Error('"mainWindow" is not defined');
        }
        //mainWindow.setSize(1024,1024);
        //mainWindow.center();

        if (process.env.START_MINIMIZED) {
        mainWindow.minimize();
        } else {
        mainWindow.show();
        mainWindow.focus();
        }
    });

    // SSL/TSL: this is the self signed certificate support
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        event.preventDefault();
        // On certificate error stop Default behaviour, self verify it and callback true if everything is right 

        // Verify certificate [ This is all because self signed certificates that chromium doesn't accept anymore ]
        // @TODO 
        console.log(error);

        // Return true after everything was verified and proved to be correct.
        callback(true);
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    new AppUpdater();
});
