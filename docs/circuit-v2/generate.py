"""Generate circuit.json: the DriveMy practice yard, the real ARM Driving Institute yard traced
from the drone photo, with one assessment route through the eight stations in test order.

Run:  python docs/circuit-v2/generate.py
Then: python docs/circuit-v2/check.py      (proves the claims from circuit.json alone)
      python docs/circuit-v2/render.py     (draws the plan, the minimap and the photo overlay)

Frame: metres, x = east, y = north, z = up. In three.js (y-up) use  X = x,  Y = z,  Z = -y.
Trace: bar/circuit/reference_aerial_grid.png at 0.0943 m/px (+/-5%). Photo pixel (px, py) maps to
x = px * 0.0943, y = (750 - py) * 0.0943; the yard's south edge sits near py 748, just below the
photo. The pixel outlines and how they were read are in YARD-TRACE.md.

Every number carries its source:
  photo    measured off the drone photo (scale +/-5%)
  prd      taken from the PRD (docs/circuit-v2/prd-excerpt.md)
  car      derived from the car config (car-swift-2022.json)
  design   a layout choice: where the route runs, turn radii
  decided  decided on 14 Oct 2026 with no public source (see ../v2-plan/RULES.md)
"""
import json
import math
import os

import contourpy
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

import traffic_gen
from lib_geom import HERE, World

PX = 0.0943                     # metres per photo pixel


def M(px, py):
    """Photo pixel to metres."""
    return (px * PX, (750.0 - py) * PX)


P = {
    'photo_scale':   (PX,    'photo',   'Metres per pixel of bar/circuit/reference_aerial_grid.png (120 m across, +/-5%)'),
    'kerb_h':        (0.13,  'prd',     'Kerb height (PRD, v1 value)'),
    'kerb_w':        (0.20,  'design',  'Kerb width; the kerb sits outside the pavement edge'),
    'wall_w':        (0.25,  'design',  'Kerbed wall along the sides of the hill and the ramp'),
    'corner_r':      (0.5,   'photo',   'Island corners are rounded about 0.5 m; the Z inner corners about 1 m'),
    'turn_r':        (3.6,   'car',     'Route turn radius (the Swift turns at 3.43 m at full lock)'),
    'hill_w':        (4.5,   'photo',   'Hill strip, kerb to kerb (real strip 26.6 x 4.6 m)'),
    'hill_up':       (10.8,  'prd',     'Up-slope length'),
    'hill_top':      (4.15,  'prd',     'Flat top: 25.75 total - 2 x 10.8 (PRD hill length)'),
    'hill_rise':     (1.3,   'decided', 'Rise 1.3 m, 12.0% (v1 value, kept on 14 Oct: no public JPJ gradient found)'),
    'hill_stop':     (0.33,  'decided', 'Yellow stop band at 33% of the rise'),
    'hill_band':     (0.6,   'decided', 'Yellow stop band along the slope; the front wheels must stop on it (guides: front tyre on the yellow line)'),
    'side_pocket_l': (4.72,  'photo',   'Side-parking pocket in the bottom-left island, along the band'),
    'side_pocket_d': (5.78,  'photo',   'Pocket depth from the band'),
    'side_band_w':   (4.58,  'photo',   'The band the pocket opens onto (the aisle)'),
    'side_bay_w':    (2.6,   'decided', 'Painted bay width (v1 layout, kept on 14 Oct)'),
    'side_bay_l':    (5.6,   'decided', 'Painted bay length (v1 layout, kept on 14 Oct)'),
    'pole_out':      (0.3,   'decided', 'Poles at the four bay corners, 0.3 m outside the lines (guides: touching a pole fails)'),
    'par_slot_l':    (6.60,  'photo',   'Parallel recess in the top-left island, along lane A-B'),
    'par_slot_w':    (3.77,  'photo',   'Parallel recess depth'),
    'par_box_w':     (2.5,   'decided', 'Painted parking box inside the recess, against its kerb, 6.6 x 2.5 m (v1 value, kept on 14 Oct)'),
    'tpt_w':         (7.64,  'photo',   'Three-point-turn lane: the real lane beside the Z, decided on 14 Oct to be the three-point-turn lane; inside the car-derived 6.0-9.5 m window'),
    's_w':           (3.6,   'photo',   'S lane, kerb to kerb (real p10-p90 3.35-3.76 m, median 3.6 m)'),
    's_r':           (7.5,   'photo',   'S centreline radius (real median 7.5 m and 7.1 m)'),
    's_turn':        (141.0, 'photo',   'Each S bend turns 141 deg (real: +141 then -141)'),
    'z_w':           (4.0,   'photo',   'Z lane, kerb to kerb (real 3.9-4.0 m)'),
    'z_jog':         (7.73,  'photo',   'Z middle leg, lane centre to lane centre (real 7.7 m)'),
    'z_fillet':      (1.0,   'photo',   'Z inner corners rounded about 1 m; outer corners square'),
    'z_rc':          (3.6,   'car',     'Route centreline radius through each Z corner (>= full-lock 3.43 m)'),
    'ramp_w':        (4.0,   'decided', 'Ramp width, wall to wall'),
    'ramp_mouth':    (3.0,   'decided', 'Flat run-in from the lane to the foot of the slope'),
    'ramp_up':       (6.0,   'decided', 'Up-slope length'),
    'ramp_rise':     (0.6,   'decided', 'Platform height: a 10% slope up onto a raised block (a DA learner: naik atas batu simen)'),
    'ramp_top':      (7.0,   'decided', 'Platform length to the end wall'),
    'ramp_pole_in':  (0.4,   'decided', 'The pole stands on the centreline this far before the end wall (a DA learner: one pole in the middle)'),
    'ramp_site':     ('top-right floor', 'decided', 'The real yard has no ramp; the blueprint draws a structure on the open top-right floor, so the ramp stands there, in line with the hill'),
}


def v(key):
    return P[key][0]


# ---------------------------------------------------------------- the traced yard (photo pixels)

BOUNDARY_PX = (
    [(318, 28), (1224, 28), (1224, 748), (99, 748), (99, 660)]
    + [(-20.7 + 118 * math.cos(math.radians(a)), 675.2 + 118 * math.sin(math.radians(a)))
       for a in np.linspace(-7.2, -39.5, 8)]
    + [(165.5 + 153.3 * math.cos(math.radians(a)), 479.1 + 153.3 * math.sin(math.radians(a)))
       for a in np.linspace(127.9, 221.9, 24)]
    + [(73, 363), (103, 333), (120.5, 303), (120.5, 153), (128, 148), (143, 118), (168, 93), (208, 73), (263, 48)]
)

