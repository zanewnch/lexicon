export type TranslationRequestMode = 'translation' | 'lookup'

export type LookupResult = {
  term: string
  ipa: string
  meaning: string
  example: string
  exampleTranslation: string
}

export function isEnglishLookupQuery(text: string): boolean {
  const input = text.trim()
  if (!input || /[.!?…。！？]\s*$/.test(input)) return false
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '\u2019-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(input)) return false

  return input.split(/\s+/).length <= 4
}
