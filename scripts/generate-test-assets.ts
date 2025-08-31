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

  // Create a Rekordbox-like TSV with header as in example
  const header = ['#','Comments','Track Title','Artist','BPM','Key','My Tag','Time','Date Added','DJ Play Count'].join('\t');
  const rows: string[] = [
    ['1','','Free Bird - MOONLGHT Remix','Lynyrd Skynyrd','142.00','Gm','','03:09','2024-11-07','0'].join('\t'),
    ['2','','Otis - REDD Remix (Clean)','JAY-Z & Kanye West ft. Otis Redding','124.00','Eb','','03:24','2024-11-07','1'].join('\t'),
    ['3','','Body Pump - Sammy Virji Remix','Aluna','130.00','Bbm','','04:19','2024-11-15','0'].join('\t'),
    ['4','','Counting - Sammy Virji Remix','Hamdi & Princess Superstar','134.00','Em','','03:35','2024-11-15','0'].join('\t'),
    ['5','','If U Need It','Sammy Virji','132.00','Ebm','','02:57','2024-11-15','0'].join('\t'),
    ['6','','Take That','DJ SWISHERMAN & BEADS','140.00','Fm','','04:27','2024-11-15','0'].join('\t'),
    ['7','','Smoked Out','DJ SWISHERMAN','145.00','Fm','','05:04','2024-11-15','0'].join('\t'),
    ['8','','Hotel Pool (DJ SWISHERMAN & Boys Noize Remix)','David Löhlein','144.00','Gm','','05:06','2024-11-15','0'].join('\t'),
    ['9','','DIET PEPSI (ANOP\'s DREAMLAND MIX)','Addison Rae','154.00','Cm','','03:44','2024-10-05','4'].join('\t'),
  ];
  const tsv = [header, ...rows].join('\n');
  await fs.writeFile(path.join(dir, 'test.txt'), tsv, 'utf8');

  console.log('Wrote memento/test.jpg and memento/test.txt');
}

main().catch((err) => { console.error(err); process.exit(1); });
