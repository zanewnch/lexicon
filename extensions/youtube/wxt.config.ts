import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'Lexicon YouTube', version: '0.1.0', key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2/TXhvyW6r7SyV81nprFBpT22QwVgvBCxVgSejaJaYnWfBndc1CSJ/hnyRr7jqFLG4lWgepgRRI66s4Zqzojiw56Hr46qCa9ly4hPNE1fXiffHhBaOPO3hKHwGZv14VJJHdT4bj3SHLuVM4KR6yYRTn60aLFqXjbjh0c0guNKnQRk4y34UY/S7bXvXONsEKpYlpt2pdnc43XSJEazK7raFE4jGM2VyqBtxULwfrMq3cMDXAFCcnx2OT34ESQy18eGor9IUUwB1H0xxvj0Liv33onQ+a1pbCrpVyKSGu/UagijNT8ZSYt95BwYP6F+mo7TpUdxQg73TorIa02WiTBeQIDAQAB',
    permissions: ['nativeMessaging', 'tabs'], host_permissions: ['https://www.youtube.com/*'],
    web_accessible_resources: [{ resources: ['youtube-main-world.js'], matches: ['https://www.youtube.com/*'] }]
  }
})
