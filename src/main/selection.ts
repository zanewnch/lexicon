import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { clipboard } from 'electron'

const execFileAsync = promisify(execFile)
// Ctrl+Shift+Q invokes the global-shortcut callback while the physical Ctrl key can still
// be held. Waiting briefly avoids injecting Ctrl+C into the tail end of Ctrl+Shift+Q,
// which Windows applications such as VS Code can ignore.
const HOTKEY_RELEASE_DELAY_MS = 120
const COPY_TIMEOUT_MS = 1_000

const SEND_CTRL_C_SCRIPT = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class LexiconNativeInput {
    [StructLayout(LayoutKind.Sequential)]
    private struct INPUT {
        public uint type;
        public InputUnion union;
    }

    [StructLayout(LayoutKind.Explicit)]
    private struct InputUnion {
        [FieldOffset(0)] public KEYBDINPUT keyboard;
        [FieldOffset(0)] public MOUSEINPUT mouse;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct KEYBDINPUT {
        public ushort virtualKey;
        public ushort scanCode;
        public uint flags;
        public uint time;
        public IntPtr extraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MOUSEINPUT {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint flags;
        public uint time;
        public IntPtr extraInfo;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint count, INPUT[] inputs, int size);

    public static void SendCtrlC() {
        var inputs = new INPUT[] {
            CreateKey(0x11, 0),
            CreateKey(0x43, 0),
            CreateKey(0x43, 2),
            CreateKey(0x11, 2)
        };

        if (SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(INPUT))) != inputs.Length) {
            throw new InvalidOperationException("Windows SendInput failed");
        }
    }

    private static INPUT CreateKey(ushort virtualKey, uint flags) {
        return new INPUT {
            type = 1,
            union = new InputUnion {
                keyboard = new KEYBDINPUT {
                    virtualKey = virtualKey,
                    scanCode = 0,
                    flags = flags,
                    time = 0,
                    extraInfo = IntPtr.Zero
                }
            }
        };
    }
}
'@
[LexiconNativeInput]::SendCtrlC()
`

function encodePowerShellCommand(command: string): string {
  return Buffer.from(command, 'utf16le').toString('base64')
}

async function sendCtrlC(): Promise<void> {
  await execFileAsync(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-WindowStyle',
      'Hidden',
      '-EncodedCommand',
      encodePowerShellCommand(SEND_CTRL_C_SCRIPT)
    ],
    { windowsHide: true, timeout: 2_000, maxBuffer: 10_000 }
  )
}

async function copySelectionOnMac(): Promise<void> {
  // System Events needs Accessibility permission. Without it, osascript exits with an
  // error and the caller simply falls back to the manual-input popup.
  await execFileAsync(
    'osascript',
    ['-e', 'tell application "System Events" to keystroke "c" using command down'],
    { timeout: 2_000, maxBuffer: 10_000 }
  )
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function captureSelectedText(): Promise<string | null> {
  if (process.platform !== 'win32' && process.platform !== 'darwin') return null

  const originalClipboard = clipboard.readText()
  const sentinel = `__lexicon_selection_${Date.now()}_${Math.random().toString(36).slice(2)}__`

  try {
    clipboard.writeText(sentinel)
    await sleep(HOTKEY_RELEASE_DELAY_MS)
    if (process.platform === 'win32') await sendCtrlC()
    else await copySelectionOnMac()

    const deadline = Date.now() + COPY_TIMEOUT_MS
    let selectedText = ''
    while (Date.now() < deadline) {
      selectedText = clipboard.readText()
      if (selectedText !== sentinel) break
      await sleep(20)
    }

    const trimmed = selectedText.trim()
    return selectedText !== sentinel && trimmed.length > 0 ? trimmed : null
  } catch {
    return null
  } finally {
    clipboard.writeText(originalClipboard)
  }
}
