import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export async function extractIcon(exePath, outPngPath) {
  try {
    if (process.platform !== 'win32') return false;
    if (!exePath || !fs.existsSync(exePath)) return false;

    const outDir = path.dirname(outPngPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // PowerShell: extract associated icon and save as PNG
    // Notes:
    // - System.Drawing works on Windows PowerShell
    // - We pick the first icon. It's good enough.
    const ps = `
Add-Type -AssemblyName System.Drawing
$exe = '${exePath.replace(/'/g, "''")}'
$out = '${outPngPath.replace(/'/g, "''")}'
$icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exe)
if ($null -eq $icon) { exit 2 }
$bmp = $icon.ToBitmap()
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
exit 0
`.trim();

    execFileSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps],
      { stdio: 'ignore', windowsHide: true }
    );

    return fs.existsSync(outPngPath);
  } catch {
    return false;
  }
}
