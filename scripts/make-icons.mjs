// Gera os ícones do app (PWA) a partir do logo exportado do Figma.
import sharp from 'sharp'
const src = 'src/assets/figma/logo.png'
for (const size of [192, 512]) {
  await sharp(src).resize(size, size, { kernel: 'lanczos3' }).png().toFile(`public/icons/icon-${size}.png`)
}
await sharp(src).resize(180, 180).png().toFile('public/icons/apple-touch-icon.png')
await sharp(src).resize(64, 64).png().toFile('public/favicon.png')
// versão "maskable" com margem de segurança e fundo verde da marca
const inner = await sharp(src).resize(360, 360).png().toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#1f7a4d' } })
  .composite([{ input: inner, gravity: 'center' }]).png().toFile('public/icons/maskable-512.png')
console.log('ícones gerados')
