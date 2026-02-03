module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'build/icon' // build/icon.ico must include 256x256
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-addons/electron-forge-maker-nsis',
      config: {
        // This hook lets us pass raw electron-builder config through
        getAdditionalConfig: () => {
          return {
            appId: 'com.crashwatchdog.app',
            productName: 'CrashWatchDog',

            win: {
              target: [{ target: 'nsis', arch: ['x64'] }],
              icon: 'build/icon.ico',
              // per-machine installs usually require elevation
              requestedExecutionLevel: 'requireAdministrator'
            },

            nsis: {
              oneClick: false,
              perMachine: true,
              allowToChangeInstallationDirectory: true,
              createDesktopShortcut: true,
              createStartMenuShortcut: true,
              shortcutName: 'CrashWatchDog'
            }
          };
        }
      }
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
        renderer: [{ name: 'main_window', config: 'vite.renderer.config.mjs' }]
      }
    }
  ]
};