ISLANDS_PX = {
    'A': [(213, 204), (393, 204), (393, 329), (353, 329), (353, 399), (393, 399), (393, 439), (308, 439),
          (299, 426.5), (276.5, 404), (251.5, 379), (226.5, 354), (216.5, 344), (209, 331.5), (202.75, 316.5),
          (200.5, 301), (200.5, 218)],
    'B': [(468, 203), (518, 203), (518, 438), (468, 438), (468, 313), (501.5, 313), (501.5, 244.5), (468, 244.5)],
    'C': [(591.5, 204), (628, 204), (628, 437), (591.5, 437)],
    'D': [(704, 203), (750.5, 203), (750.5, 329), (719, 329), (719, 399), (750.5, 399), (750.5, 437), (704, 437)],
    'E': [(833, 202), (878, 202), (878, 437), (829, 437), (829, 312), (865.5, 312), (865.5, 243), (833, 243)],
    'F': [(955.5, 202), (1155.5, 202), (1155.5, 438), (1039, 438), (1039, 382), (1100.5, 382), (1100.5, 332),
          (1044, 332), (1044, 273), (994, 273), (994, 438), (955.5, 438)],
    'G': [(310.5, 522), (380.5, 522), (380.5, 627), (317.75, 627), (317.75, 565.25), (267.75, 565.25),
          (267.75, 626.5), (207.75, 626.5), (207.75, 675), (373, 675), (373, 686), (183, 686), (180.25, 656.5),
          (184, 649), (191.5, 639), (200.25, 626.5), (209, 616.5), (219, 606.5), (231.5, 596.5), (244, 584),
          (256.5, 571.5), (269, 557.75), (279, 546.5), (290, 538), (300, 530)],
    'Z-block': [(457, 518), (618, 518), (618, 688), (457, 688)],       # the Z lanes are carved out of it
    'S-block': [(699, 519), (1149, 519), (1149, 683), (699, 683)],     # the S lane is carved out of it
}
ROUNDABOUT_PX = ((152.9, 478.8), 65.8)


