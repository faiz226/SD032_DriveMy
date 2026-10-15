"""Draw the circuit from circuit.json: the plan (PNG + SVG), the 400 x 200 in-game map, and our
kerb lines over the drone photo they were traced from.

Run:  python docs/circuit-v2/render.py
"""
import json
import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from lib_geom import HERE

REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
PHOTO = os.path.join(REPO, 'bar', 'circuit', 'reference_aerial_grid.png')
PHOTO_M_PER_PX = 120.0 / 1271

GRASS = (111, 140, 82)
PAVE = (204, 203, 196)
SLOPE = (168, 166, 158)
KERB_Y = (232, 197, 71)
KERB_K = (30, 30, 30)
ROUTE = (40, 92, 170)
LABEL = (20, 32, 60)
NAMES = {1: 'Hill Start', 2: 'Side Parking', 3: 'Parallel Park', 4: '3-Point Turn', 5: 'S-Curve', 6: 'Z-Curve',
         7: 'Ramp Test', 8: 'Road Merging'}


def font(size, bold=False):
    for name in (('arialbd.ttf' if bold else 'arial.ttf'), 'DejaVuSans.ttf'):
        for root in ('C:/Windows/Fonts', '/usr/share/fonts/truetype/dejavu'):
            p = os.path.join(root, name)
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
    return ImageFont.load_default()


class Canvas:
    def __init__(self, bounds, ppm):
        self.x0, self.y0, self.x1, self.y1 = bounds
        self.ppm = ppm
        self.w = int((self.x1 - self.x0) * ppm)
        self.h = int((self.y1 - self.y0) * ppm)
        self.img = Image.new('RGB', (self.w, self.h), GRASS)
        self.d = ImageDraw.Draw(self.img)

    def P(self, x, y):
        return ((x - self.x0) * self.ppm, (self.y1 - y) * self.ppm)

    def poly(self, pts, fill):
        self.d.polygon([self.P(x, y) for x, y in pts], fill=fill)


def slope_quad(s, along0, along1):
    h = math.radians(s['heading_deg'])
    fx, fy = math.cos(h), math.sin(h)
    lx, ly = -fy, fx
    x, y = s['start']
    w = s['width'] / 2
    return [(x + fx * along0 + lx * w, y + fy * along0 + ly * w), (x + fx * along1 + lx * w, y + fy * along1 + ly * w),
            (x + fx * along1 - lx * w, y + fy * along1 - ly * w), (x + fx * along0 - lx * w, y + fy * along0 - ly * w)]


def pieces(samples, gap=1.0):
    """Split the route where a manoeuvre jumps the line (reversing, turning on the spot)."""
    out, cur = [], [samples[0]]
    for a, b in zip(samples, samples[1:]):
        if math.hypot(b[1] - a[1], b[2] - a[2]) > gap:
            out.append(cur)
            cur = []
        cur.append(b)
    out.append(cur)
    return out


def draw_plan(C, ppm, labels=True, route_arrows=True, kerb_px=None):
    cv = Canvas(C['site']['bounds'], ppm)
    acc = np.zeros((cv.h, cv.w), bool)            # even-odd: ring 0 is the yard edge, the rest are holes
    for ring in C['pavement']:
        m = Image.new('1', (cv.w, cv.h), 0)
        ImageDraw.Draw(m).polygon([cv.P(x, y) for x, y in ring], fill=1)
        acc ^= np.asarray(m, bool)
    base = np.asarray(cv.img).copy()
    base[acc] = PAVE
    cv.img = Image.fromarray(base)
    cv.d = ImageDraw.Draw(cv.img)
    for s in C['slopes']:
        prof = s['profile']
        top = max(z for _, z in prof)
        for (a0, z0), (a1, z1) in zip(prof, prof[1:]):
            n = 8
            for k in range(n):
                f0, f1 = k / n, (k + 1) / n
                z = (z0 + (z1 - z0) * (f0 + f1) / 2) / top
                shade = tuple(int(PAVE[i] + (SLOPE[i] - PAVE[i]) * z) for i in range(3))
                cv.poly(slope_quad(s, a0 + (a1 - a0) * f0, a0 + (a1 - a0) * f1), shade)
    kw = kerb_px or max(2, int(0.2 * ppm))
    for ring in C['kerbs']['rings']:
        pts = [cv.P(x, y) for x, y in ring]
        cv.d.line(pts + [pts[0]], fill=KERB_Y, width=kw)
        if ppm >= 6:
            acc, dash = 0.0, 1.0 * ppm
            for (ax, ay), (bx, by) in zip(pts, pts[1:] + [pts[0]]):
                L = math.hypot(bx - ax, by - ay)
                t = 0.0
                while t < L:
                    seg_start = t
                    phase = (acc + t) % (2 * dash)
                    seg_len = min((2 * dash - phase) if phase >= dash else (dash - phase), L - t)
                    if phase >= dash:
                        p = (ax + (bx - ax) * seg_start / L, ay + (by - ay) * seg_start / L)
                        q = (ax + (bx - ax) * (seg_start + seg_len) / L, ay + (by - ay) * (seg_start + seg_len) / L)
                        cv.d.line([p, q], fill=KERB_K, width=kw)
                    t += seg_len
                acc += L
    return cv


