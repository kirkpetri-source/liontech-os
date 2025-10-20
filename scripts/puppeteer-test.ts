import puppeteer from 'puppeteer'
import fs from 'fs'

async function main() {
  const execPath = (() => {
    try { return puppeteer.executablePath() } catch { return undefined }
  })()
  console.log('Test execPath:', execPath)
  const browser = await puppeteer.launch({ headless: true, executablePath: execPath, args: ['--disable-dev-shm-usage'] })
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))
  console.log('Navigating to web.whatsapp.com')
  await page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded', timeout: 30000 })
  const title = await page.title()
  console.log('Page title:', title)
  try {
    console.log('Waiting for QR canvas...')
    await page.waitForSelector('canvas', { timeout: 40000 })
    const dataUrl = await page.evaluate(() => {
      const c = document.querySelector('canvas') as HTMLCanvasElement | null
      return c ? c.toDataURL('image/png') : null
    })
    if (dataUrl) {
      fs.writeFileSync('qr-test.txt', dataUrl)
      console.log('QR data URL captured to qr-test.txt')
    } else {
      console.log('Canvas present but no data URL extracted')
    }
  } catch (e) {
    console.log('QR canvas not found within timeout:', e)
  }
  await browser.close()
}

main().catch(err => {
  console.error('puppeteer-test error:', err)
  process.exit(1)
})