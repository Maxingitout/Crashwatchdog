module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'build/icon'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-addons/electron-forge-maker-nsis',
      config: {
        appId: 'com.crashwatchdog.app',
        productName: 'CrashWatchdog',
        artifactName: 'CrashWatchdog-Setup-${version}',

        // Force oneClick off at top-level too (wrapper quirk)
        oneClick: false,
        perMachine: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: 'CrashWatchdog',

        // Also keep it under nsis for completeness
        nsis: {
          oneClick: false,
          perMachine: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          shortcutName: 'CrashWatchdog'
        }
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32']
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          { entry: 'src/main.js', config: 'vite.main.config.mjs' },
          { entry: 'src/preload.js', config: 'vite.preload.config.mjs' }
        ],
        renderer: [
          { name: 'main_window', config: 'vite.renderer.config.mjs' }
        ]
      }
    }
  ]
};
