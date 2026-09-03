Set s = WScript.CreateObject("WScript.Shell")
Set l = s.CreateShortcut(s.SpecialFolders("Desktop") & "\AI CRM.lnk")
l.TargetPath = "D:\AI-CRM\node_modules\electron\dist\electron.exe"
l.Arguments = "D:\AI-CRM"
l.WorkingDirectory = "D:\AI-CRM"
l.Description = "AI CRM - Intelligent Customer Management"
l.WindowStyle = 1
l.Save
WScript.Echo "Shortcut created: Desktop\AI CRM.lnk"
