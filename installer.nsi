; NSIS Installation Script for Prestige CRM
; Version 2.0.0
; Publisher: Prestige Solutions Pte Ltd

!include "MUI2.nsh"
!include "LogicLib.nsh"

; ── General ──────────────────────────────────────────────
Name "Prestige CRM"
OutFile "PrestigeCRM_Setup_2.0.0.exe"
InstallDir "$PROGRAMFILES\Prestige CRM"
RequestExecutionLevel admin
BrandingText "© 2026 Prestige Solutions Pte Ltd"

; ── Installer Size Optimization ──────────────────────────
SetCompressor /SOLID lzma

; ── Modern UI ────────────────────────────────────────────
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_RIGHT
!define MUI_HEADERBITMAP "installer-header.bmp"
!define MUI_ICON "public\assets\icon.ico"
!define MUI_UNICON "public\assets\icon.ico"

; ── Welcome Page ─────────────────────────────────────────
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE"

; ── Directory Selection ──────────────────────────────────
!insertmacro MUI_PAGE_DIRECTORY

; ── Installation Progress ────────────────────────────────
!insertmacro MUI_PAGE_INSTFILES

; ── Finish Page ──────────────────────────────────────────
!define MUI_FINISHPAGE_RUN "$INSTDIR\Prestige CRM.exe"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README.txt"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Launch Prestige CRM"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION OnFinishLaunch

!insertmacro MUI_PAGE_FINISH

; ── Uninstallation ───────────────────────────────────────
!insertmacro MUI_UNPAGE_INSTFILES

; ── Language ─────────────────────────────────────────────
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "SimpChinese"

; ── Installer Strings (English) ──────────────────────────
LangString DESC_SecMain ${LANG_ENGLISH} "Main application files"
LangString DESC_SecDesktop ${LANG_ENGLISH} "Desktop shortcut"
LangString DESC_SecStartMenu ${LANG_ENGLISH} "Start menu shortcut"

; ── Installer Strings (Chinese) ──────────────────────────
LangString DESC_SecMain ${LANG_SIMPCHINESE} "主应用程序文件"
LangString DESC_SecDesktop ${LANG_SIMPCHINESE} "桌面快捷方式"
LangString DESC_SecStartMenu ${LANG_SIMPCHINESE} "开始菜单快捷方式"

; ── Sections ─────────────────────────────────────────────
Section "Main Application" SecMain
  SetOutPath "$INSTDIR"
  
  ; Core executable
  File "Prestige CRM.exe"
  
  ; Server and backend files
  File /r "server.js"
  File /r "server"
  File /r "routes"
  File /r "database"
  File /r "services"
  
  ; Frontend build
  File /r "dist"
  File /r "public"
  
  ; Electron files
  File "electron-main.js"
  File "electron-preload.js"
  
  ; Configuration
  File "package.json"
  File "webpack.config.js"
  
  ; Documentation
  File "README.md"
  File "LICENSE"
  
  ; Node modules (critical dependencies)
  SetOutPath "$INSTDIR\node_modules"
  File /r "node_modules\@ant-design"
  File /r "node_modules\antd"
  File /r "node_modules\axios"
  File /r "node_modules\better-sqlite3"
  File /r "node_modules\chart.js"
  File /r "node_modules\cors"
  File /r "node_modules\dayjs"
  File /r "node_modules\electron"
  File /r "node_modules\electron-builder"
  File /r "node_modules\express"
  File /r "node_modules\react"
  File /r "node_modules\react-dom"
  File /r "node_modules\react-router-dom"
  File /r "node_modules\zustand"
  File /r "node_modules\bcrypt"
  File /r "node_modules\jsonwebtoken"
  File /r "node_modules\multer"
  File /r "node_modules\winston"
  File /r "node_modules\yup"
  File /r "node_modules\joi"
  File /r "node_modules\scheduler"
  File /r "node_modules\react-is"
  File /r "node_modules\@dnd-kit"
  File /r "node_modules\@hookform"
  File /r "node_modules\@salesforce-ux"
  File /r "node_modules\babel-loader"
  File /r "node_modules\copy-webpack-plugin"
  File /r "node_modules\css-loader"
  File /r "node_modules\html-webpack-plugin"
  File /r "node_modules\style-loader"
  File /r "node_modules\webpack"
  File /r "node_modules\webpack-cli"
  File /r "node_modules\webpack-dev-server"
  File /r "node_modules\@babel"
  File /r "node_modules\@testing-library"
  File /r "node_modules\jest"
  File /r "node_modules\jest-environment-jsdom"
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Desktop Shortcut" SecDesktop
  CreateShortCut "$DESKTOP\Prestige CRM.lnk" "$INSTDIR\Prestige CRM.exe"
SectionEnd

Section "Start Menu Shortcut" SecStartMenu
  CreateShortCut "$SMPROGRAMS\Prestige CRM.lnk" "$INSTDIR\Prestige CRM.exe"
SectionEnd

; ── Functions ────────────────────────────────────────────
Function .onInit
  ; Check if already installed
  ReadRegStr $R0 HKLM "SOFTWARE\Prestige CRM" "InstallDir"
  IfErrors +2 0
  MessageBox MB_YESNO "Prestige CRM is already installed. Do you want to reinstall?" IDNO Cancel
  Cancel:
    Quit
FunctionEnd

Function OnFinishLaunch
  Exec '"$INSTDIR\Prestige CRM.exe"'
FunctionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "Prestige CRM has been successfully uninstalled." /SD IDOK
FunctionEnd

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO "Are you sure you want to completely remove Prestige CRM?" /SD IDYES IDYES +2
    Abort
FunctionEnd

Section "Uninstall"
  ; Remove shortcuts
  Delete "$DESKTOP\Prestige CRM.lnk"
  Delete "$SMPROGRAMS\Prestige CRM.lnk"
  
  ; Remove installation directory
  RMDir /r "$INSTDIR"
  
  ; Remove registry entry
  DeleteRegKey HKLM "SOFTWARE\Prestige CRM"
  
  ; Clean up environment variables if needed
  Delete "$INSTDIR\Uninstall.exe"
SectionEnd
