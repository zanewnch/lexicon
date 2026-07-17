import { access, chmod, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app } from 'electron'

const HOST_NAME = 'com.lexicon.youtube'
const EXTENSION_ID = 'beihelddlfklfpemplilnfhcffcjgdkp'

/** Registers the packaged macOS native-messaging host for Chrome. */
export async function registerMacYouTubeNativeHost(): Promise<void> {
  if (process.platform !== 'darwin') return

  const architecture = process.arch === 'arm64' ? 'osx-arm64' : 'osx-x64'
  const hostPath = app.isPackaged
    ? join(process.resourcesPath, 'native-host', architecture, 'LexiconNativeHost')
    : join(process.cwd(), 'native-host', 'publish', architecture, 'LexiconNativeHost')

  await access(hostPath)
  await chmod(hostPath, 0o755)

  const manifestDirectory = join(
    app.getPath('home'),
    'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts'
  )
  await mkdir(manifestDirectory, { recursive: true })
  await writeFile(join(manifestDirectory, `${HOST_NAME}.json`), `${JSON.stringify({
    name: HOST_NAME,
    description: 'Lexicon YouTube translation bridge',
    path: hostPath,
    type: 'stdio',
    allowed_origins: [`chrome-extension://${EXTENSION_ID}/`]
  }, null, 2)}\n`, 'utf8')
}
