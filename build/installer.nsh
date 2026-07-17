!macro customInstall
  WriteRegStr HKCU "Software\Google\Chrome\NativeMessagingHosts\com.lexicon.youtube" "" "$INSTDIR\resources\com.lexicon.youtube.json"
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Google\Chrome\NativeMessagingHosts\com.lexicon.youtube"
!macroend
