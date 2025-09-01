import fs from 'node:fs/promises';
import path from 'node:path';
import { composeMemento } from '../app/(ui)/memento/render/compose';

async function run() {
  const jpgPath = path.join(process.cwd(), 'memento', 'test.jpg');
  const data = await fs.readFile(jpgPath);
  const dataUrl = `data:image/jpeg;base64,${data.toString('base64')}`;
  const payload = {
    templateId: 'portrait',
    partyName: 'Local Compose Test',
    subtitleVariant: 'from',
    date: '2025-08-29',
    location: 'NYC',
    notes: '',
    tracks: [
      { artist: 'A', title: 'B' },
      { artist: 'C', title: 'D (Remix)' },
    ],
    photo: { dataUrl },
    preview: true,
  } as any;

  const buf = await composeMemento(payload);
  const out = path.join(process.cwd(), 'screenshots', 'local-compose.png');
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, buf);
  console.log('wrote', out);
}

run().catch((e) => { console.error(e); process.exit(1); });
