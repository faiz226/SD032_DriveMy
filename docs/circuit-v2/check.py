"""Check the circuit from circuit.json alone: organised, real, roomy, possible, cheap.

Run:  python docs/circuit-v2/check.py [--car path/to/car.json]
Exit code 0 only if every check passes. Writes check_report.json beside this file.

Nothing here reads the generator. It rebuilds the drivable area from the pavement polygons in
circuit.json, so it checks exactly what the game will load.
"""
import argparse
import json
import math
import os
import sys
import time

# One maths thread: with numpy's default thread pool the check once died with an OpenBLAS
# "Memory allocation still failed" error on the dev laptop (14 Oct). Must be set before numpy loads.
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

from lib_geom import HERE, Car, World, follow, parallel_into_slot, reverse_into_bay, reverse_out, three_point

RULES = os.path.join(HERE, '..', 'v2-plan', 'rules.json')

# Measured off bar/circuit/reference_aerial_grid.png at 0.0943 m/px (+/-5% scale). See AUDIT.md.
REAL = {
    's_lane':      (3.35, 3.76, 'S lane kerb to kerb, p10-p90 along the real centreline'),
    's_bend':      (141.0, 7.5, 'Real S: two opposite bends of about 141 deg at about 7.5 m centreline radius'),
    'z_lane':      (3.9, 4.0, 'Real Z lane'),
    'z_jog':       (7.7, None, 'Real Z middle leg, centre to centre'),
    'tpt_road':    (7.64, None, 'Real lane between the Z and S blocks, 81 px (YARD-TRACE.md); a first scanline read gave 7.45 m'),
    'hill':        (26.6, 4.6, 'Real hill strip length x width (YARD-TRACE.md)'),
    'parallel':    (6.6, 3.77, 'Real recess in the top-left island, length x depth (YARD-TRACE.md)'),
    'side_pocket': (4.72, 5.78, 'Real pocket in the bottom-left island, width x depth (YARD-TRACE.md)'),
}
SCALE_TOL = 0.05   # the photo's scale is +/-5%


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def polygon_mask(polys, bounds, res):
    x0, y0, x1, y1 = bounds
    w = int(math.ceil((x1 - x0) / res)) + 1
    h = int(math.ceil((y1 - y0) / res)) + 1
    img = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(img)
    for poly in polys:
        d.polygon([((x - x0) / res, (y - y0) / res) for x, y in poly], fill=255)
    return np.asarray(img) > 127


def corridor(samples, s0, s1):
    polys = []
    for a, b in zip(samples, samples[1:]):
        if a[0] < s0 or b[0] > s1 or math.hypot(b[1] - a[1], b[2] - a[2]) > 1.0:
            continue
        (sa, xa, ya, ha, wa, _), (sb, xb, yb, hb, wb, _) = a, b
        ha, hb = math.radians(ha), math.radians(hb)
        na, nb = (-math.sin(ha), math.cos(ha)), (-math.sin(hb), math.cos(hb))
        polys.append([(xa + na[0] * wa / 2, ya + na[1] * wa / 2), (xb + nb[0] * wb / 2, yb + nb[1] * wb / 2),
                      (xb - nb[0] * wb / 2, yb - nb[1] * wb / 2), (xa - na[0] * wa / 2, ya - na[1] * wa / 2)])
    return polys


