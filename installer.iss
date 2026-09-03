; ============================================================
; AI CRM Installer - Inno Setup Script
; Professional installer with modern UI
; ============================================================

#define MyAppName "AI CRM"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Prestige Solutions Pte Ltd"
#define MyAppURL "https://prestigesolutions.com.sg"
#define MyAppExeName "AI CRM.exe"
#define SourceDir "D:\AI-CRM\dist-electron\win-unpacked"
#define OutputDir "D:\AI-CRM\dist-electron"
#define IconFile "D:\AI-CRM\public\assets\icon.ico"

[Setup]
AppId={{B8A4C2E1-7F3D-4E9A-8B2C-1D5F6A7E9C3B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir={#OutputDir}
OutputBaseFilename=AI CRM Setup {#MyAppVersion}
SetupIconFile={#IconFile}
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
WizardSizePercent=120
DisableWelcomePage=no
DisableDirPage=no
DisableProgramGroupPage=no
ShowLanguageDialog=yes
InternalCompressLevel=ultra64
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription=AI CRM Desktop Application
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#SourceDir}\locales\*"; DestDir: "{app}\locales"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#SourceDir}\resources\*"; DestDir: "{app}\resources"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
// ============================================================
// Custom branded installer UI
// ============================================================

var
  ProgressPage: TOutputProgressWizardPage;
  CurrentAction: string;

procedure InitializeWizard();
begin
  // Modern wizard styling
  WizardForm.Color := clWhite;
  
  // Customize welcome page
  WizardForm.WelcomeLabel1.Caption := '{#MyAppName}';
  WizardForm.WelcomeLabel1.Font.Color := $032D60;
  WizardForm.WelcomeLabel1.Font.Size := 22;
  WizardForm.WelcomeLabel1.Font.Style := [fsBold];
  
  WizardForm.WelcomeLabel2.Caption := 'Professional CRM Solution for Modern Business' + #13#10#13#10 +
    'Version {#MyAppVersion}' + #13#10 +
    '{#MyAppPublisher}' + #13#10#13#10 +
    'This wizard will guide you through the installation process.' + #13#10 +
    'Click Next to continue.';
  WizardForm.WelcomeLabel2.Font.Color := $444444;
  WizardForm.WelcomeLabel2.Font.Size := 10;
  
  // Customize ready page
  WizardForm.ReadyMemo.Font.Color := $444444;
  
  // Create progress page
  ProgressPage := CreateOutputProgressPage('Installing {#MyAppName}', 'Please wait while Setup installs {#MyAppName} on your computer.');
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = wpWelcome then
    WizardForm.Caption := '{#MyAppName} v{#MyAppVersion} — Setup'
  else if CurPageID = wpFinished then
    WizardForm.Caption := '{#MyAppName} v{#MyAppVersion} — Completed'
  else if CurPageID = wpInstalling then
    WizardForm.Caption := '{#MyAppName} v{#MyAppVersion} — Installing...';
end;

procedure CurInstallProgressChanged(CurProgress, MaxProgress: Integer);
var
  Pct: Integer;
begin
  if MaxProgress > 0 then
    Pct := (CurProgress * 100) div MaxProgress
  else
    Pct := 0;
  ProgressPage.SetProgress(Pct, 100);
  case Pct of
    0..10:   CurrentAction := 'Preparing installation...';
    11..25:  CurrentAction := 'Extracting application files...';
    26..45:  CurrentAction := 'Installing core components...';
    46..65:  CurrentAction := 'Setting up database engine...';
    66..80:  CurrentAction := 'Configuring application...';
    81..95:  CurrentAction := 'Creating shortcuts...';
    96..100: CurrentAction := 'Finalizing installation...';
  end;
  ProgressPage.SetText(CurrentAction, '');
  Sleep(15);
end;
