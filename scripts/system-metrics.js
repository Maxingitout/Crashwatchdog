import osu from 'node-os-utils'

export function startMetrics(cb) {
  const cpu = osu.cpu
  const mem = osu.mem
  let last = { cpu: 0, mem: 0 }

  const timer = setInterval(async () => {
    try {
      const [cpuP, memInfo] = await Promise.all([cpu.usage(), mem.info()])
      last = {
        cpu: cpuP,
        mem: 100 - (memInfo.freeMemPercentage || 0),
        freeMemMB: memInfo.freeMemMb,
        totalMemMB: memInfo.totalMemMb
      }
      cb(last)
    } catch (e) {
      cb({ error: e.message || String(e) })
    }
  }, 1000)

  return timer
}
