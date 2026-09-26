// Rebuild the local illustration video; NODE_PATH may point to a Playwright installation.
const { chromium } = require('playwright')
const qr = require('qr.js')
const fs = require('node:fs/promises')
const path = require('node:path')

async function main() {
  const output = path.resolve(__dirname, '../public/media')
  await fs.mkdir(output, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    const matrix = qr('EVENTFLOW-DEMO-NOT-A-VALID-TICKET').modules
    for (const mobile of [false, true]) {
      const result = await page.evaluate(async ({ matrix }) => {
        const canvas = document.createElement('canvas')
        canvas.width = 390; canvas.height = 430
        document.body.replaceChildren(canvas)
        const c = canvas.getContext('2d')
        const width = canvas.width, height = canvas.height
        const x = 40, y = 15
        const w = 310, h = 400
        function box(x, y, w, h, radius, fill) {
          c.fillStyle = fill; c.beginPath(); c.roundRect(x, y, w, h, radius); c.fill()
        }
        function text(value, x, y, size, color, bold = false) {
          c.fillStyle = color; c.font = `${bold ? 700 : 400} ${size}px Arial`; c.fillText(value, x, y)
        }
        function draw(time) {
          c.fillStyle = '#111715'; c.fillRect(0, 0, width, height)
          // Fixed guide lines ground the ticket in a scanner scene.
          c.strokeStyle = '#24302b'; c.lineWidth = 1
          for (let line = 0; line < width; line += 80) {
            c.beginPath(); c.moveTo(line, 0); c.lineTo(line, height); c.stroke()
          }
          box(x + 12, y + 14, w, h, 14, '#080d0b')
          box(x, y, w, h, 12, '#fbfcfa')
          box(x, y, w, 8, 0, '#f88f52')
          text('EventFlow', x + 24, y + 44, 23, '#202924', true)
          text('BILLET', x + 24, y + 70, 11, '#647069')
          const size = matrix.length, scale = 6, qrSize = size * scale
          const qx = x + (w - qrSize) / 2, qy = y + 112
          c.fillStyle = '#19261f'
          matrix.forEach((row, iy) => row.forEach((cell, ix) => { if (cell) c.fillRect(qx + ix * scale, qy + iy * scale, scale, scale) }))
          c.setLineDash([5, 5]); c.strokeStyle = '#cbd2ce'; c.beginPath(); c.moveTo(x + 12, y + 324); c.lineTo(x + w - 12, y + 324); c.stroke(); c.setLineDash([])
          const success = time >= 3.4
          text(success ? 'ACCÈS AUTORISÉ' : 'PRÉSENTE TON BILLET', x + 27, y + 362, 19, success ? '#10704a' : '#26392e', true)
          text(success ? 'Bonne soirée !' : 'Un scan, et la soirée commence.', x + 27, y + 383, 12, '#637469')
          c.strokeStyle = success ? '#71e2a7' : '#f88f52'; c.lineWidth = 4
          const frame = { x: x - 22, y: y + 88, w: w + 44, h: 230 }
          for (const [fx, fy, sx, sy] of [[frame.x, frame.y, 1, 1], [frame.x + frame.w, frame.y, -1, 1], [frame.x, frame.y + frame.h, 1, -1], [frame.x + frame.w, frame.y + frame.h, -1, -1]]) {
            c.beginPath(); c.moveTo(fx + 28 * sx, fy); c.lineTo(fx, fy); c.lineTo(fx, fy + 28 * sy); c.stroke()
          }
          if (!success) {
            const scanY = frame.y + 12 + (time / 3.4) * (frame.h - 24)
            c.strokeStyle = '#f88f52'; c.lineWidth = 3; c.beginPath(); c.moveTo(frame.x + 4, scanY); c.lineTo(frame.x + frame.w - 4, scanY); c.stroke()
          } else {
            box(x + w - 48, y - 26, 74, 74, 37, '#77e5ae')
            c.strokeStyle = '#14362a'; c.lineWidth = 5; c.beginPath(); c.moveTo(x + w - 29, y + 9); c.lineTo(x + w - 15, y + 22); c.lineTo(x + w + 7, y - 2); c.stroke()
          }
        }
        draw(4)
        const poster = canvas.toDataURL('image/png').split(',')[1]
        const chunks = []
        const recorder = new MediaRecorder(canvas.captureStream(24), { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 850000 })
        recorder.ondataavailable = event => chunks.push(event.data)
        const finished = new Promise(resolve => { recorder.onstop = resolve })
        recorder.start()
        const start = performance.now()
        await new Promise(resolve => {
          function frame(now) {
            const time = (now - start) / 1000
            draw(Math.min(time, 6))
            if (time < 6) requestAnimationFrame(frame); else resolve()
          }
          requestAnimationFrame(frame)
        })
        recorder.stop(); await finished
        const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer())
        let binary = ''; bytes.forEach(byte => { binary += String.fromCharCode(byte) })
        return { video: btoa(binary), poster }
      }, { matrix })
      const stem = mobile ? 'scan-demo-mobile' : 'scan-demo'
      await fs.writeFile(path.join(output, `${stem}.webm`), Buffer.from(result.video, 'base64'))
      await fs.writeFile(path.join(output, `${stem}.png`), Buffer.from(result.poster, 'base64'))
      console.log(`${stem}: ${(Buffer.from(result.video, 'base64').length / 1024).toFixed(0)} KB`)
    }
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