def overlay(cv, C, ppm, full=True):
    d = cv.d
    st_by = {s['id']: s for s in C['stations']}
    samples = C['route']['samples']
    # route: a thin line with arrows every 12 m
    for piece in pieces(samples):
        if len(piece) > 1:
            d.line([cv.P(q[1], q[2]) for q in piece], fill=ROUTE, width=max(1, int(0.25 * ppm)))
    if full:
        for i in range(0, len(samples) - 2, int(12 / 0.25)):
            s, x, y, h = samples[i][:4]
            if math.hypot(samples[i + 1][1] - x, samples[i + 1][2] - y) > 1.0:
                continue
            h = math.radians(h)
            tip = cv.P(x + math.cos(h) * 1.4, y + math.sin(h) * 1.4)
            l = cv.P(x - math.cos(h) * 0.6 - math.sin(h) * 0.9, y - math.sin(h) * 0.6 + math.cos(h) * 0.9)
            r = cv.P(x - math.cos(h) * 0.6 + math.sin(h) * 0.9, y - math.sin(h) * 0.6 - math.cos(h) * 0.9)
            d.polygon([tip, l, r], fill=ROUTE)
        # gates
        for st in C['stations']:
            for g in st.get('gates', []):
                col = (220, 70, 40) if g['id'] in ('stop-line', 'finish') else (250, 250, 250)
                d.line([cv.P(*g['a']), cv.P(*g['b'])], fill=col, width=max(1, int(0.18 * ppm)))
        # painted boxes: the side-parking bay (open at its mouth) and the parallel box
        for sid in ('side-parking', 'parallel-parking'):
            b = st_by[sid]['bay']
            h = math.radians(b['axis_deg'])
            fx, fy, lx, ly = math.cos(h), math.sin(h), -math.sin(h), math.cos(h)
            cx, cy = b['centre']
            hl, hw = b['length'] / 2, b['width'] / 2
            corners = [(cx + fx * a + lx * c, cy + fy * a + ly * c) for a, c in ((hl, hw), (-hl, hw), (-hl, -hw), (hl, -hw))]
            ring = corners if sid == 'side-parking' else corners + corners[:1]
            d.line([cv.P(*p) for p in ring], fill=(250, 250, 250), width=max(1, int(0.12 * ppm)))
        # hill stop band, painted yellow across the lane
        hs = st_by['hill-start']
        band = hs['stop_band']
        for q in samples:
            if band['s_from'] <= q[0] <= band['s_to']:
                hh = math.radians(q[3])
                w2 = q[4] / 2
                d.line([cv.P(q[1] - math.sin(hh) * w2, q[2] + math.cos(hh) * w2),
                        cv.P(q[1] + math.sin(hh) * w2, q[2] - math.cos(hh) * w2)], fill=(240, 200, 30), width=max(1, int(0.3 * ppm)))
        for p in C['obstacles']['poles']:
            x, y = cv.P(*p['at'])
            r = max(2, 0.25 * ppm)
            d.ellipse([x - r, y - r, x + r, y + r], fill=(215, 40, 40), outline=(255, 255, 255))
        # booths and office
        for bth in C['props']['booths'] + [C['props']['office']]:
            (x, y), (sw, sd) = bth['centre'], bth['size']
            d.rectangle([cv.P(x - sw / 2, y + sd / 2), cv.P(x + sw / 2, y - sd / 2)], fill=(92, 128, 178), outline=(40, 60, 90))
        # spawn
        sx, sy = C['spawn']['at']
        hh = math.radians(C['spawn']['heading_deg'])
        car = [(sx + math.cos(hh) * a - math.sin(hh) * c, sy + math.sin(hh) * a + math.cos(hh) * c)
               for a, c in ((3.1, 0.87), (3.1, -0.87), (-0.7, -0.87), (-0.7, 0.87))]
        d.polygon([cv.P(*p) for p in car], fill=(250, 250, 250), outline=(20, 20, 20))
    # station numbers
    fb = font(max(10, int(2.0 * ppm)), bold=True)
    for st in sorted(C['stations'], key=lambda s: s['order']):
        x, y = anchor(st, samples)
        X, Y = cv.P(x, y)
        r = max(7, 1.6 * ppm)
        d.ellipse([X - r, Y - r, X + r, Y + r], fill=LABEL)
        d.text((X, Y), str(st['order']), font=fb, fill=(255, 255, 255), anchor='mm')


