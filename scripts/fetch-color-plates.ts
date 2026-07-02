import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const PLATES_DIR = path.join(process.cwd(), 'public', 'color-plates');

const PLATES_CONFIG = [
  { id: 1, type: "control", num: 12 },
  { id: 2, type: "diagnostic", num: 8 },
  { id: 3, type: "diagnostic", num: 29 },
  { id: 4, type: "diagnostic", num: 5 },
  { id: 5, type: "control", num: 3 },
  { id: 6, type: "diagnostic", num: 15 },
  { id: 7, type: "diagnostic", num: 74 },
  { id: 8, type: "control", num: 6 },
  { id: 9, type: "diagnostic", num: 45 },
  { id: 10, type: "control", num: 5 },
  { id: 11, type: "control", num: 7 },
  { id: 12, type: "control", num: 16 }
];

async function run() {
  if (!fs.existsSync(PLATES_DIR)) {
    fs.mkdirSync(PLATES_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log("Attempting to scrape Ishihara plates...");
  
  let success = false;
  try {
    // Try navigating to a known site
    await page.goto('https://www.colorlitelens.com/ishihara-test.html', { waitUntil: 'networkidle2', timeout: 15000 });
    
    // Attempt to extract images that might be plates
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => img.src && (img.src.includes('ishihara') || img.src.includes('plate')))
        .map(img => img.src);
    });

    if (images.length >= 12) {
      console.log(`Found ${images.length} images. Downloading first 12...`);
      for (let i = 0; i < 12; i++) {
        const viewSource = await page.goto(images[i]);
        if (viewSource) {
          const buffer = await viewSource.buffer();
          fs.writeFileSync(path.join(PLATES_DIR, `plate-${i+1}.png`), buffer);
        }
      }
      success = true;
      console.log("Scraping successful.");
    } else {
      throw new Error(`Only found ${images.length} images, need 12.`);
    }
  } catch (err: any) {
    console.log(`Scraping failed or blocked (${err.message}). Falling back to programmatic generation...`);
    success = false;
  }

  if (!success) {
    console.log("Generating high-quality programmatic Ishihara plates using Puppeteer Canvas...");
    
    for (const p of PLATES_CONFIG) {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <body style="margin:0; display:flex; align-items:center; justify-content:center; background:white;">
          <canvas id="c" width="400" height="400"></canvas>
          <script>
            const canvas = document.getElementById('c');
            const ctx = canvas.getContext('2d');
            const width = 400;
            const height = 400;
            const num = "${p.num}";
            
            // Draw text to an offscreen canvas to use as a mask
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = width;
            maskCanvas.height = height;
            const mCtx = maskCanvas.getContext('2d');
            mCtx.fillStyle = 'black';
            mCtx.fillRect(0, 0, width, height);
            mCtx.fillStyle = 'white';
            mCtx.font = 'bold 220px Arial';
            mCtx.textAlign = 'center';
            mCtx.textBaseline = 'middle';
            mCtx.fillText(num, width/2, height/2 + 20);
            
            const maskData = mCtx.getImageData(0,0,width,height).data;
            
            const isText = (x, y) => {
              if (x < 0 || y < 0 || x >= width || y >= height) return false;
              const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
              return maskData[idx] > 128; // white
            };

            const circles = [];
            const radius = 180;
            
            // Generate non-overlapping random dots
            for (let i = 0; i < 5000; i++) {
              let x = Math.random() * width;
              let y = Math.random() * height;
              
              const distFromCenter = Math.sqrt(Math.pow(x - width/2, 2) + Math.pow(y - height/2, 2));
              if (distFromCenter > radius) continue;
              
              let r = Math.random() * 8 + 4; // radius between 4 and 12
              
              // check collision
              let overlap = false;
              for (const c of circles) {
                const d = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(y - c.y, 2));
                if (d < r + c.r + 1) {
                  overlap = true;
                  break;
                }
              }
              if (!overlap) {
                circles.push({x, y, r});
              }
            }

            // Draw dots
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            
            circles.forEach(c => {
              ctx.beginPath();
              ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
              
              const inText = isText(c.x, c.y);
              
              // Colors
              const fgColors = ['#e74c3c', '#e67e22', '#d35400']; // reds/oranges
              const bgColors = ['#2ecc71', '#27ae60', '#16a085', '#bdc3c7']; // greens/grays
              
              const palette = inText ? fgColors : bgColors;
              ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
              ctx.fill();
            });
          </script>
        </body>
        </html>
      `);
      
      // wait a bit for script execution
      await new Promise(r => setTimeout(r, 100));
      
      const canvasEl = await page.$('#c');
      await canvasEl?.screenshot({ path: path.join(PLATES_DIR, `plate-${p.id}.png`) });
      console.log(`Generated plate-${p.id}.png`);
    }
  }

  await browser.close();
  console.log("Done.");
}

run().catch(console.error);
