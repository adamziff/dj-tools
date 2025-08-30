import { chromium, Browser, Page } from 'playwright';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

let browser: Browser | null = null;
let page: Page | null = null;

async function ensurePage() {
  if (!browser) {
    const headless = process.env.HEADLESS !== 'false';
    browser = await chromium.launch({ headless });
  }
  if (!page) {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    page = await ctx.newPage();
  }
  return page;
}

async function main() {
  const server = new McpServer({ name: 'browser-use', version: '0.1.0' });

  server.tool(
    'navigate',
    'Open a URL in the controlled browser tab.',
    { url: z.string().url() },
    async ({ url }) => {
      const p = await ensurePage();
      const resp = await p.goto(url, { waitUntil: 'domcontentloaded' });
      return {
        content: [
          { type: 'text', text: `Navigated to ${p.url()} (status: ${resp?.status() ?? 'n/a'})` },
        ],
      };
    }
  );

  server.tool(
    'screenshot',
    'Take a screenshot and return it as base64 PNG.',
    { fullPage: z.boolean().default(true) },
    async ({ fullPage = true }) => {
      const p = await ensurePage();
      const buf = await p.screenshot({ fullPage });
      const b64 = buf.toString('base64');
      return {
        content: [
          { type: 'text', text: 'Screenshot captured (base64 PNG).' },
          { type: 'image', data: b64, mimeType: 'image/png' },
        ],
      };
    }
  );

  server.tool(
    'content',
    'Return current page URL, title, and HTML snapshot.',
    { includeHtml: z.boolean().default(false) },
    async ({ includeHtml = false }) => {
      const p = await ensurePage();
      const title = await p.title();
      const url = p.url();
      const html = includeHtml ? await p.content() : undefined;
      const payload = { url, title, html };
      return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
    }
  );

  server.tool(
    'click',
    'Click an element by CSS selector. For text, use selector like text=Your Label.',
    { selector: z.string() },
    async ({ selector }) => {
      const p = await ensurePage();
      await p.click(selector, { timeout: 10000 });
      return { content: [{ type: 'text', text: `Clicked ${selector}` }] };
    }
  );

  server.tool(
    'fill',
    'Fill an input/textarea by CSS selector with provided text.',
    { selector: z.string(), value: z.string() },
    async ({ selector, value }) => {
      const p = await ensurePage();
      await p.fill(selector, value, { timeout: 10000 });
      return { content: [{ type: 'text', text: `Filled ${selector} with ${value}` }] };
    }
  );

  server.tool(
    'wait_for',
    'Wait for a selector to appear. States: attached, detached, visible, hidden.',
    { selector: z.string(), state: z.enum(['attached', 'detached', 'visible', 'hidden']).default('visible') },
    async ({ selector, state }) => {
      const p = await ensurePage();
      await p.waitForSelector(selector, { state, timeout: 15000 });
      return { content: [{ type: 'text', text: `Selector ${selector} is ${state}` }] };
    }
  );

  server.tool(
    'evaluate',
    'Evaluate JavaScript in the page context and return result as JSON.',
    { expression: z.string() },
    async ({ expression }) => {
      const p = await ensurePage();
      const result = await p.evaluate((expr) => {
        // eslint-disable-next-line no-new-func
        return Function(`return (${expr})`)();
      }, expression);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'go',
    'Go back, forward, or reload the page.',
    { action: z.enum(['back', 'forward', 'reload']) },
    async ({ action }) => {
      const p = await ensurePage();
      if (action === 'back') await p.goBack();
      if (action === 'forward') await p.goForward();
      if (action === 'reload') await p.reload();
      return { content: [{ type: 'text', text: `Performed ${action}. URL: ${p.url()}` }] };
    }
  );

  server.tool(
    'set_input_files',
    'Attach local files to a file <input> matched by CSS selector.',
    { selector: z.string(), files: z.union([z.string(), z.array(z.string())]) },
    async ({ selector, files }) => {
      const p = await ensurePage();
      const fileList = Array.isArray(files) ? files : [files];
      await p.setInputFiles(selector, fileList);
      return { content: [{ type: 'text', text: `Attached ${fileList.length} file(s) to ${selector}` }] };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Graceful shutdown
  const shutdown = async () => {
    try {
      await browser?.close();
    } catch {}
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
