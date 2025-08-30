import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

async function main() {
  const dir = path.join(process.cwd(), 'memento');
  await fs.mkdir(dir, { recursive: true });

  // Generate a simple gradient JPG
  const w = 1280, h = 960;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#0f172a'/>
        <stop offset='100%' stop-color='#6b21a8'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <circle cx='50%' cy='50%' r='200' fill='rgba(255,255,255,0.25)'/>
    <text x='50%' y='90%' text-anchor='middle' font-family='system-ui, sans-serif' font-size='48' fill='#fff'>Test Photo</text>
  </svg>`;
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
  await fs.writeFile(path.join(dir, 'test.jpg'), jpg);

  // Create a sample setlist ~40 tracks
  const tracks = Array.from({ length: 42 }, (_, i) => {
    const n = (i + 1).toString().padStart(2, '0');
    return `${n}. Artist ${n} – Track Title ${n} (Extended Mix)`;
  }).join('\n');
  await fs.writeFile(path.join(dir, 'test.txt'), tracks, 'utf8');

  console.log('Wrote memento/test.jpg and memento/test.txt');
}

main().catch((err) => { console.error(err); process.exit(1); });

