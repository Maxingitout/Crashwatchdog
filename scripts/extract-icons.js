import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'

// Simple Windows-only icon extract using PowerShell and shell COM.
// Falls back to copying the .exe if ICO fails.

export function extractIcon(exePath, outIcoPath) {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') return resolve(false)
    const ps = [
      '$source = "' + exePath.replace(/"/g,'`"') + '"',
      '$dest = "' + outIcoPath.replace(/"/g,'`"') + '"',
      '$icon = [System.Drawing.Icon]::ExtractAssociatedIcon($source)',
      'if ($icon -ne $null) {',
      '  $fs = New-Object System.IO.FileStream($dest, [System.IO.FileMode]::Create)',
      '  $icon.Save($fs)',
      '  $fs.Close()',
      '  Write-Output "OK"',
      '} else { Write-Output "NOICON" }'
    ].join('; ')
    const child = execFile('powershell.exe', ['-NoProfile','-Command', ps], { windowsHide: true }, (err, stdout) => {
      if (!err && (stdout||'').includes('OK')) return resolve(true)
      try { fs.copyFileSync(exePath, outIcoPath) } catch {}
      resolve(false)
    })
  })
}
