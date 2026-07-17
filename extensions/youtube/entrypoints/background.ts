export default defineBackground(() => {
  let hostPort: chrome.runtime.Port | undefined
  function connectHost(): chrome.runtime.Port | undefined { if (hostPort) return hostPort; try { hostPort = chrome.runtime.connectNative('com.lexicon.youtube'); hostPort.onMessage.addListener((message) => chrome.tabs.query({ url: 'https://www.youtube.com/*' }, (tabs) => tabs.forEach((tab) => { if (tab.id) void chrome.tabs.sendMessage(tab.id, message).catch(() => undefined) }))); hostPort.onDisconnect.addListener(() => { hostPort = undefined }) } catch { hostPort = undefined }; return hostPort }
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => { const port = connectHost(); if (!port) { sendResponse({ ok: false, message: '找不到 Lexicon。請先啟動或重新安裝 Lexicon。' }); return }; try { port.postMessage(message); sendResponse({ ok: true }) } catch { hostPort = undefined; sendResponse({ ok: false, message: '無法連線到 Lexicon。' }) } })
})
