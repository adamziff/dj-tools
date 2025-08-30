import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';

async function run() {
  const transport = new StdioClientTransport({
    command: 'pnpm',
    args: ['run', 'mcp:browser'],
    env: { HEADLESS: 'false', ...process.env },
  });

  const client = new Client({ name: 'mcp-memento-flow', version: '0.0.1' });
  await client.connect(transport);

  const base = process.env.BASE_URL || 'http://localhost:3000';
  const photoPath = path.join(process.cwd(), 'memento', 'test.jpg');
  const textPath = path.join(process.cwd(), 'memento', 'test.txt');

  await client.callTool({ name: 'navigate', arguments: { url: `${base}/memento` } });
  await client.callTool({ name: 'wait_for', arguments: { selector: 'text=Memento Generator', state: 'visible' } });

  // Fill metadata
  await client.callTool({ name: 'fill', arguments: { selector: 'label:has-text("Party name") input', value: 'Memento Test Wedding' } });
  await client.callTool({ name: 'fill', arguments: { selector: 'input[type="date"]', value: '2025-08-29' } });
  await client.callTool({ name: 'fill', arguments: { selector: 'label:has-text("Location") input', value: 'Brooklyn, NY' } });

  // Upload image via first image accept input
  await client.callTool({ name: 'set_input_files', arguments: { selector: 'input[accept*="image"]', files: photoPath } });

  // Upload tracklist file
  await client.callTool({ name: 'set_input_files', arguments: { selector: 'input[accept*="text/plain"]', files: textPath } });

  // Wait for preview image to appear and settle
  await client.callTool({ name: 'wait_for', arguments: { selector: 'img[alt="Memento preview"]', state: 'visible' } });
  const shot = await client.callTool({ name: 'screenshot', arguments: { fullPage: true } });
  const imageItem = shot?.content?.find((c: any) => c.type === 'image');
  if (imageItem) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const outDir = path.join(process.cwd(), 'screenshots');
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, 'memento-flow.png');
    await fs.writeFile(outPath, Buffer.from((imageItem as any).data, 'base64'));
    console.log('[flow] wrote', outPath);
  }

  await client.close();
}

run().catch((err) => { console.error('[flow] Failed', err); process.exit(1); });
