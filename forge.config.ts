import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerZIP } from '@electron-forge/maker-zip';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Ratio Proxy',
    appBundleId: 'global.ratio.proxy',
    icon: 'assets/icon',
    asar: true,
    download: {
      // Skip re-fetching SHASUMS256.txt from GitHub every build — the
      // Electron binary is already verified at npm-install time, and the
      // extra fetch fails in restricted network environments.
      unsafelyDisableChecksums: true,
      // GitHub release-assets endpoints are unreliable from some networks;
      // npmmirror serves identical Electron binaries and is well-routed.
      mirrorOptions: {
        mirror: 'https://cdn.npmmirror.com/binaries/electron/',
      },
    },
    // Enable signing + notarization by setting APPLE_ID / APPLE_PASSWORD / APPLE_TEAM_ID
    // in the environment (requires Apple Developer membership), then uncomment:
    // osxSign: {},
    // osxNotarize: {
    //   appleId: process.env.APPLE_ID!,
    //   appleIdPassword: process.env.APPLE_PASSWORD!,
    //   teamId: process.env.APPLE_TEAM_ID!,
    // },
  },
  rebuildConfig: {},
  makers: [
    new MakerDMG({
      name: 'Ratio Proxy',
      icon: 'assets/icon.icns',
      format: 'ULFO',
    }),
    new MakerZIP({}, ['darwin']),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
