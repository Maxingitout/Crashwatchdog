import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

// ✅ Full Steam game detection supporting multiple drives (C:, D:, etc.)
// Works even if libraryfolders.vdf is missing.

export async function detectSteamGames() {
  const roots = findSteamRoots()
  const libraries = new Set()

  // Always include <root>\steamapps if present
  for (const root of roots) {
    const sa = path.join(root, 'steamapps')
    if (fs.existsSync(sa)) libraries.add(sa)

    // Also parse libraryfolders.vdf if present under this root
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
        const acf = fs.readFileSync(path.join(lib, file), 'utf-8')
        const meta = parseAppManifest(acf)
        if (!meta) continue
        const common = path.join(lib, 'common')
        const gameDir = path.join(common, meta.installdir || '')
        let exePath = null
        if (process.platform === 'win32' && fs.existsSync(gameDir)) {
          const exes = fs.readdirSync(gameDir).filter(x => x.toLowerCase().endsWith('.exe'))
          if (exes[0]) exePath = path.join(gameDir, exes[0])
        }
        games.push({ name: meta.name || meta.installdir, installdir: meta.installdir, gameDir, exePath })
      } catch {}
    }
  }

  // Deduplicate by installdir/name
  const seen = new Set()
  return games.filter(g => {
    const k = (g.installdir || '') + '|' + (g.name || '')
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

// --- helpers ---

function findSteamRoots() {
  const roots = new Set()
  if (process.platform !== 'win32') return []

  // Registry SteamPath
  try {
    const ps = `Get-ItemProperty -Path 'HKCU:\\Software\\Valve\\Steam' -Name SteamPath | Select-Object -ExpandProperty SteamPath`
    const out = execSync(['powershell','-NoProfile','-Command', ps].join(' '), { encoding: 'utf-8' }).trim()
    if (out && fs.existsSync(out)) roots.add(out)
  } catch {}

  // Common defaults + typical library locations
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
    // Normalize \\ to \
    p = p.replace(/\\\\/g, '\\')
    paths.push(p)
  }
  return paths
}

function parseAppManifest(text) {
  // Minimal parser that pulls out "name" and "installdir"
  const nameMatch = /"name"\s*"([^"]*)"/i.exec(text)
  const dirMatch = /"installdir"\s*"([^"]*)"/i.exec(text)
  if (!nameMatch && !dirMatch) return null
  return { name: nameMatch ? nameMatch[1] : null, installdir: dirMatch ? dirMatch[1] : null }
}
