import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'node:fs/promises';
import path from 'node:path';

type ScreenshotResult = {
  content?: Array<{ type: string; data?: string }>;
};

async function run() {
  const transport = new StdioClientTransport({
    command: 'pnpm',
    args: ['run', 'mcp:browser'],
    env: { HEADLESS: 'true', ...process.env },
  });

  const client = new Client({ name: 'mcp-smoke', version: '0.0.1' });
  await client.connect(transport);

  const url = process.env.SMOKE_URL || 'http://localhost:3000';
  console.log(`[smoke] Navigating to ${url}`);
  await client.callTool({ name: 'navigate', arguments: { url } });
  await client.callTool({ name: 'wait_for', arguments: { selector: 'body', state: 'visible' } });

  const result = await client.callTool({ name: 'screenshot', arguments: { fullPage: true } }) as unknown as ScreenshotResult;
  const imageItem = result?.content?.find((c) => c.type === 'image');
  if (!imageItem) throw new Error('No image returned from screenshot');
  const b64 = imageItem.data as string;

  const outDir = path.join(process.cwd(), 'screenshots');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, 'mcp-smoke.png');
  await fs.writeFile(outPath, Buffer.from(b64, 'base64'));
  console.log(`[smoke] Wrote ${outPath}`);

  await client.close();
}

run().catch((err) => {
  console.error('[smoke] Failed:', err);
  process.exit(1);
});