def anchor(st, samples):
    """Where a station's number goes on the plan, in metres."""
    if 'bay' in st:
        cx, cy = st['bay']['centre']
        return (cx - 4.5, cy) if st['id'] == 'side-parking' else (cx - 3.6, cy)
    if 'box' in st and st['id'] == 'three-point-turn':
        bx = [p[0] for p in st['box']]
        by = [p[1] for p in st['box']]
        return max(bx) + 3.0, (min(by) + max(by)) / 2
    if st['id'] == 'ramp-test':
        ax, ay = st['axis']['start']
        return ax + 6.5, ay - 4.2
    seg = [q for q in samples if st['s_from'] <= q[0] <= st['s_to']]
    q = seg[len(seg) // 2]
    h = math.radians(q[3])
    off = q[4] / 2 + 3.2
    if st['id'] == 'road-merging':
        off = -off
    return q[1] - math.sin(h) * off, q[2] + math.cos(h) * off


def plan_png(C):
    ppm = 9
    cv = draw_plan(C, ppm)
    overlay(cv, C, ppm)
    d = cv.d
    # title, legend, scale bar, north arrow on a white band
    band = 150
    out = Image.new('RGB', (cv.w, cv.h + band), (255, 255, 255))
    out.paste(cv.img, (0, band))
    d = ImageDraw.Draw(out)
    d.text((18, 14), 'DriveMy practice yard: the real ARM yard, eight stations in test order on one route',
           font=font(22, True), fill=LABEL)
    d.text((18, 46), 'Traffic keeps left. Start in the apron (white car) and follow the arrows. Breaks in the line are manoeuvres: reversing into a bay, turning round, backing off the ramp.',
           font=font(15), fill=(60, 60, 60))
    f = font(15)
    x = 18
    for k in range(1, 9):
        txt = '%d %s' % (k, NAMES[k])
        d.ellipse([x, 84, x + 22, 106], fill=LABEL)
        d.text((x + 11, 95), str(k), font=font(14, True), fill=(255, 255, 255), anchor='mm')
        d.text((x + 28, 86), NAMES[k], font=f, fill=(40, 40, 40))
        x += 34 + int(d.textlength(NAMES[k], font=f)) + 14
    # scale bar 20 m
    sx0, sy0 = 18, band + cv.h - 30
    d.rectangle([sx0, sy0, sx0 + 20 * ppm, sy0 + 8], fill=(255, 255, 255), outline=(20, 20, 20))
    d.rectangle([sx0, sy0, sx0 + 10 * ppm, sy0 + 8], fill=(20, 20, 20))
    d.text((sx0 + 20 * ppm + 8, sy0 - 4), '20 m', font=f, fill=(255, 255, 255))
    nx, ny = cv.w - 40, band + 40
    d.polygon([(nx, ny - 22), (nx - 9, ny + 6), (nx + 9, ny + 6)], fill=(255, 255, 255), outline=(20, 20, 20))
    d.text((nx, ny + 18), 'N', font=font(16, True), fill=(255, 255, 255), anchor='mm')
    d.text((18, 118), 'White lines: judging gates. Yellow band: hill stop band. Red line: finish. Red dots: poles. Blue boxes: booths and office. '
           'Darker: hill 1.3 m, ramp 0.6 m. One map for every level.', font=font(13), fill=(70, 70, 70))
    p = os.path.join(HERE, 'circuit-plan.png')
    out.save(p, optimize=True)
    return p


def minimap_png(C):
    x0, y0, x1, y1 = C['site']['bounds']
    ppm = min(400 / (x1 - x0), 200 / (y1 - y0))
    cv = draw_plan(C, ppm, kerb_px=1)
    overlay(cv, C, ppm, full=False)
    out = Image.new('RGB', (400, 200), GRASS)
    out.paste(cv.img, ((400 - cv.w) // 2, (200 - cv.h) // 2))
    p = os.path.join(HERE, 'circuit-minimap.png')
    out.save(p)
    return p


def plan_svg(C):
    x0, y0, x1, y1 = C['site']['bounds']
    W, H = x1 - x0, y1 - y0

    def P(x, y):
        return '%.2f,%.2f' % (x - x0, y1 - y)

    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.1f %.1f" width="%d" height="%d">' % (W, H, int(W * 8), int(H * 8)),
           '<rect width="100%%" height="100%%" fill="rgb%s"/>' % (GRASS,)]
    out.append('<path fill-rule="evenodd" fill="rgb%s" d="%s"/>' % (PAVE, ' '.join(
        'M %s Z' % ' L '.join(P(x, y) for x, y in ring) for ring in C['pavement'])))
    for s in C['slopes']:
        L = s['profile'][-1][0]
        out.append('<polygon points="%s" fill="rgb%s"/>' % (' '.join(P(x, y) for x, y in slope_quad(s, 0, L)), SLOPE))
    for ring in C['kerbs']['rings']:
        pts = ' '.join(P(x, y) for x, y in ring)
        out.append('<polygon points="%s" fill="none" stroke="rgb%s" stroke-width="0.2"/>' % (pts, KERB_Y))
        out.append('<polygon points="%s" fill="none" stroke="rgb%s" stroke-width="0.2" stroke-dasharray="1 1"/>' % (pts, KERB_K))
    for piece in pieces(C['route']['samples']):
        out.append('<polyline points="%s" fill="none" stroke="rgb%s" stroke-width="0.25"/>' % (
            ' '.join(P(q[1], q[2]) for q in piece), ROUTE))
    for st in C['stations']:
        for g in st.get('gates', []):
            out.append('<line x1="%.2f" y1="%.2f" x2="%.2f" y2="%.2f" stroke="white" stroke-width="0.18"/>' % (
                g['a'][0] - x0, y1 - g['a'][1], g['b'][0] - x0, y1 - g['b'][1]))
        ax_, ay_ = anchor(st, C['route']['samples'])
        out.append('<circle cx="%.2f" cy="%.2f" r="1.6" fill="rgb%s"/><text x="%.2f" y="%.2f" font-size="2" '
                   'font-family="Arial" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">%d</text>' % (
                       ax_ - x0, y1 - ay_, LABEL, ax_ - x0, y1 - ay_, st['order']))
    out.append('</svg>')
    p = os.path.join(HERE, 'circuit-plan.svg')
    with open(p, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    return p


def comparison_png(C):
    """Our kerb lines drawn over the drone photo they were traced from (x = px * 0.0943,
    y = (750 - py) * 0.0943), at twice the photo's size."""
    photo = Image.open(PHOTO).convert('RGB')
    k = 2
    big = photo.resize((photo.width * k, photo.height * k), Image.BICUBIC)
    d = ImageDraw.Draw(big)
    m_per_px = C['parameters']['photo_scale']['value']

    def Q(x, y):
        return (x / m_per_px * k, (750 - y / m_per_px) * k)
    for ring in C['kerbs']['rings']:
        pts = [Q(x, y) for x, y in ring]
        d.line(pts + [pts[0]], fill=(255, 40, 40), width=3)
    for piece in pieces(C['route']['samples']):
        if len(piece) > 1:
            d.line([Q(q[1], q[2]) for q in piece], fill=(40, 120, 255), width=3)
    band = 60
    out = Image.new('RGB', (big.width, big.height + band), (255, 255, 255))
    out.paste(big, (0, band))
    ImageDraw.Draw(out).text((14, 16), 'Red: our kerb lines over the real yard. Blue: the assessment route. The photo is cut off at the bottom; '
                             'the yard edge there comes from the blueprint.', font=font(18, True), fill=LABEL)
    p = os.path.join(HERE, 'yard-vs-photo.png')
    out.save(p, optimize=True)
    return p


def main():
    with open(os.path.join(HERE, 'circuit.json'), encoding='utf-8') as f:
        C = json.load(f)
    for fn in (plan_png, minimap_png, plan_svg):
        print('wrote', fn(C))
    if os.path.exists(PHOTO):
        print('wrote', comparison_png(C))
    else:
        print('skipped yard-vs-photo.png: no drone photo at', PHOTO)


if __name__ == '__main__':
    main()
