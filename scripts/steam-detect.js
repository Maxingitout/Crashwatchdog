import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

export async function detectSteamGames() {
  const roots = findSteamRoots()
  const libraries = new Set()

  // Always include <root>\steamapps if present
  for (const root of roots) {
    const sa = path.join(root, 'steamapps')
    if (fs.existsSync(sa)) libraries.add(sa)

    const vdfPath = path.join(sa, 'libraryfolders.vdf')
    if (fs.existsSync(vdfPath)) {
      try {
        const text = fs.readFileSync(vdfPath, 'utf-8')
        for (const lib of parseLibraryFolders(text)) {
          const sa2 = path.join(lib, 'steamapps')
          if (fs.existsSync(sa2)) libraries.add(sa2)
        }
      } catch {}
    }
  }

  const games = []

  for (const lib of libraries) {
    let manifests = []
    try {
      manifests = fs.readdirSync(lib).filter(f => /^appmanifest_\d+\.acf$/i.test(f))
    } catch {}

    for (const file of manifests) {
      try {
        const appIdMatch = /^appmanifest_(\d+)\.acf$/i.exec(file)
        const appId = appIdMatch ? appIdMatch[1] : null

        const acf = fs.readFileSync(path.join(lib, file), 'utf-8')
        const meta = parseAppManifest(acf)
        if (!meta) continue

        const common = path.join(lib, 'common')
        const gameDir = path.join(common, meta.installdir || '')

        // Basic exe detection (top-level only). Good enough for now.
        let exePath = null
        if (process.platform === 'win32' && fs.existsSync(gameDir)) {
          const exes = fs.readdirSync(gameDir).filter(x => x.toLowerCase().endsWith('.exe'))
          if (exes[0]) exePath = path.join(gameDir, exes[0])
        }

        games.push({
          appId,
          name: meta.name || meta.installdir,
          installdir: meta.installdir,
          gameDir,
          executable: exePath
        })
      } catch {}
    }
  }

  // de-dupe
  const seen = new Set()
  return games.filter(g => {
    const k = (g.appId || '') + '|' + (g.installdir || '') + '|' + (g.name || '')
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function findSteamRoots() {
  const roots = new Set()
  if (process.platform !== 'win32') return []

  // Try registry first (Windows-safe call)
  try {
    const ps = `Get-ItemProperty -Path 'HKCU:\\Software\\Valve\\Steam' -Name SteamPath | Select-Object -ExpandProperty SteamPath`
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', ps],
      { encoding: 'utf-8', windowsHide: true }
    ).trim()

    if (out && fs.existsSync(out)) roots.add(out)
  } catch {}

  // Fallback common paths
  const candidates = [
    'C:\\Program Files (x86)\\Steam',
    'C:\\Program Files\\Steam',
    'D:\\Steam', 'D:\\SteamLibrary',
    'E:\\Steam', 'E:\\SteamLibrary',
    'F:\\Steam', 'F:\\SteamLibrary'
  ]
  for (const c of candidates) {
    try { if (fs.existsSync(c)) roots.add(c) } catch {}
  }

  return [...roots]
}

function parseLibraryFolders(text) {
  // Find all "path" "X:\SteamLibrary" entries
  const paths = []
  const re = /"path"\s*"([^"]+)"/gi
  let m
  while ((m = re.exec(text)) !== null) {
    let p = m[1]
    p = p.replace(/\\\\/g, '\\')
    paths.push(p)
  }
  return paths
}

function parseAppManifest(text) {
  const nameMatch = /"name"\s*"([^"]*)"/i.exec(text)
  const dirMatch = /"installdir"\s*"([^"]*)"/i.exec(text)
  if (!nameMatch && !dirMatch) return null
  return {
    name: nameMatch ? nameMatch[1] : null,
    installdir: dirMatch ? dirMatch[1] : null
  }
}
