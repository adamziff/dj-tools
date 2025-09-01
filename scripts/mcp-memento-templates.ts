import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';
import fs from 'node:fs/promises';

type ScreenshotResult = {
  content?: Array<{ type: string; data?: string }>;
};

const templates = [
  { name: 'portrait', label: 'Portrait' },
  { name: 'landscape', label: 'Landscape' },
  { name: 'square', label: 'Square' },
];

async function run() {
  const transport = new StdioClientTransport({
    command: 'pnpm',
    args: ['run', 'mcp:browser'],
    env: { HEADLESS: 'false', ...process.env },
  });
  const client = new Client({ name: 'mcp-memento-templates', version: '0.0.1' });
  await client.connect(transport);

  const base = process.env.BASE_URL || 'http://localhost:3000';
  const photoPath = path.join(process.cwd(), 'memento', 'test.jpg');
  const textPath = path.join(process.cwd(), 'memento', 'test.txt');
  await client.callTool({ name: 'navigate', arguments: { url: `${base}/memento` } });
  await client.callTool({ name: 'wait_for', arguments: { selector: 'text=Memento Generator', state: 'visible' } });

  // Upload data once
  await client.callTool({ name: 'fill', arguments: { selector: 'label:has-text("Party name") input', value: 'Template Sweep' } });
  await client.callTool({ name: 'fill', arguments: { selector: 'input[type="date"]', value: '2025-08-29' } });
  await client.callTool({ name: 'fill', arguments: { selector: 'label:has-text("Location") input', value: 'New York, NY' } });
  await client.callTool({ name: 'set_input_files', arguments: { selector: 'input[accept*="image"]', files: photoPath } });
  await client.callTool({ name: 'set_input_files', arguments: { selector: 'input[accept*="text/plain"]', files: textPath } });

  // Ensure preview ready once
  await client.callTool({ name: 'wait_for', arguments: { selector: 'img[alt="Memento preview"]', state: 'visible' } });

  const outDir = path.join(process.cwd(), 'screenshots');
  await fs.mkdir(outDir, { recursive: true });

  // Click each template button and snapshot
  for (const t of templates) {
    await client.callTool({ name: 'click', arguments: { selector: `button:has-text("${t.label}")` } });
    await client.callTool({ name: 'wait_for', arguments: { selector: 'img[alt="Memento preview"]', state: 'visible' } });
    const shot = await client.callTool({ name: 'screenshot', arguments: { fullPage: true } }) as unknown as ScreenshotResult;
    const imageItem = shot?.content?.find((c) => c.type === 'image');
    if (imageItem) {
      const outPath = path.join(outDir, `memento-${t.name}.png`);
      await fs.writeFile(outPath, Buffer.from((imageItem as any).data, 'base64'));
      console.log('saved', outPath);
    }
  }

  await client.close();
}

run().catch((err) => { console.error(err); process.exit(1); });
