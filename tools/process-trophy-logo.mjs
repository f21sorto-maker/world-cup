/**
 * Builds transparent trophy PNGs from the official-style reference photo.
 * Usage: node tools/process-trophy-logo.mjs [path/to/reference.png]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src =
  process.argv[2] ??
  path.join(root, "public/logo/reference/wc-trophy-reference.png");
const outDir = path.join(root, "public/logo");

const py = `
from PIL import Image, ImageFilter
import math, sys

SRC = sys.argv[1]
OUT_DIR = sys.argv[2]

im = Image.open(SRC).convert('RGBA')
w, h = im.size
crop = im.crop((int(w*0.08), int(h*0.02), int(w*0.92), int(h*0.78)))
px = crop.load()
cw, ch = crop.size
min_x, min_y, max_x, max_y = cw, ch, 0, 0
for y in range(ch):
    for x in range(cw):
        r,g,b,a = px[x,y]
        lum = 0.2126*r + 0.7152*g + 0.0722*b
        if lum > 18 or max(r,g,b) > 24:
            min_x = min(min_x, x); min_y = min(min_y, y)
            max_x = max(max_x, x); max_y = max(max_y, y)
pad = int(max(cw,ch) * 0.04)
trimmed = crop.crop((max(0,min_x-pad), max(0,min_y-pad), min(cw,max_x+pad), min(ch,max_y+pad)))

def process(im_in):
    out = im_in.copy().convert('RGBA')
    w,h = out.size
    px = out.load()
    cx, cy = w/2, h*0.46
    max_r = math.hypot(max(cx,w-cx), max(cy,h-cy))
    for y in range(h):
        for x in range(w):
            r,g,b,a = px[x,y]
            lum = 0.2126*r + 0.7152*g + 0.0722*b
            d = math.sqrt(r*r+g*g+b*b)
            if d < 38:
                px[x,y] = (r,g,b,int(255*(d/38)**1.25))
            elif lum < 12 and max(r,g,b) < 18:
                px[x,y] = (r,g,b,0)
            r,g,b,a = px[x,y]
            if 0 < a < 250 and lum < 40:
                s = min(1.0, lum/40)
                px[x,y] = (r,g,b,int(a*(0.1+0.9*s**1.4)))
            r,g,b,a = px[x,y]
            if a > 0:
                radial = math.hypot(x-cx,y-cy)/max_r
                if radial > 0.58:
                    t = min(1,max(0,(radial-0.58)/(0.96-0.58)))
                    px[x,y] = (r,g,b,int(a*(1-t)**2.2))
    alpha = out.split()[3].filter(ImageFilter.GaussianBlur(0.8))
    rgb = out.convert('RGB')
    return Image.merge('RGBA', (*rgb.split(), alpha))

processed = process(trimmed)
target = 1024
tw, th = processed.size
scale = min((target*0.88)/tw, (target*0.88)/th)
resized = processed.resize((max(1,int(tw*scale)), max(1,int(th*scale))), Image.Resampling.LANCZOS)
canvas = Image.new('RGBA', (target,target), (0,0,0,0))
canvas.paste(resized, ((target-resized.width)//2, (target-resized.height)//2), resized)
canvas.save(f'{OUT_DIR}/wc-trophy-logo.png', optimize=True)
canvas.resize((256,256), Image.Resampling.LANCZOS).save(f'{OUT_DIR}/wc-trophy-splash.png', optimize=True)
margin = int(target*0.06)
crop2 = canvas.crop((margin,margin,target-margin,target-margin))
for size, name in [(256,'wc-trophy-mark.png'),(512,'wc-trophy-mark@2x.png')]:
    crop2.resize((size,size), Image.Resampling.LANCZOS).save(f'{OUT_DIR}/{name}', optimize=True)
print('wrote trophy assets to', OUT_DIR)
`;

const result = spawnSync("python3", ["-c", py, src, outDir], { stdio: "inherit" });
process.exit(result.status ?? 1);
