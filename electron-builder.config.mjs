const isMacHost = process.platform === 'darwin'

export default {
  appId: 'com.lexicon.app',
  productName: 'Lexicon',
  directories: { output: 'dist' },
  files: ['out/**/*', 'package.json'],
  asarUnpack: ['node_modules/node-llama-cpp/**'],
  extraResources: isMacHost
    ? [
        { from: 'native-host/publish/osx-arm64/LexiconNativeHost', to: 'native-host/osx-arm64/LexiconNativeHost' },
        { from: 'native-host/publish/osx-x64/LexiconNativeHost', to: 'native-host/osx-x64/LexiconNativeHost' }
      ]
    : [
        { from: 'build/com.lexicon.youtube.json', to: 'com.lexicon.youtube.json' },
        { from: 'native-host/publish/win-x64/LexiconNativeHost.exe', to: 'LexiconNativeHost.exe' }
      ],
  win: { target: 'nsis' },
  nsis: {
    oneClick: true,
    perMachine: false,
    include: 'build/installer.nsh'
  },
  mac: {
    target: ['dmg', 'zip'],
    category: 'public.app-category.productivity'
  }
}
