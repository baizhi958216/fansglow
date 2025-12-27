import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join } from 'path'

const svgBuffer = readFileSync(join(process.cwd(), 'public', 'icons', 'icon.svg'))

const sizes = [192, 512]

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(process.cwd(), 'public', 'icons', `icon-${size}x${size}.png`))

  console.log(`Generated icon-${size}x${size}.png`)
}

console.log('All icons generated successfully!')