def segs_intersect(p1, p2, p3, p4):
    def orient(a, b, c):
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    d1, d2 = orient(p3, p4, p1), orient(p3, p4, p2)
    d3, d4 = orient(p1, p2, p3), orient(p1, p2, p4)
    return (d1 * d2 < 0) and (d3 * d4 < 0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--car', default=None)
    ap.add_argument('--circuit', default=os.path.join(HERE, 'circuit.json'))
    args = ap.parse_args()
    t0 = time.time()
    C = load(args.circuit)
    car = Car.load(args.car)
    kerb_h = C['kerbs']['height']
    samples = C['route']['samples']
    S = np.array([q[0] for q in samples])
    bounds = C['site']['bounds']
    stations = sorted(C['stations'], key=lambda s: s['order'])
    results, failures = [], []

    def record(section, name, ok, detail):
        results.append(dict(section=section, check=name, ok=bool(ok), detail=detail))
        print('  [%s] %-46s %s' % ('PASS' if ok else 'FAIL', name, detail))
        if not ok:
            failures.append(name)

    world = World(*bounds, res=0.05)
    acc = None
    for ring in C['pavement']:              # even-odd: ring 0 is the yard edge, the rest are holes
        m = polygon_mask([ring], bounds, 0.05)
        acc = m if acc is None else acc ^ m
    world.img = Image.fromarray((acc * 255).astype(np.uint8))
    world.finish()
    for p in C['obstacles']['poles'] + C['obstacles']['cones']:
        world.obstacles.append((p['at'][0], p['at'][1], p['radius']))
    print('Car: %s  (rear-axle turning radius at full lock %.2f m)' % (car.name, car.R))

    # ---------------------------------------------------------------- 1 Organised
    print('\n1 ORGANISED')
    ords = [s['order'] for s in sorted(stations, key=lambda s: s['s_from'])]
    record('organised', 'eight stations, in order along one route', ords == list(range(1, 9)), 'order along s: %s' % ords)
    coarse = [(q[1], q[2]) for q in samples[::4]]
    junctions = [np.asarray(j['polygon']) for j in C.get('junctions', [])]

    def in_poly(pt, poly):
        x, y = pt
        inside = False
        for (ax, ay), (bx, by) in zip(poly, np.roll(poly, -1, axis=0)):
            if (ay > y) != (by > y) and x < ax + (y - ay) * (bx - ax) / (by - ay):
                inside = not inside
        return inside
    real_seg = [math.hypot(b[0] - a[0], b[1] - a[1]) < 2.0 for a, b in zip(coarse, coarse[1:])]
    hits, stray = 0, []
    for i in range(len(coarse) - 1):
        for j in range(i + 3, len(coarse) - 1):
            if real_seg[i] and real_seg[j] and segs_intersect(coarse[i], coarse[i + 1], coarse[j], coarse[j + 1]):
                hits += 1
                mid = ((coarse[i][0] + coarse[i + 1][0]) / 2, (coarse[i][1] + coarse[i + 1][1]) / 2)
                if not any(in_poly(mid, J) for J in junctions):
                    stray.append((round(mid[0], 1), round(mid[1], 1)))
    names = ', '.join(j['id'] for j in C.get('junctions', []))
    record('organised', 'the route crosses itself only at junctions', not stray,
           ('%d crossings, all inside: %s' % (hits, names)) if not stray else 'outside a junction at %s' % stray[:5])

    res = 0.1
    fp = {}
    for st in stations:
        polys = corridor(samples, st['s_from'], st['s_to'])
        for key in ('pocket', 'box'):
            if key in st:
                polys.append(st[key])
        for key in ('legs', 'fillets', 'flares'):
            polys += st.get(key, [])
        fp[st['id']] = polygon_mask(polys, bounds, res)
    ids = [s['id'] for s in stations]
    overlap = [(a, b) for i, a in enumerate(ids) for b in ids[i + 1:] if (fp[a] & fp[b]).any()]
    record('organised', 'no two stations overlap', not overlap, overlap or 'none overlap')
    # every route sample inside another station's footprint, away from that station's own ends
    trespass = {}
    for q in samples[::2]:
        s, x, y = q[0], q[1], q[2]
        ix, iy = int((x - bounds[0]) / res), int((y - bounds[1]) / res)
        for st in stations:
            if st['s_from'] - 1.0 <= s <= st['s_to'] + 1.0:
                continue
            if fp[st['id']][iy, ix]:
                trespass.setdefault(st['id'], []).append(round(s, 1))
    record('organised', 'the route enters each station only on its turn', not trespass,
           {k: '%d samples, s %.0f-%.0f' % (len(v), v[0], v[-1]) for k, v in trespass.items()} or 'never')
    gaps = []
    for i, a in enumerate(ids):
        da = ndi.distance_transform_edt(~fp[a]) * res
        for b in ids[i + 1:]:
            gaps.append((round(float(da[fp[b]].min()), 2), a, b))
    gaps.sort()
    span = (bounds[2] - bounds[0], bounds[3] - bounds[1])
    mini = min(400 / span[0], 200 / span[1])
    record('organised', 'stations stay apart on the 400 x 200 px map', gaps[0][0] * mini >= 3.0,
           'closest pair %s / %s: %.1f m = %.1f px at %.2f px/m' % (gaps[0][1], gaps[0][2], gaps[0][0], gaps[0][0] * mini, mini))
    narrow = min(q[4] for q in samples)
    record('organised', 'the narrowest lane is visible on the map', narrow * mini >= 6.0,
           '%.2f m = %.1f px' % (narrow, narrow * mini))

    # ---------------------------------------------------------------- 2 Real
    print('\n2 REAL (never narrower than the real station, within the photo\'s +/-5% scale)')
    prm = {k: v['value'] for k, v in C['parameters'].items()}

    def not_narrower(name, ours, real, label):
        record('real', name, ours >= real * (1 - SCALE_TOL), '%s: ours %.2f m, real %.2f m' % (label, ours, real))

    def built_width(tag):
        ws = []
        for q0, q1, q2 in zip(samples, samples[1:], samples[2:]):
            if q1[5] != tag:
                continue
            if abs((q2[3] - q0[3] + 180) % 360 - 180) > 0.5:
                continue                      # skip the corners: measure the straight legs
            ws.append(2 * float(world.clearance([(q1[1], q1[2])])))
        return float(np.median(ws)) if ws else 0.0
    s_built = 2 * float(np.median([world.clearance([(q[1], q[2])]) for q in samples if q[5] == 's-curve']))
    record('real', 'S lane, as built, matches the real one',
           REAL['s_lane'][0] * (1 - SCALE_TOL) <= s_built <= REAL['s_lane'][1] * (1 + SCALE_TOL),
           'built %.2f m kerb to kerb (median along the lane); real %.2f-%.2f m' % (s_built, REAL['s_lane'][0], REAL['s_lane'][1]))
    record('real', 'S shape matches the real bends', abs(prm['s_turn'] - REAL['s_bend'][0]) <= 5 and
           abs(prm['s_r'] - REAL['s_bend'][1]) <= REAL['s_bend'][1] * SCALE_TOL,
           'ours %.0f deg at %.1f m; real %.0f deg at %.1f m' % (prm['s_turn'], prm['s_r'], REAL['s_bend'][0], REAL['s_bend'][1]))
    z_built = built_width('z-curve')
    record('real', 'Z lane, as built, matches the real one', z_built >= REAL['z_lane'][0] * (1 - SCALE_TOL),
           'built %.2f m on the straight legs; real %.1f-%.1f m' % (z_built, REAL['z_lane'][0], REAL['z_lane'][1]))
    record('real', 'Z jog matches the real one', abs(prm['z_jog'] - REAL['z_jog'][0]) <= REAL['z_jog'][0] * SCALE_TOL,
           'ours %.2f m, real %.1f m' % (prm['z_jog'], REAL['z_jog'][0]))
    tpt_c = np.array([st_ for st_ in stations if st_['id'] == 'three-point-turn'][0]['box']).mean(0)
    tpt_built = 2 * float(world.clearance([tuple(tpt_c)]))
    record('real', 'three-point-turn lane, as built, not narrower than the real one', tpt_built >= REAL['tpt_road'][0] * (1 - SCALE_TOL),
           'built %.2f m across the middle of the turning box (5 cm grid); real %.2f m' % (tpt_built, REAL['tpt_road'][0]))
    hill_len = 2 * prm['hill_up'] + prm['hill_top']
    record('real', 'hill strip matches the real one', abs(hill_len - REAL['hill'][0]) <= REAL['hill'][0] * SCALE_TOL
           and prm['hill_w'] >= REAL['hill'][1] * (1 - SCALE_TOL),
           'ours %.2f x %.1f m, real %.1f x %.1f m' % (hill_len, prm['hill_w'], REAL['hill'][0], REAL['hill'][1]))
    record('real', 'parallel recess not smaller than the real one', prm['par_slot_l'] >= REAL['parallel'][0] * (1 - SCALE_TOL)
           and prm['par_slot_w'] >= REAL['parallel'][1] * (1 - SCALE_TOL),
           'ours %.2f x %.2f m, real %.2f x %.2f m' % (prm['par_slot_l'], prm['par_slot_w'], REAL['parallel'][0], REAL['parallel'][1]))
    record('real', 'side-parking pocket not smaller than the real one', prm['side_pocket_l'] >= REAL['side_pocket'][0] * (1 - SCALE_TOL)
           and prm['side_pocket_d'] >= REAL['side_pocket'][1] * (1 - SCALE_TOL),
           'ours %.2f x %.2f m, real %.2f x %.2f m' % (prm['side_pocket_l'], prm['side_pocket_d'], REAL['side_pocket'][0], REAL['side_pocket'][1]))

    # ---------------------------------------------------------------- 3 Roomy
    print('\n3 ROOMY (the car driven through the whole route by a pure-pursuit driver)')
    pieces, cur = [], [samples[0]]
    for a_, b_ in zip(samples, samples[1:]):
        if math.hypot(b_[1] - a_[1], b_[2] - a_[2]) > 1.0:
            pieces.append(cur)
            cur = []
        cur.append(b_)
    pieces.append(cur)
    rec, ends = [], []
    for piece in pieces:
        if len(piece) < 3:
            continue
        r = follow(car, world, [(q[1], q[2]) for q in piece], lookahead=2.2, ds=0.05, kerb_h=kerb_h,
                   start=(piece[0][1], piece[0][2], math.radians(piece[0][3])))
        rec += [(t_[0] + piece[0][0],) + tuple(t_[1:]) for t_ in r]
        ends.append((r[-1][0] + piece[0][0] if r else piece[0][0], piece[-1][0]))
    tags = {}
    for q in samples:
        tags.setdefault(q[5], []).append(q[0])
    worst = {}
    for s, x, y, th, delta, xte, body, tyre, obst in rec:
        i = int(np.clip(np.searchsorted(S, s), 0, len(S) - 1))
        tag = samples[i][5]
        w = worst.setdefault(tag, dict(body=9e9, tyre=9e9, xte=0.0, at=None))
        if tyre < w['tyre']:
            w['tyre'], w['at'] = tyre, round(s, 1)
        w['body'] = min(w['body'], body)
        w['xte'] = max(w['xte'], xte)
    short = [(round(a_, 1), round(b_, 1)) for a_, b_ in ends if a_ < b_ - 1.0]
    record('roomy', 'the driver reaches the end of every driven piece', not short,
           ('%d pieces between manoeuvres, %.0f m of route' % (len(ends), S[-1])) if not short else 'stopped short: %s' % short)
    for tag, w in worst.items():
        need = 0.5 if tag in ('link', 'exit-road') else 0.10      # links: comfortable; stations: no kerb touched
        record('roomy', 'clearance: %s' % tag, w['tyre'] >= need,
               'tyres %.2f m (need >= %.2f), body %.2f m, worst at s = %s' % (w['tyre'], need, w['body'], w['at']))

    # ---------------------------------------------------------------- 4 Possible
    print('\n4 POSSIBLE (each exercise done with this car exactly as the PRD rules define it)')
    by = {s['id']: s for s in stations}
    # three-point turn: start inside the turning box, kept to the left kerb (traffic keeps left);
    # the first movement turns right, across the lane towards its far kerb
    box = np.array(by['three-point-turn']['box'])
    road_side = box[0]
    far_side = box[3]
    into = far_side - road_side
    into /= np.linalg.norm(into)
    across = box[1] - box[0]
    width = np.linalg.norm(across)
    across /= np.linalg.norm(across)
    heading = math.atan2(into[1], into[0])
    left = np.array([-math.sin(heading), math.cos(heading)])
    edge_left = box[0] if np.dot(box[0] - box.mean(0), left) > 0 else box[1]
    start_xy = (edge_left + into * (car.r_oh + 4.0) - left * (0.30 + car.track / 2 + car.tyre_w / 2))
    for crit in ('tyre', 'body'):
        ok3, h3 = three_point(car, world, (start_xy[0], start_xy[1], heading), turn=-1, crit=crit, moves=3)
        ok1, h1 = three_point(car, world, (start_xy[0], start_xy[1], heading), turn=-1, crit=crit, moves=1)
        record('possible', '3-point turn in three movements (%s)' % crit, ok3, 'heading change after each: %s' % h3)
        record('possible', '3-point turn NOT possible in one arc (%s)' % crit, not ok1, 'one arc reaches %.0f deg (needs 148)' % h1[0][0])
    record('possible', '3-point road width inside the 3-move window', 6.0 <= width <= 9.5,
           '%.2f m (window for this car: 6.0-9.5 m, see AUDIT.md)' % width)

    sp = by['side-parking']
    aisle = math.radians(sp['gates'][0]['heading_deg'])
    lim = math.degrees(car.heading_limit(sp['bay']['width']))
    for crit in ('tyre', 'body'):
        b = reverse_into_bay(car, world, sp['bay'], aisle, crit=crit)
        record('possible', 'side parking: reverse into the bay (%s)' % crit, b is not None,
               ('one full-lock arc then straight back; ends %.1f deg off (limit %.1f deg); poles untouched' % (b[0], lim)) if b
               else 'no single-arc plan found')
    pp = by['parallel-parking']
    slot = dict(centre=pp['bay']['centre'], length=pp['bay']['length'], width=pp['bay']['width'])
    road = math.radians(pp['bay']['axis_deg'])
    lim = math.degrees(car.heading_limit(slot['width']))
    for crit in ('tyre', 'body'):
        b = parallel_into_slot(car, world, slot, road, crit=crit)
        record('possible', 'parallel park: two-arc reverse into the recess (%s)' % crit, b is not None,
               ('plan %s; ends %.1f deg off (limit %.1f deg)' % (b[1], b[0], lim)) if b else 'no two-arc plan found')
    rules = load(RULES)['stations']
    hill = next(s for s in C['slopes'] if s['id'] == 'hill')
    prof = hill['profile']
    grade = prof[1][1] / prof[1][0]
    hs = by['hill-start']
    ramp_from = next(g for g in hs['gates'] if g['id'] == 'stop-line')['s'] - hs['stop_line_height'] / grade
    band = hs['stop_band']
    on_slope = ramp_from < band['s_from'] and band['s_to'] < ramp_from + prof[1][0]
    record('possible', 'hill: the whole stop band sits on the up-slope', on_slope,
           'band s %.1f-%.1f m on an up-slope from s %.1f to %.1f m; %.1f%% (%.1f deg)' % (
               band['s_from'], band['s_to'], ramp_from, ramp_from + prof[1][0], grade * 100, math.degrees(math.atan(grade))))

    # ramp test: drive in from the lane, stop short of the pole, reverse back out into the lane
    rt = by['ramp-test']
    ax, ay = rt['axis']['start']
    ah = math.radians(rt['axis']['heading_deg'])
    ux, uy = math.cos(ah), math.sin(ah)
    px, py = rt['pole']
    pole_r = next(p['radius'] for p in C['obstacles']['poles'] if p['station'] == 'ramp-test')
    lane = [q for q in samples if q[5] == 'ramp-test']
    lane_h = math.radians(lane[0][3])
    lx, ly = math.cos(lane_h), math.sin(lane_h)
    # where the ramp's axis crosses the lane centreline, and how far from it the ramp's mouth is
    t_cross = ((ax - lane[0][1]) * lx + (ay - lane[0][2]) * ly)
    cx, cy = lane[0][1] + lx * t_cross, lane[0][2] + ly * t_cross
    turn_r = 5.0
    path = [(cx - lx * (turn_r + 10.0), cy - ly * (turn_r + 10.0)), (cx - lx * turn_r, cy - ly * turn_r)]
    ccx, ccy = cx - lx * turn_r + ux * turn_r, cy - ly * turn_r + uy * turn_r
    for k in range(1, 19):
        a = k / 18 * math.pi / 2
        path.append((ccx - ux * turn_r * math.cos(a) + lx * turn_r * math.sin(a),
                     ccy - uy * turn_r * math.cos(a) + ly * turn_r * math.sin(a)))
    window = rules['ramp-test']['stop_window_m']
    stop_gap = sum(window) / 2
    d_pole = (px - cx) * ux + (py - cy) * uy
    axle_d = d_pole - pole_r - stop_gap - (car.wb + car.f_oh)
    path.append((cx + ux * axle_d, cy + uy * axle_d))
    rec = follow(car, world, path, lookahead=2.0, ds=0.05, kerb_h=kerb_h)
    tyre = min(r[7] for r in rec)
    obst = min(r[8] for r in rec)
    s_end, x_end, y_end, th_end = rec[-1][:4]
    fx, fy = car.front_centre(x_end, y_end, th_end)
    gap_to_pole = math.hypot(px - fx, py - fy) - pole_r
    record('possible', 'ramp: drive in and up without touching a kerb or the pole', tyre >= 0.10 and obst > 0,
           'tyres %.2f m from the kerbs, body %.2f m from the pole' % (tyre, obst))
    record('possible', 'ramp: the stop window can be reached', window[0] <= gap_to_pole <= window[1],
           'front bumper %.2f m short of the pole (window %.1f-%.1f m)' % (gap_to_pole, *window))

    def in_lane(x, y, th):
        q = min(lane, key=lambda q: (q[1] - x) ** 2 + (q[2] - y) ** 2)
        h = math.radians(q[3])
        lateral = -(x - q[1]) * math.sin(h) + (y - q[2]) * math.cos(h)
        return abs(lateral) <= 1.6
    out = reverse_out(car, world, (x_end, y_end, th_end), lane_h, in_lane)
    record('possible', 'ramp: reverse down and out, ending in the lane facing on', out is not None,
           ('straight back %.1f m, then full %s lock' % (out[0], out[1])) if out else 'no reverse-out plan found')

    mg = by['road-merging']
    min_kmh = rules['road-merging']['min_kmh']
    run = mg['s_to'] - mg['s_from']
    need = (min_kmh / 3.6) ** 2 / (2 * 1.5)
    record('possible', 'merge: room to reach %.0f km/h before the finish' % min_kmh, run >= 2 * need,
           '%.1f m of lane; %.1f m needed at 1.5 m/s^2 (assumed, conservative)' % (run, need))

    bad = []
    for st in stations:
        if 'start' not in st:
            bad.append(st['id'])
            continue
        sx, sy = st['start']['at']
        sh = math.radians(st['start']['heading_deg'])
        if world.clearance(car.tyre_outline(sx, sy, sh, 0.0)) < 0.3:
            bad.append(st['id'])
    record('possible', 'every station has a practice start on the road, clear of kerbs', not bad,
           ('one map, %d start points' % len(stations)) if not bad else 'missing or too close to a kerb: %s' % bad)

    # ---------------------------------------------------------------- 5 Cheap
    print('\n5 CHEAP')
    kerb_len = sum(float(np.hypot(*np.diff(np.asarray(r), axis=0).T).sum()) for r in C['kerbs']['rings'])
    kerb_vertices = sum(len(r) for r in C['kerbs']['rings'])
    size_kb = os.path.getsize(args.circuit) / 1024
    record('cheap', 'flat ground plus two slopes', len(C['slopes']) == 2, '%d slopes' % len(C['slopes']))
    record('cheap', 'kerbs fit in one instanced mesh', kerb_vertices < 20000,
           '%d vertices, %.0f m of kerb (about %d instances at 1 m)' % (kerb_vertices, kerb_len, kerb_len))
    record('cheap', 'circuit data is small', size_kb < 400, '%.0f KB uncompressed' % size_kb)
    props = C['props']
    record('cheap', 'few props', len(props['booths']) + 1 + len(C['obstacles']['poles']) <= 14,
           '%d booths, 1 office, %d poles' % (len(props['booths']), len(C['obstacles']['poles'])))

    print('\n%s: %d checks, %d failed (%.0f s)' % ('PASS' if not failures else 'FAIL', len(results), len(failures), time.time() - t0))
    with open(os.path.join(HERE, 'check_report.json'), 'w', encoding='utf-8') as f:
        json.dump(dict(car=car.name, passed=not failures, failures=failures, results=results), f, indent=1, default=str)
    sys.exit(0 if not failures else 1)


if __name__ == '__main__':
    main()