def densify(pts, step=3.0):
    """Points every `step` along a closed ring, so smoothing only rounds corners locally."""
    out = []
    for (ax, ay), (bx, by) in zip(pts, pts[1:] + pts[:1]):
        n = max(1, int(math.hypot(bx - ax, by - ay) // step))
        out += [(ax + (bx - ax) * k / n, ay + (by - ay) * k / n) for k in range(n)]
    return out


def chaikin(pts, n=2):
    """Corner-cutting smoothing of a closed ring."""
    p = np.asarray(pts, float)
    for _ in range(n):
        q = np.roll(p, -1, axis=0)
        p = np.vstack([np.c_[0.75 * p[:, 0] + 0.25 * q[:, 0], 0.75 * p[:, 1] + 0.25 * q[:, 1]],
                       np.c_[0.25 * p[:, 0] + 0.75 * q[:, 0], 0.25 * p[:, 1] + 0.75 * q[:, 1]]]
                      ).reshape(2, -1, 2).transpose(1, 0, 2).reshape(-1, 2)
    return [tuple(r) for r in p]


def to_m(pts_px):
    return [M(px, py) for px, py in pts_px]


# ---------------------------------------------------------------- the route

class Turtle:
    """Builds the route centreline as samples (s, x, y, heading, width, tag)."""

    def __init__(self, x, y, h_deg, w, ds=0.25):
        self.x, self.y, self.h = x, y, math.radians(h_deg)
        self.s, self.ds = 0.0, ds
        self.pts = [(0.0, x, y, self.h, w, 'link')]
        self.marks = {}
        self.jumps = []

    def mark(self, name):
        self.marks[name] = dict(s=self.s, x=self.x, y=self.y, h=self.h)
        return self.marks[name]

    def _emit(self, w, tag):
        self.pts.append((self.s, self.x, self.y, self.h, w, tag))

    def line(self, length, w, tag='link'):
        n = max(1, int(round(length / self.ds)))
        for i in range(1, n + 1):
            self.x += math.cos(self.h) * length / n
            self.y += math.sin(self.h) * length / n
            self.s += length / n
            self._emit(w, tag)

    def line_to(self, target, w, tag='link'):
        """Straight on to a coordinate: x when heading east/west, y when heading north/south."""
        c, s = math.cos(self.h), math.sin(self.h)
        if abs(c) > 0.99:
            d = (target - self.x) / c
        elif abs(s) > 0.99:
            d = (target - self.y) / s
        else:
            raise ValueError('line_to needs an axis-aligned heading')
        if d < -1e-6:
            raise ValueError('line_to would drive backwards (%.2f m)' % d)
        if d > 1e-6:
            self.line(d, w, tag)

    def arc(self, r, deg, w, tag='link'):
        ang = math.radians(deg)
        length = abs(ang) * r
        n = max(2, int(round(length / self.ds)))
        sign = 1 if ang > 0 else -1
        cx = self.x - sign * r * math.sin(self.h)
        cy = self.y + sign * r * math.cos(self.h)
        for _ in range(n):
            self.h += ang / n
            self.x = cx + sign * r * math.sin(self.h)
            self.y = cy - sign * r * math.cos(self.h)
            self.s += length / n
            self._emit(w, tag)

    def shift(self, d, length, w, tag='link'):
        """Move sideways by d metres (+ = left) over `length`, as two opposite arcs; the heading ends as it began."""
        r = (length ** 2 + d ** 2) / (4 * abs(d))
        deg = math.degrees(math.asin(length / 2 / r)) * (1 if d > 0 else -1)
        self.arc(r, deg, w, tag)
        self.arc(r, -deg, w, tag)

    def jump(self, x, y, h_deg, w, tag, station, note):
        """A manoeuvre the route line cannot draw (reversing, turning on the spot): the next sample
        starts where the manoeuvre ends. s advances by the straight distance between the two."""
        s0 = self.s
        self.s += math.hypot(x - self.x, y - self.y)
        self.x, self.y, self.h = x, y, math.radians(h_deg)
        self.jumps.append(dict(station=station, s_from=round(s0, 2), s_to=round(self.s, 2), note=note))
        self._emit(w, tag)


def corridor_polys(pts, s0, s1):
    polys = []
    for (sa, xa, ya, ha, wa, _), (sb, xb, yb, hb, wb, _) in zip(pts, pts[1:]):
        if sb < s0 or sa > s1 or math.hypot(xb - xa, yb - ya) > 1.0:
            continue
        na, nb = (-math.sin(ha), math.cos(ha)), (-math.sin(hb), math.cos(hb))
        polys.append([(xa + na[0] * wa / 2, ya + na[1] * wa / 2), (xb + nb[0] * wb / 2, yb + nb[1] * wb / 2),
                      (xb - nb[0] * wb / 2, yb - nb[1] * wb / 2), (xa - na[0] * wa / 2, ya - na[1] * wa / 2)])
    return polys


# The yard's roads, as the map shows them: (axis, approximate middle, from, to), metres. 'ew' runs east-west
# at y = middle; 'ns' runs north-south at x = middle. lane_centres refines each from the kerbs.
ROADS = [
    ('ew', 25.6, 36.0, 111.0),     # the spine road, through the middle
    ('ew', 55.5, 36.0, 91.0),      # the top road, under the hill; the twin ramp takes its east end
    ('ew', 3.0, 46.0, 110.0),      # the bottom road
    ('ns', 40.3, 3.0, 57.0),       # the west road
    ('ns', 52.3, 27.0, 54.0),      # the lanes between the upper islands, west to east
    ('ns', 62.7, 27.0, 54.0),
    ('ns', 74.5, 27.0, 54.0),
    ('ns', 86.3, 27.0, 54.0),
    ('ns', 112.3, 2.0, 57.0),      # the east road
    ('ns', 62.1, 4.0, 22.0),       # the lane between the Z and S blocks (the three-point turn's until 20 Oct)
]


def lane_centres(world, keep_out, min_w=6.0, max_w=10.5, step=0.25):
    """Centre lines on the two-way roads (the owner, 20 Oct; unbroken, JKR 4.1.2.2): a lane each way, keeping left of the
    line. Each road in ROADS gets its middle and width refined from the kerbs, section by section between the
    roads that cross it: the islands either side of a junction need not line up (the west road's middle moves
    1.2 m across the spine road). A section's middle is the median of its midpoints, ignoring side-road
    openings and island notches (a width far from the section's own). A road narrower than min_w stays one-way
    and unmarked. Each line breaks where it crosses another road (a junction), off the pavement, and inside
    `keep_out` (the stations, one car at a time). Returns ([polyline, ...], [road, ...]); each road carries its
    `sections` as (from, to, middle, width)."""
    res = world.res
    paved = lambda x, y: (0 <= int((y - world.y0) / res) < world.mask.shape[0] and 0 <= int((x - world.x0) / res) < world.mask.shape[1]
                          and world.mask[int((y - world.y0) / res), int((x - world.x0) / res)])

    def reach(x, y, dx, dy):
        k = 0
        while k * res < max_w and paved(x + dx * k * res, y + dy * k * res):
            k += 1
        return k * res

    def profile(axis, mid, a0, a1):
        """(along, middle, width) every 0.5 m where the road is a road: not an opening or the open apron."""
        out = []
        for t in np.arange(a0, a1, 0.5):
            x, y = (t, mid) if axis == 'ew' else (mid, t)
            if not paved(x, y):
                continue
            dx, dy = (0.0, 1.0) if axis == 'ew' else (1.0, 0.0)
            hi, lo = reach(x, y, dx, dy), reach(x, y, -dx, -dy)
            if hi + lo < max_w:
                out.append((float(t), mid + (hi - lo) / 2, hi + lo))
        return out

    roads = []
    for axis, mid, a0, a1 in ROADS:
        prof = profile(axis, mid, a0, a1)
        if len(prof) < 8:
            continue
        roads.append(dict(axis=axis, mid=float(np.median([m for _, m, _ in prof])), width=float(np.median([w for _, _, w in prof])),
                          a0=a0, a1=a1, prof=prof))
    two_way = [r for r in roads if r['width'] >= min_w]

    def inside_other(x, y, me):
        for r in two_way:
            if r is me:
                continue
            across, along = (y, x) if r['axis'] == 'ew' else (x, y)
            if abs(across - r['mid']) <= r['width'] / 2 + 0.5 and r['a0'] <= along <= r['a1']:
                return True
        return False

    for r in roads:                                   # sections: the runs between the roads that cross this one
        r['sections'] = []
        run = []
        for t in list(np.arange(r['a0'], r['a1'], 0.5)) + [None]:
            if t is not None:
                x, y = (t, r['mid']) if r['axis'] == 'ew' else (r['mid'], t)
            if t is None or inside_other(x, y, r):
                rows = [p for p in r['prof'] if run and run[0] <= p[0] <= run[-1]]
                if len(rows) >= 4:
                    w = float(np.median([q[2] for q in rows]))
                    good = [q for q in rows if abs(q[2] - w) <= 0.6]
                    r['sections'].append((run[0], run[-1], float(np.median([q[1] for q in good])), w))
                run = []
            else:
                run.append(float(t))
        del r['prof']

    def middle(r, t):
        for a, b, m, _ in r['sections']:
            if a - 0.25 <= t <= b + 0.25:
                return m
        return None

    lines = []
    for r in two_way:
        cur = []
        for t in np.arange(r['a0'], r['a1'] + step / 2, step):
            m = middle(r, t)
            x, y = ((t, m) if r['axis'] == 'ew' else (m, t)) if m is not None else (0.0, 0.0)
            ok = (m is not None and paved(x, y) and not keep_out[int((y - world.y0) / res), int((x - world.x0) / res)]
                  and not inside_other(x, y, r))
            if ok and cur and abs((cur[-1][1] if r['axis'] == 'ew' else cur[-1][0]) - m) > 1e-6:
                ok = False                            # a new section: a new line
            if ok:
                cur.append([float(x), float(y)])
            if (not ok or t >= r['a1']) and cur:
                if math.hypot(cur[-1][0] - cur[0][0], cur[-1][1] - cur[0][1]) >= 4.0:
                    lines.append([cur[0], cur[-1]])
                cur = [[float(x), float(y)]] if ok else []
    return lines, roads


def break_lines(lines, paths, boxes=(), half=5.0, min_len=1.5):
    """A gap wherever a driven path crosses a centre line: across the whole mouth of the junction it crosses in (its
    box, plus a metre), or `half` metres either side of a crossing outside any junction. The main road's line
    otherwise runs on past a side road, as it does on a real road."""
    out = []
    for a, b in lines:
        ln = math.hypot(b[0] - a[0], b[1] - a[1])
        ux, uy = (b[0] - a[0]) / ln, (b[1] - a[1]) / ln
        cuts = []
        for path in paths:
            for p, q in zip(path, path[1:]):
                dx, dy = q[0] - p[0], q[1] - p[1]
                if math.hypot(dx, dy) > 1.0:                  # a manoeuvre's break in the line
                    continue
                det = dx * uy - ux * dy                      # solve a + u t = p + d k for t (metres) and k (0..1)
                if abs(det) < 1e-9:
                    continue
                rx, ry = p[0] - a[0], p[1] - a[1]
                t_line = (dx * ry - dy * rx) / det
                t_path = (ux * ry - uy * rx) / det
                if -half <= t_line <= ln + half and 0.0 <= t_path <= 1.0:
                    cx, cy = a[0] + ux * t_line, a[1] + uy * t_line
                    box = next((bx for bx in boxes if min(q[0] for q in bx) <= cx <= max(q[0] for q in bx)
                                and min(q[1] for q in bx) <= cy <= max(q[1] for q in bx)), None)
                    if box is None:
                        cuts.append((t_line - half, t_line + half))
                    else:                                      # the box's extent along this line
                        ts = [(q[0] - a[0]) * ux + (q[1] - a[1]) * uy for q in box]
                        cuts.append((min(ts) - 1.0, max(ts) + 1.0))
        keep, t0 = [], 0.0
        for c0, c1 in sorted(cuts):
            if c0 > t0:
                keep.append((t0, min(c0, ln)))
            t0 = max(t0, c1)
        if t0 < ln:
            keep.append((t0, ln))
        out += [[[a[0] + ux * k0, a[1] + uy * k0], [a[0] + ux * k1, a[1] + uy * k1]] for k0, k1 in keep if k1 - k0 >= min_len]
    return out


def cut_box(lines, box, pad):
    """Remove what lies within `pad` metres of a rectangle from axis-aligned two-point lines."""
    xs, ys = [p[0] for p in box], [p[1] for p in box]
    x0, x1, y0, y1 = min(xs) - pad, max(xs) + pad, min(ys) - pad, max(ys) + pad
    out = []
    for a, b in lines:
        ew = abs(a[1] - b[1]) < 1e-6
        lo, hi = sorted((a[0], b[0])) if ew else sorted((a[1], b[1]))
        across = a[1] if ew else a[0]
        c0, c1 = (x0, x1) if ew else (y0, y1)
        if not ((y0 <= across <= y1) if ew else (x0 <= across <= x1)) or c1 <= lo or c0 >= hi:
            out.append([a, b])
            continue
        for p0, p1 in ((lo, min(c0, hi)), (max(c1, lo), hi)):
            if p1 - p0 >= 4.0:
                out.append([[p0, across], [p1, across]] if ew else [[across, p0], [across, p1]])
    return out


def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def quarter_fillet(cx, cy, su, sv, r, n=16):
    """Pavement rounding an island's convex corner at (cx, cy); the island lies towards (su, sv)."""
    ccx, ccy = cx + su * r, cy + sv * r          # centre of the rounding arc, inside the island
    pts = [(cx, cy), (cx + su * r, cy)]
    for k in range(n + 1):
        a = k / n * math.pi / 2
        pts.append((ccx - su * r * math.sin(a), ccy - sv * r * math.cos(a)))
    pts.append((cx, cy + sv * r))
    return pts


def gate(pts, s, w_pad=0.3, gid=''):
    S = np.array([p[0] for p in pts])
    i = int(np.clip(np.searchsorted(S, s), 0, len(S) - 1))
    _, x, y, h, w, _ = pts[i]
    n = (-math.sin(h), math.cos(h))
    half = w / 2 + w_pad
    return dict(id=gid, s=round(float(S[i]), 2), a=[round(x + n[0] * half, 3), round(y + n[1] * half, 3)],
                b=[round(x - n[0] * half, 3), round(y - n[1] * half, 3)], heading_deg=round(math.degrees(h) % 360, 2))


def pose_at(pts, s):
    S = np.array([p[0] for p in pts])
    i = int(np.clip(np.searchsorted(S, s), 0, len(S) - 1))
    return dict(at=[round(pts[i][1], 3), round(pts[i][2], 3)], heading_deg=round(math.degrees(pts[i][3]) % 360, 2))


def build_route(L):
    """The assessment route. L holds the lane lines in metres (see main)."""
    R = v('turn_r')
    t = Turtle(L['spawn_x'], L['hill_y'], 0.0, 8.0)
    # 1 Hill start: east over the strip at the top of the yard
    t.line_to(L['hill_x0'] - 4.0, 8.0)
    t.mark('hill_in')
    t.line_to(L['hill_x0'], v('hill_w'), 'hill-start')
    t.mark('hill_ramp_a')
    t.line(2 * v('hill_up') + v('hill_top'), v('hill_w'), 'hill-start')
    t.mark('hill_ramp_b')
    t.line(1.0, v('hill_w'), 'hill-start')
    t.mark('hill_out')
    # to 2: right down lane D-E (keeping left), right along the spine road, left down lane G-8
    t.arc(R, -90, 7.8)
    t.line_to(L['spine_wb'] + R, 7.4)
    t.arc(R, -90, 7.4)
    t.line_to(L['g8_sb'] + R, 7.7)
    t.arc(R, 90, 7.7)
    t.line_to(L['band_y'] + R, 7.2)
    t.arc(R, -90, 7.2)
    t.line_to(L['band_mouth_x'], 7.2)
    # 2 Side parking: west into the band past the pocket, reverse in, drive out east
    t.mark('side_in')
    t.line_to(L['side_stop_x'], v('side_band_w'), 'side-parking')
    t.mark('side_stop')
    t.jump(L['pocket_x'], L['pocket_park_y'], 270, v('side_band_w'), 'side-parking', 'side-parking',
           'reverse into the bay, then drive out forward')
    t.line_to(L['band_y'] + R, v('side_band_w'), 'side-parking')
    t.arc(R, 90, v('side_band_w'), 'side-parking')
    t.line_to(L['g8_nb'] - R, v('side_band_w'), 'side-parking')
    t.mark('side_out')
    t.arc(R, 90, 7.2)
    # 3 Parallel park: north up lane A-B past the recess on the left
    t.line_to(L['spine_s'] + 0.3, 7.2)
    t.shift(L['g8_nb'] - L['par_lane'], 6.6, 7.2)              # the north section's lane is further east
    t.line_to(L['spine_top'], 7.2)
    t.mark('par_in')
    t.line_to(L['par_out_y'], 7.07, 'parallel-parking')
    t.mark('par_out')
    # to 4 (the owner, 20 Oct: no three-point turn; its lane is an ordinary road): right along the top road, right
    # down lane C-D, left into the spine road's eastbound lane, then right into the S
    t.line_to(L['top_eb'] - R, 7.07)
    t.arc(R, -90, 7.8)
    t.line_to(L['cd_sb'] - R, 7.8)
    t.arc(R, -90, 7.8)
    t.line_to(L['spine_eb'] + R, 7.17)
    t.arc(R, 90, 7.7)
    t.line_to(L['s_x'] - R, 7.7)
    t.arc(R, -90, 7.7)
    t.line_to(L['s_top'] + 0.5, 7.7)
    t.mark('s_in')
    t.line_to(L['s_top'] - 3.0, v('s_w'), 's-curve')
    t.mark('s_a')
    t.arc(v('s_r'), v('s_turn'), v('s_w'), 's-curve')
    t.mark('s_mid')
    t.arc(v('s_r'), -v('s_turn'), v('s_w'), 's-curve')
    t.mark('s_b')
    t.line_to(L['s_bottom'], v('s_w'), 's-curve')
    t.mark('s_out')
    # to 5: right along the bottom lane, right into the Z's south end
    t.arc(L['s_bottom'] - L['bottom_turn'], -90, 6.0)          # one arc from the S's mouth, its outer tyres 0.5 m off the edge,
    t.shift(L['bottom_turn'] - L['bottom_wb'], 5.0, 6.0)       # then into the westbound lane's middle
    t.line_to(L['z_x0'] + 4.5, 6.0)
    # 5 Z-curve, driven north: in from the bottom lane, right, then left
    t.mark('z_in')
    t.arc(4.5, -90, v('z_w'), 'z-curve')
    rc = v('z_rc')
    t.line_to(L['z_jog_y'] - rc, v('z_w'), 'z-curve')
    t.arc(rc, -90, v('z_w'), 'z-curve')
    t.mark('z_c1')
    t.line_to(L['z_x1'] - rc, v('z_w'), 'z-curve')
    t.arc(rc, 90, v('z_w'), 'z-curve')
    t.mark('z_c2')
    t.line_to(L['z_top'], v('z_w'), 'z-curve')
    t.mark('z_out')
    # to 6: right along the spine road, left up lane E-F
    t.line_to(L['spine_eb'] - R, 7.7)
    t.arc(R, -90, 7.7)
    t.line_to(L['ef_nb'] - R, 7.7)
    t.arc(R, 90, 7.7)
    t.line_to(L['islands_top'], 7.3)
    # 6 Ramp test: past the ramp's mouth on the right; drive in, stop, reverse out, carry on north
    t.mark('ramp_in')
    t.line_to(L['ramp_out_y'], 8.0, 'ramp-test')
    t.mark('ramp_out')
    # to 7: right along the top lane, right down the east road, right along the spine road to the roundabout
    t.arc(R, -90, 4.1)
    t.line_to(L['east_sb'] - R, 4.1)
    t.arc(R, -90, 6.4)
    t.shift(0.3, 6.0, 6.4)                                     # into the southbound lane's middle, clear of its centre line
    t.line_to(L['spine_wb'] + L['rb_turn_r'], 6.4)
    t.arc(L['rb_turn_r'], -90, 7.4)
    t.line_to(L['merge_in_x'], 7.4)
    # 7 Road merging (the owner, 20 Oct: at the roundabout): give way at its entry to the traffic already going round
    # (clockwise: traffic keeps left), join it, leave by the north arm, and cross the finish at road speed
    t.mark('merge_in')
    t.line_to(L['rb_entry_x'], 7.4, 'road-merging')
    t.mark('rb_give_way')
    t.arc(L['rb_join_r'], L['rb_join_deg'], 5.0, 'road-merging')
    t.mark('rb_join')
    t.arc(L['rb_r'], -L['rb_round_deg'], 5.0, 'road-merging')        # the lane round: the car and a margin
    t.arc(L['rb_exit_r'], L['rb_exit_deg'], 5.0, 'road-merging')
    t.line_to(L['merge_finish_y'], 7.0, 'road-merging')
    t.mark('merge_finish')
    t.line_to(L['end_y'], 7.0, 'exit-road')
    t.mark('end')
    return t


def main():
    R = v('turn_r')
    # Lane lines, metres (photo pixels in YARD-TRACE.md)
    L = dict(
        spawn_x=M(330, 0)[0],
        hill_y=M(0, 94.75)[1], hill_x0=M(482.5, 0)[0],
        # Keeping left (the owner, 20 Oct: touching a centre line fails the test). Each lane line sits near its
        # lane's middle, from the road sections lane_centres measures: the tyres keep 0.4 m or more off every
        # centre line (check.py proves it). Middles: the spine road 25.6, the west road 39.4 south of the spine
        # road and 40.6 north of it, the top road 55.4, lane C-D 62.8, lane E-F 86.4, the bottom road 3.2.
        spine_top=M(0, 438)[1], spine_wb=24.0, spine_eb=27.2, spine_s=21.3, spine_n=29.8,
        g8_sb=41.2, g8_nb=37.7, par_lane=38.49,
        band_y=(M(0, 626.5)[1] + M(0, 675)[1]) / 2, band_mouth_x=35.5,
        pocket_x=(M(267.75, 0)[0] + M(317.75, 0)[0]) / 2, pocket_mouth=M(0, 626.5)[1], pocket_back=M(0, 565.25)[1],
        par_out_y=46.0,
        top_eb=57.2,
        cd_sb=64.4,
        bottom_turn=2.05, bottom_wb=1.8, ef_nb=84.7,
        s_x=M(774.25, 0)[0], s_top=M(0, 519)[1], s_bottom=None,
        z_x0=M(499, 0)[0], z_x1=M(581, 0)[0], z_jog_y=M(0, 602)[1], z_top=M(0, 518)[1], z_bottom=M(0, 688)[1],
        ef_x=(M(878, 0)[0] + M(955.5, 0)[0]) / 2, islands_top=M(0, 202)[1],
        ramp_out_y=66.0 - R,
        east_sb=113.4,
        merge_in_x=30.6, merge_finish_y=46.0, end_y=52.0, rb_turn_r=4.5,   # the station starts just past the last junction
    )
    # The roundabout (the owner, 20 Oct: road merging is there). Traffic goes round clockwise on a circle rb_r from
    # its middle. The route comes west along the spine road's westbound lane, joins the circle by a left arc that
    # meets it tangentially, goes round to the north-west, and leaves by a left arc onto the north arm's
    # northbound lane. Join and exit arcs are solved so every piece meets the next tangentially.
    rbc = M(*ROUNDABOUT_PX[0])
    L['rb_c'], L['rb_r'] = rbc, 9.0
    L['rb_join_deg'], th_j = 55.0, math.radians(55.0 - 90.0)
    L['rb_join_r'] = (L['spine_wb'] - rbc[1] - L['rb_r'] * math.sin(th_j)) / (1 + math.sin(th_j))
    L['rb_entry_x'] = rbc[0] + (L['rb_r'] + L['rb_join_r']) * math.cos(th_j)
    th_x = math.radians(120.0)                                  # leave the circle to the north-west
    L['rb_round_deg'] = (math.degrees(th_j) - (120.0 - 360.0)) % 360.0
    L['rb_north_x'] = 13.3                                      # the north arm's northbound lane
    L['rb_exit_r'] = (L['rb_north_x'] - rbc[0] - L['rb_r'] * math.cos(th_x)) / (1 + math.cos(th_x))
    L['rb_exit_deg'] = 90.0 - (math.degrees(th_x) - 90.0)
    # the S as built: 3 m straight, two opposite arcs of s_turn at s_r, 3 m straight. Each arc drops
    # s_r * sin(s_turn), which puts its exit on the block's south edge (photo: py 683)
    L['s_bottom'] = L['s_top'] - 3.0 - 2 * v('s_r') * math.sin(math.radians(v('s_turn'))) - 3.0
    L['side_stop_x'] = L['pocket_x'] - 3.4                     # rear axle about one turning radius past the bay
    L['pocket_park_y'] = L['pocket_mouth'] + v('side_bay_l') - 0.2 - 0.696 - 0.2   # parked: rear 0.2 m inside the back line
    t = build_route(L)
    pts = t.pts

    # ------------------------------------------------------------ pavement
    boundary = to_m(chaikin(densify(BOUNDARY_PX), 3))
    islands = {k: to_m(p) for k, p in ISLANDS_PX.items()}
    (rcx, rcy), rr = ROUNDABOUT_PX
    islands['roundabout'] = to_m([(rcx + rr * math.cos(a), rcy + rr * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 96, endpoint=False)])
    # the Z lanes, carved from the Z block (centre lines from the photo, lanes z_w wide)
    zx0, zx1, zy, h = L['z_x0'], L['z_x1'], L['z_jog_y'], v('z_w') / 2
    z_legs = [rect(zx0 - h, L['z_bottom'] - 0.3, zx0 + h, zy + h),
              rect(zx0 - h, zy - h, zx1 + h, zy + h),
              rect(zx1 - h, zy - h, zx1 + h, L['z_top'] + 0.3)]
    z_fill = [quarter_fillet(zx0 + h, zy - h, 1, -1, v('z_fillet')),       # island 9's corner
              quarter_fillet(zx1 - h, zy + h, -1, 1, v('z_fillet'))]        # island 8's corner
    s_lane = corridor_polys(pts, t.marks['s_in']['s'] - 0.5, t.marks['s_out']['s'] + 0.5)
    # ramp: run-in, slope and platform on the open floor; kerbed walls from the foot of the slope
    ramp_y = M(0, 96)[1]
    mouth_x = L['ef_x'] + 3.04
    foot_x = mouth_x + v('ramp_mouth')
    end_x = foot_x + v('ramp_up') + v('ramp_top')
    hw, ww = v('ramp_w') / 2, v('wall_w')
    ramp_walls = [rect(foot_x, ramp_y + hw, end_x + ww, ramp_y + hw + ww),
                  rect(foot_x, ramp_y - hw - ww, end_x + ww, ramp_y - hw),
                  rect(end_x, ramp_y - hw - ww, end_x + ww, ramp_y + hw + ww)]
    # hill: kerbed walls along both sides of the strip
    hx0, hx1 = M(478, 0)[0], M(760, 0)[0]
    hy, hh = L['hill_y'], v('hill_w') / 2
    hill_walls = [rect(hx0, hy + hh, hx1, hy + hh + ww), rect(hx0, hy - hh - ww, hx1, hy - hh)]
    # Twin tracks (the owner, 20 Oct): a second hill strip beside ours to the north, and a second ramp beside
    # ours to the south, each sharing the wall between them, so another learner drives the same test beside
    # us, facing the same way. The north one needs the yard's edge pushed out along the hill; the south one
    # takes the east end of the top road, which the route never drives.
    hill_twin_y = hy + v('hill_w') + ww
    ramp_twin_y = ramp_y - v('ramp_w') - ww
    hill_walls.append(rect(hx0, hill_twin_y + hh, hx1, hill_twin_y + hh + ww))
    ramp_walls += [rect(foot_x, ramp_twin_y - hw - ww, end_x + ww, ramp_twin_y - hw),
                   rect(end_x, ramp_twin_y - hw - ww, end_x + ww, ramp_twin_y + hw)]
    yard_bump = rect(hx0 - 4.0, hy, hx1 + 4.0, hill_twin_y + hh + ww + 1.2)

    xs = [x for x, _ in boundary]
    ys = [y for _, y in boundary]
    pad = 6.0
    site = [min(xs) - pad, min(ys) - pad, max(xs) + pad, max(ys) + pad + 4.0]
    world = World(*site, res=0.05)
    world.add(boundary)
    world.add(yard_bump)
    for k, poly in islands.items():
        world.cut(poly)
    for poly in z_legs + z_fill + s_lane:
        world.add(poly)
    # round the islands' convex corners (a closing of the pavement, done with distance transforms),
    # then cut the thin walls
    m = np.asarray(world.img) > 127
    r_px = v('corner_r') / world.res
    grown = ndi.distance_transform_edt(~m) <= r_px
    m = (ndi.distance_transform_edt(grown) > r_px) | m
    world.img = Image.fromarray((m * 255).astype(np.uint8))
    world.draw = ImageDraw.Draw(world.img)
    for poly in ramp_walls + hill_walls:
        world.cut(poly)
    world.finish()

    gen = contourpy.contour_generator(z=world.mask.astype(float), line_type='Separate')
    rings = []
    for line in gen.lines(0.5):
        if len(line) < 8:
            continue
        xy = np.c_[site[0] + line[:, 0] * world.res, site[1] + line[:, 1] * world.res]
        rings.append(simplify(xy, 0.03))
    rings.sort(key=lambda r: -abs(ring_area(r)))

    # ------------------------------------------------------------ slopes
    sides = 'solid walls from the ground to the deck; kerbs run on the deck edges'
    hill = dict(id='hill', start=[t.marks['hill_ramp_a']['x'], t.marks['hill_ramp_a']['y']], heading_deg=0.0,
                width=v('hill_w'), profile=[[0.0, 0.0], [v('hill_up'), v('hill_rise')],
                                            [v('hill_up') + v('hill_top'), v('hill_rise')],
                                            [2 * v('hill_up') + v('hill_top'), 0.0]], sides=sides)
    ramp = dict(id='ramp', start=[foot_x, ramp_y], heading_deg=0.0, width=v('ramp_w'),
                profile=[[0.0, 0.0], [v('ramp_up'), v('ramp_rise')], [v('ramp_up') + v('ramp_top'), v('ramp_rise')]],
                sides=sides + '; the platform ends at a wall')
    hill_twin = dict(hill, id='hill-twin', start=[hill['start'][0], hill_twin_y],
                     sides=sides + '; the twin track north of ours (the owner, 20 Oct), not marked')
    ramp_twin = dict(ramp, id='ramp-twin', start=[foot_x, ramp_twin_y],
                     sides=sides + '; the platform ends at a wall; the twin track south of ours (the owner, 20 Oct), not marked')

    # ------------------------------------------------------------ stations
    def s_of(name):
        return t.marks[name]['s']
    up = v('hill_up')
    stop_s = s_of('hill_ramp_a') + v('hill_stop') * up
    bay_c = (L['pocket_x'], L['pocket_mouth'] + v('side_bay_l') / 2)
    poles = []
    lat = v('side_bay_w') / 2 + v('pole_out')
    for py in (L['pocket_mouth'] - v('pole_out'), L['pocket_mouth'] + v('side_bay_l') + v('pole_out')):
        for sx in (-1, 1):
            poles.append(dict(station='side-parking', at=[round(bay_c[0] + sx * lat, 3), round(py, 3)], radius=0.05,
                              height=1.2, status='decided 14 Oct: four corners, 0.3 m outside the lines'))
    pole_at = (end_x - v('ramp_pole_in'), ramp_y)
    poles.append(dict(station='ramp-test', at=[round(pole_at[0], 3), round(pole_at[1], 3)], radius=0.05, height=1.2,
                      base_z=v('ramp_rise'), status='decided 14 Oct: on the platform centreline'))
    pocket = to_m([(267.75, 626.5), (317.75, 626.5), (317.75, 565.25), (267.75, 565.25)])
    par_c = (M(353, 0)[0] + v('par_box_w') / 2, (M(0, 329)[1] + M(0, 399)[1]) / 2)
    par_recess = to_m([(353, 399), (393, 399), (393, 329), (353, 329)])
    # the ramp's footprint, from where a car turning in from lane E-F's northbound lane leaves it (the rules hold the
    # car's progress along the route while it is inside)
    ramp_box = rect(L['ef_nb'] + 1.0, ramp_y - hw - ww, end_x + ww, ramp_y + hw + ww)

    def across(x, gid):
        return dict(id=gid, a=[round(x, 3), round(ramp_y + hw + 0.2, 3)], b=[round(x, 3), round(ramp_y - hw - 0.2, 3)],
                    heading_deg=0.0)
    stations = [
        dict(id='hill-start', order=1, title='Hill Start', s_from=s_of('hill_in'), s_to=s_of('hill_out'), slope='hill',
             gates=[gate(pts, stop_s, gid='stop-line'), gate(pts, s_of('hill_ramp_a') + up, gid='crest'),
                    gate(pts, s_of('hill_ramp_b'), gid='foot')],
             stop_line_height=round(v('hill_stop') * v('hill_rise'), 3),
             stop_band=dict(s_from=round(stop_s - v('hill_band') / 2, 2), s_to=round(stop_s + v('hill_band') / 2, 2),
                            note='painted yellow; the front wheels must stop on it')),
        dict(id='side-parking', order=2, title='3-Side Parking', s_from=s_of('side_in'), s_to=s_of('side_out'),
             pocket=pocket, bay=dict(centre=[round(bay_c[0], 3), round(bay_c[1], 3)], axis_deg=270.0,
                                     length=v('side_bay_l'), width=v('side_bay_w')),
             gates=[gate(pts, s_of('side_in'), gid='enter'), gate(pts, s_of('side_out'), gid='leave')],
             manoeuvre='drive west along the band past the bay, reverse into it, then drive out and back east'),
        dict(id='parallel-parking', order=3, title='Parallel Park', s_from=s_of('par_in'), s_to=s_of('par_out'),
             pocket=par_recess,
             bay=dict(centre=[round(par_c[0], 3), round(par_c[1], 3)], axis_deg=90.0,
                      length=v('par_slot_l'), width=v('par_box_w'), kerbed=True,
                      note='painted box against the recess kerb; the recess itself is 3.77 m deep'),
             gates=[gate(pts, s_of('par_in'), gid='enter'), gate(pts, s_of('par_out'), gid='leave')]),
        dict(id='s-curve', order=4, title='S-Curve', s_from=s_of('s_in'), s_to=s_of('s_out'),
             gates=[gate(pts, s_of('s_a'), gid='entry'), gate(pts, (s_of('s_a') + s_of('s_mid')) / 2, gid='apex-1'),
                    gate(pts, s_of('s_mid'), gid='inflection'), gate(pts, (s_of('s_mid') + s_of('s_b')) / 2, gid='apex-2'),
                    gate(pts, s_of('s_b'), gid='exit')]),
        dict(id='z-curve', order=5, title='Z-Curve', s_from=s_of('z_in'), s_to=s_of('z_out'),
             legs=z_legs, fillets=z_fill,
             gates=[gate(pts, s_of('z_in') + 4.5 * math.pi / 2 + 0.5, gid='entry', w_pad=0.2), gate(pts, s_of('z_c1'), gid='corner-1', w_pad=0.2),
                    gate(pts, s_of('z_c2'), gid='corner-2', w_pad=0.2), gate(pts, s_of('z_out') - 0.5, gid='exit', w_pad=0.2)]),
        dict(id='ramp-test', order=6, title='Ramp Test', s_from=s_of('ramp_in'), s_to=s_of('ramp_out'), slope='ramp',
             box=ramp_box, pole=[round(pole_at[0], 3), round(pole_at[1], 3)],
             axis=dict(start=[round(foot_x, 3), round(ramp_y, 3)], heading_deg=0.0),
             gates=[across(mouth_x + 0.5, 'mouth'), across(foot_x + v('ramp_up'), 'platform')],
             manoeuvre='turn right into the ramp, drive up, stop short of the pole, hold still, reverse down and out, then carry on north'),
        dict(id='road-merging', order=7, title='Road Merging', s_from=s_of('merge_in'), s_to=s_of('merge_finish'),
             gates=[gate(pts, s_of('merge_in'), gid='lane-start'), gate(pts, s_of('rb_give_way'), gid='give-way'),
                    gate(pts, s_of('merge_finish'), gid='finish', w_pad=0.3)],
             note='at the roundabout (the owner, 20 Oct): give way to the traffic going round, join it, leave by the north arm'),
    ]
    for st in stations:
        st['s_from'], st['s_to'] = round(st['s_from'], 2), round(st['s_to'], 2)
        st['start'] = pose_at(pts, max(0.0, st['s_from'] - 8.0))     # practice: the car appears here

    # ------------------------------------------------------------ lane lines (the owner, 20 Oct)
    # Two-way roads, keeping left, with an unbroken centre line; the stations stay one car wide and unmarked.
    keep = World(*site, res=world.res)
    for st in stations:
        for poly in corridor_polys(pts, st['s_from'] - 2.0, st['s_to'] + 4.0):   # + 4: the nose, 3.1 m ahead of the rear axle
            keep.add(poly)
        for key in ('pocket', 'box'):
            if key in st:
                keep.add(st[key])
    for poly in z_legs + z_fill:
        keep.add(poly)
    # wherever the route bends off a road's axis (a turn at a junction or a station's mouth, a sideways shift), the
    # line clears the car's swept footprint by 0.5 m: a turning car's nose swings wide of its path
    car = json.load(open(os.path.join(HERE, 'car-swift-2022.json'), encoding='utf-8'))
    back, nose = car['length_m'] - car['wheelbase_m'] - car['front_overhang_m'], car['wheelbase_m'] + car['front_overhang_m']
    side = car['width_body_m'] / 2 + 0.5
    for q in pts:
        if q[5] in ('link', 'exit-road') and min(abs(math.sin(q[3])), abs(math.cos(q[3]))) > 0.02:
            c, sn = math.cos(q[3]), math.sin(q[3])
            keep.add([(q[1] + c * al - sn * ac, q[2] + sn * al + c * ac) for al, ac in ((-back, -side), (nose, -side), (nose, side), (-back, side))])
    for sl in (hill, ramp, hill_twin, ramp_twin):                 # no lines on any slope, a twin's included
        length = sl['profile'][-1][0]
        keep.add(rect(sl['start'][0] - 1.0, sl['start'][1] - sl['width'] / 2 - 1.0, sl['start'][0] + length + 1.5, sl['start'][1] + sl['width'] / 2 + 1.0))
    keep.finish()
    centre_lines, roads = lane_centres(world, keep.mask)
    # the other cars, the signals, the merge, the queues and the rest of the paint (traffic_gen.py)
    LT = dict(L, hill_w=v('hill_w'), wall_w=v('wall_w'), hill_x0_wall=hx0, marks={k: m['s'] for k, m in t.marks.items()}, M=M)
    traffic, more_paint, zebra_box, loop_paths, twin_bay = traffic_gen.build(LT, pts, stations, roads, world, keep.mask, Turtle, car)
    centre_lines = break_lines(centre_lines, [[(q[1], q[2]) for q in pts]] + loop_paths, [j['polygon'] for j in traffic['junctions']])
    centre_lines = cut_box(centre_lines, zebra_box, 4.0)              # no centre line across or just before the zebra
    for r in roads:
        print('road %s at %.2f: %.1f m wide%s; sections %s' % (r['axis'], r['mid'], r['width'], '' if r['width'] >= 6.0 else ', one-way',
                                                         ' '.join('%.0f-%.0f@%.2f' % (a, b, m) for a, b, m, _ in r['sections'])))

    junctions = [
        dict(id='spine-road', polygon=rect(M(120.5, 0)[0], 21.3, M(1224, 0)[0], 29.8),
             note='the east-west road through the middle; the STOP box sits on it'),
        dict(id='band-mouth', polygon=rect(19.0, 6.0, M(457, 0)[0], 21.9),
             note='the band and the foot of lane G-8: in to the side-parking bay and back out'),
    ]

    # ------------------------------------------------------------ props
    def box(px0, py0, px1, py1):
        (x0, y0), (x1, y1) = M(px0, py0), M(px1, py1)
        return dict(centre=[round((x0 + x1) / 2, 2), round((y0 + y1) / 2, 2)],
                    size=[round(abs(x1 - x0), 2), round(abs(y1 - y0), 2)], heading_deg=0.0)
    booths = [box(974, 217, 1024, 252), box(474, 360, 500, 400), box(473, 543, 505.5, 570.5), box(1095, 595, 1140, 625)]
    office = box(320, -10, 440, 25)
    # the other learners (the owner, 20 Oct): stopped mid-test on the twin tracks, facing the way we do. `at` is
    # the car's centre (the wheelbase's middle): on the hill with its front tyres on the stop band's line, on
    # the ramp 0.6 m short of where a pole would stand
    wb, fo = 2.45, 0.696
    npc_cars = [
        dict(on='hill-twin', at=[round(hill['start'][0] + v('hill_stop') * v('hill_up') - wb / 2, 3), round(hill_twin_y, 3)], heading_deg=0.0),
        dict(on='ramp-twin', at=[round(end_x - v('ramp_pole_in') - 0.6 - fo - wb / 2, 3), round(ramp_twin_y, 3)], heading_deg=0.0),
    ]
    spawn = dict(at=[round(L['spawn_x'], 3), round(L['hill_y'], 3)], heading_deg=0.0, handbrake=True)

    route = [[round(s, 3), round(x, 3), round(y, 3), round(math.degrees(h) % 360, 2), round(w, 3), tag]
             for s, x, y, h, w, tag in pts]
    out = dict(
        schema='drivemy.circuit/2',
        name='DriveMy practice yard (the ARM yard, traced)',
        units='metres',
        frame=dict(x='east', y='north', z='up', three_js='X = x, Y = z, Z = -y',
                   origin='photo pixel (0, 750) of bar/circuit/reference_aerial_grid.png; x = px * 0.0943, y = (750 - py) * 0.0943'),
        site=dict(bounds=[round(c, 2) for c in site], ground='grass everywhere that is not pavement'),
        car_config='car-swift-2022.json',
        parameters={k: dict(value=val, source=src, note=note) for k, (val, src, note) in P.items()},
        pavement=[[[round(x, 3), round(y, 3)] for x, y in r] for r in rings],
        pavement_rule='even-odd: rings[0] is the yard edge; every other ring is a hole (an island or a wall)',
        kerbs=dict(height=v('kerb_h'), width=v('kerb_w'),
                   placement='each ring is a pavement edge; the kerb sits on the grass side, inner face on the ring',
                   rings=[[[round(x, 3), round(y, 3)] for x, y in r] for r in rings]),
        slopes=[hill, ramp, hill_twin, ramp_twin],
        stations=stations,
        junctions=junctions,
        route=dict(columns=['s', 'x', 'y', 'heading_deg', 'width', 'tag'], samples=route, manoeuvres=t.jumps),
        obstacles=dict(poles=poles, cones=[]),
        markings=dict(centre_lines=[[[round(x, 3), round(y, 3)] for x, y in line] for line in centre_lines], dash=0.0, gap=0.0, width=0.10,
                      note='unbroken white centre lines, 100 mm, on every two-way road, none on the stations: JKR ATJ 2D/85 4.1.1 and 4.1.2.2 '
                           'use an unbroken line where crossing is prohibited, and touching one fails the test (keep left). '
                           'dash 0 and gap 0: unbroken', **more_paint),
        traffic=traffic,
        props=dict(booths=booths, office=office, fence=site,
                   npc_cars=npc_cars + [dict(on='side-twin', at=twin_bay['centre'], heading_deg=180.0)]),
        spawn=spawn,
    )
    out = rnd(out)
    path = os.path.join(HERE, 'circuit.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, separators=(',', ':'))
    print('wrote', path, '%.1f KB' % (os.path.getsize(path) / 1024))
    print('site %.1f x %.1f m; route %.1f m; %d kerb rings' % (site[2] - site[0], site[3] - site[1], pts[-1][0], len(rings)))


def ring_area(r):
    a = np.asarray(r)
    return 0.5 * float(np.dot(a[:, 0], np.roll(a[:, 1], 1)) - np.dot(a[:, 1], np.roll(a[:, 0], 1)))


def rnd(o):
    if isinstance(o, float):
        return round(o, 3)
    if isinstance(o, (list, tuple)):
        return [rnd(x) for x in o]
    if isinstance(o, dict):
        return {k: rnd(x) for k, x in o.items()}
    return o


def simplify(xy, tol):
    """Douglas-Peucker on a closed or open polyline."""
    pts = np.asarray(xy)
    if len(pts) < 3:
        return pts.tolist()
    keep = np.zeros(len(pts), bool)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1:
            continue
        A, B = pts[a], pts[b]
        seg = B - A
        Ln = np.hypot(*seg)
        sub = pts[a + 1:b]
        if Ln < 1e-9:
            d = np.hypot(*(sub - A).T)
        else:
            d = np.abs(seg[0] * (sub[:, 1] - A[1]) - seg[1] * (sub[:, 0] - A[0])) / Ln
        i = int(np.argmax(d))
        if d[i] > tol:
            k = a + 1 + i
            keep[k] = True
            stack += [(a, k), (k, b)]
    return pts[keep].tolist()


if __name__ == '__main__':
    main()
