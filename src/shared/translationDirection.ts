export type TranslationDirection = 'zh-to-en' | 'en-to-zh'

export function detectTranslationDirection(text: string): TranslationDirection {
  return /\p{Script=Han}/u.test(text) ? 'zh-to-en' : 'en-to-zh'
}

export function getDirectionLabels(direction: TranslationDirection): {
  title: string
  sourceLanguage: string
  targetLanguage: string
  placeholder: string
} {
  return direction === 'zh-to-en'
    ? {
        title: '中翻英',
        sourceLanguage: '繁體中文',
        targetLanguage: 'English',
        placeholder: '輸入繁體中文…'
      }
    : {
        title: '英翻中',
        sourceLanguage: '英文',
        targetLanguage: '繁體中文',
        placeholder: '輸入英文…'
      }
}
