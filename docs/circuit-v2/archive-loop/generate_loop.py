"""Generate circuit.json, the single source of truth for the DriveMy practice circuit (v2).

Run:  python docs/circuit-v2/generate.py
Then: python docs/circuit-v2/check.py      (proves the claims from circuit.json alone)
      python docs/circuit-v2/render.py     (draws the plan, the minimap and the comparison sheet)

Frame: metres, x = east, y = north, z = up. Origin = where the course leaves the apron.
In three.js (y-up) use  X = x,  Y = z,  Z = -y.

Every number below carries its source:
  photo  measured off bar/circuit/reference_aerial_grid.png at 0.0943 m/px (scale +/-5%)
  prd    taken from the PRD (docs/circuit-v2/prd-excerpt.md)
  car    derived from the car config (car-swift-2022.json)
  design a layout choice of this draft, not a JPJ figure
  unverified  a JPJ-facing number nobody has confirmed; pending ARM review
"""
import json
import math
import os

import contourpy
import numpy as np

from lib_geom import HERE, World

P = {
    'road_w':        (6.0,   'design', 'Circulation road, kerb to kerb. Wider than the real roads (5.6-5.85 m, photo)'),
    'corner_r':      (9.0,   'design', 'Centreline radius of the loop corners'),
    'kerb_h':        (0.13,  'prd',    'Kerb height (PRD, v1 value)'),
    'kerb_w':        (0.20,  'design', 'Kerb width; the kerb sits outside the pavement edge'),
    'hill_w':        (4.5,   'photo',  'Hill strip, kerb to kerb (real strip about 26 x 4.5 m)'),
    'hill_up':       (10.8,  'prd',    'Up-slope length (PRD; rise is a v1 value)'),
    'hill_top':      (4.15,  'prd',    'Flat top: 25.75 total - 2 x 10.8 (PRD hill length)'),
    'hill_rise':     (1.3,   'decided', 'Rise 1.3 m, 12.0% (v1 value, kept on 14 Oct: no public JPJ gradient found)'),
    'hill_stop':     (0.33,  'decided', 'Yellow stop line at 33% of the rise (simulator rule, kept on 14 Oct)'),
    'hill_band':     (0.6,   'decided', 'Yellow stop band along the slope; the front wheels must stop on it (guides: front tyre on the yellow line)'),
    'side_pocket_l': (4.9,   'photo',  'Kerbed reverse-bay pocket along the road (real lower-left recess 4.9 x 5.8 m)'),
    'side_pocket_d': (5.8,   'photo',  'Pocket depth'),
    'side_bay_w':    (2.6,   'decided', 'Painted bay width (v1 layout, kept on 14 Oct)'),
    'side_bay_l':    (5.6,   'decided', 'Painted bay length (v1 layout, kept on 14 Oct)'),
    'pole_out':      (0.3,   'decided', 'Poles at the four bay corners, 0.3 m outside the lines (guides: touching a pole fails)'),
    'par_slot_l':    (6.6,   'photo',  'Parallel recess length (real upper-left recess 2.5 x 6.6 m; PRD had 2.4 x 6.4)'),
    'par_slot_w':    (2.5,   'photo',  'Parallel recess depth'),
    'tpt_w':         (7.45,  'photo',  'Three-point-turn road width: the real 7.45 m lane beside the Z, decided on 14 Oct to be the three-point-turn lane; it sits inside the car-derived 6.0-9.5 m window'),
    'tpt_d':         (16.0,  'design', 'Stub depth from the road edge'),
    's_w':           (3.6,   'photo',  'S lane, kerb to kerb (real p10-p90 3.35-3.76 m, median 3.6 m)'),
    's_r':           (7.5,   'photo',  'S centreline radius (real median 7.5 m and 7.1 m)'),
    's_turn':        (141.0, 'photo',  'Each S bend turns 141 deg (real: +141 then -141)'),
    'z_w':           (4.0,   'photo',  'Z lane, kerb to kerb (real 3.9-4.0 m; the upper value keeps the body off the kerb)'),
    'z_entry':       (7.0,   'photo',  'Z entry leg to the first corner (real about 7 m)'),
    'z_jog':         (7.7,   'photo',  'Z middle leg, corner to corner (real 7.7 m)'),
    'z_exit':        (6.0,   'photo',  'Z exit leg after the second corner (real about 6 m)'),
    'z_fillet':      (1.0,   'photo',  'Inner kerb corners rounded about 1 m; outer corners square'),
    'z_rc':          (3.6,   'car',    'Route centreline radius through each Z corner (>= full-lock 3.43 m)'),
    'ramp_w':        (4.0,   'decided', 'Ramp-test stub width, kerb to kerb'),
    'ramp_mouth':    (3.0,   'decided', 'Flat run-in from the road edge to the foot of the slope'),
    'ramp_up':       (6.0,   'decided', 'Up-slope length'),
    'ramp_rise':     (0.6,   'decided', 'Platform height, a 10% slope up onto a raised block (a DA learner: naik atas batu simen)'),
    'ramp_top':      (7.0,   'decided', 'Platform length to the end kerb'),
    'ramp_pole_in':  (0.4,   'decided', 'The pole stands on the centreline this far before the end kerb (a DA learner: one pole in the middle)'),
    'flare_r':       (2.5,   'design', 'Rounded corners where a stub meets the road'),
    'merge_w':       (4.0,   'design', 'Acceleration lane width'),
    'merge_run':     (14.0,  'design', 'Acceleration lane before the taper'),
    'merge_taper':   (18.0,  'design', 'Merge taper length'),
    'apron_depth':   (18.0,  'design', 'Start/finish apron, north-south'),
}


def v(key):
    return P[key][0]


class Turtle:
    """Builds the route centreline as samples (s, x, y, heading, width, tag)."""

    def __init__(self, x, y, h_deg, ds=0.25):
        self.x, self.y, self.h = x, y, math.radians(h_deg)
        self.s, self.ds = 0.0, ds
        self.pts = [(0.0, x, y, self.h, v('road_w'), 'apron-exit')]
        self.marks = {}

    def mark(self, name):
        self.marks[name] = dict(s=self.s, x=self.x, y=self.y, h=self.h)
        return self.marks[name]

    def _emit(self, w, tag):
        self.pts.append((self.s, self.x, self.y, self.h, w, tag))

    def line(self, length, w0, w1=None, tag='link'):
        w1 = w0 if w1 is None else w1
        n = max(1, int(round(length / self.ds)))
        for i in range(1, n + 1):
            f = i / n
            self.x += math.cos(self.h) * length / n
            self.y += math.sin(self.h) * length / n
            self.s += length / n
            self._emit(w0 + (w1 - w0) * f, tag)

    def arc(self, r, deg, w0, w1=None, tag='link'):
        w1 = w0 if w1 is None else w1
        ang = math.radians(deg)
        length = abs(ang) * r
        n = max(2, int(round(length / self.ds)))
        sign = 1 if ang > 0 else -1
        cx = self.x - sign * r * math.sin(self.h)
        cy = self.y + sign * r * math.cos(self.h)
        for i in range(1, n + 1):
            f = i / n
            self.h += ang / n
            self.x = cx + sign * r * math.sin(self.h)
            self.y = cy - sign * r * math.cos(self.h)
            self.s += length / n
            self._emit(w0 + (w1 - w0) * f, tag)

    def shift(self, d, length, w, tag):
        """Lateral shift by d metres (positive = left) over length: two opposite arcs."""
        th = 2 * math.atan2(abs(d), length)
        r = length / (2 * math.sin(th))
        sg = 1 if d > 0 else -1
        self.arc(r, sg * math.degrees(th), w, tag=tag)
        self.arc(r, -sg * math.degrees(th), w, tag=tag)


def frame(m):
    """Unit vectors (forward, left) at a mark."""
    return (math.cos(m['h']), math.sin(m['h'])), (-math.sin(m['h']), math.cos(m['h']))


def rect_on_left(m, along0, along1, off0, off1):
    """Rectangle in a mark's frame: along the road from along0 to along1, out to the left
    from off0 to off1 (metres from the centreline)."""
    (fx, fy), (lx, ly) = frame(m)
    ox, oy = m['x'], m['y']
    return [(ox + fx * a + lx * o, oy + fy * a + ly * o)
            for a, o in ((along0, off0), (along1, off0), (along1, off1), (along0, off1))]


def build():
    rw = v('road_w')
    t = Turtle(0.0, 0.0, 0.0)

    t.line(4, rw, tag='link')
    # 1 Hill start
    t.mark('hill_in')
    t.line(3, rw, v('hill_w'), tag='hill-start')
    t.line(3, v('hill_w'), tag='hill-start')
    hill_a = t.mark('hill_ramp_a')
    hill_len = 2 * v('hill_up') + v('hill_top')
    t.line(hill_len, v('hill_w'), tag='hill-start')
    t.mark('hill_ramp_b')
    t.line(3, v('hill_w'), tag='hill-start')
    t.line(3, v('hill_w'), rw, tag='hill-start')
    t.mark('hill_out')
    t.line(2, rw, tag='link')
    # 2 Side parking: the road is the aisle; kerbed pocket on the left
    side_m = t.mark('side_in')
    t.line(20, rw, tag='side-parking')
    t.mark('side_out')
    t.arc(v('corner_r'), 90, rw, tag='link')
    # 3 Parallel park: kerbed recess on the left
    par_m = t.mark('par_in')
    t.line(22, rw, tag='parallel-parking')
    t.mark('par_out')
    t.line(4, rw, tag='link')
    # 4 Three-point turn: stub on the left
    tpt_m = t.mark('tpt_in')
    t.line(16, rw, tag='three-point-turn')
    t.mark('tpt_out')
    t.arc(v('corner_r'), 90, rw, tag='link')
    t.line(8, rw, tag='link')
    # 5 S-curve (real geometry; first bend to the left, as in the photo)
    t.mark('s_in')
    t.line(3, rw, v('s_w'), tag='s-curve')
    t.line(2, v('s_w'), tag='s-curve')
    t.mark('s_a')
    t.arc(v('s_r'), v('s_turn'), v('s_w'), tag='s-curve')
    t.mark('s_mid')
    t.arc(v('s_r'), -v('s_turn'), v('s_w'), tag='s-curve')
    t.mark('s_b')
    t.line(2, v('s_w'), tag='s-curve')
    t.line(3, v('s_w'), rw, tag='s-curve')
    t.mark('s_out')
    t.line(5, rw, tag='link')
    # 6 Z-curve: real handedness (first corner to the right); pavement drawn from its legs
    t.line(3, rw, v('z_w'), tag='z-curve')
    z_m = t.mark('z_in')
    rc = v('z_rc')
    t.line(v('z_entry') - rc, v('z_w'), tag='z-curve')
    t.arc(rc, -90, v('z_w'), tag='z-curve')
    t.mark('z_c1')
    t.line(v('z_jog') - 2 * rc, v('z_w'), tag='z-curve')
    t.arc(rc, 90, v('z_w'), tag='z-curve')
    t.mark('z_c2')
    t.line(v('z_exit') - rc, v('z_w'), tag='z-curve')
    t.mark('z_out')
    t.line(3, v('z_w'), rw, tag='z-curve')
    t.line(4, rw, tag='link')
    # 7 Ramp test: a dead-end ramp on the left. Drive up onto the platform, stop short of the pole,
    # reverse back down and out. Basis: a DA learner's account (climb onto the cement block; hitting
    # the pole in the middle fails). Its dimensions are decided, not measured.
    ramp_m = t.mark('ramp_in')
    t.line(16, rw, tag='ramp-test')
    t.mark('ramp_out')
    t.line(4, rw, tag='link')
    t.arc(v('corner_r'), 90, rw, tag='link')
    # 8 Road merging: acceleration lane, then a taper into the exit road on the right
    t.line(4, rw, v('merge_w'), tag='road-merging')
    acc_m = t.mark('merge_in')
    t.line(v('merge_run'), v('merge_w'), tag='road-merging')
    taper_m = t.mark('merge_taper')
    gap = v('merge_w') / 2 + rw / 2 + 2.5          # lane centres apart: lane + road + a 2.5 m grass gore
    t.shift(-gap, v('merge_taper'), v('merge_w'), tag='road-merging')
    fin_m = t.mark('merge_finish')
    t.line(6, rw, tag='exit-road')
    t.mark('end')
    return t, dict(hill_a=hill_a, side=side_m, par=par_m, tpt=tpt_m, z=z_m, ramp=ramp_m,
                   acc=acc_m, taper=taper_m, fin=fin_m, gap=gap)


def corridor_polys(pts, skip_tags=()):
    """Quads between consecutive centreline samples, offset by +/- width/2."""
    polys = []
    for (s0, x0, y0, h0, w0, t0), (s1, x1, y1, h1, w1, t1) in zip(pts, pts[1:]):
        if t1 in skip_tags:
            continue
        n0 = (-math.sin(h0), math.cos(h0))
        n1 = (-math.sin(h1), math.cos(h1))
        polys.append([(x0 + n0[0] * w0 / 2, y0 + n0[1] * w0 / 2), (x1 + n1[0] * w1 / 2, y1 + n1[1] * w1 / 2),
                      (x1 - n1[0] * w1 / 2, y1 - n1[1] * w1 / 2), (x0 - n0[0] * w0 / 2, y0 - n0[1] * w0 / 2)])
    return polys


def z_polys(m):
    """The Z's three legs in the frame of the mark at its entry (forward u, left v).
    First corner turns right (towards -v), as in the photo."""
    w, L1, D, L3 = v('z_w'), v('z_entry'), v('z_jog'), v('z_exit')
    h = w / 2
    (fx, fy), (lx, ly) = frame(m)
    ox, oy = m['x'], m['y']

    def P_(u, vv):
        return (ox + fx * u + lx * vv, oy + fy * u + ly * vv)

    legs = [[P_(0, -h), P_(L1 + h, -h), P_(L1 + h, h), P_(0, h)],
            [P_(L1 - h, -D - h), P_(L1 + h, -D - h), P_(L1 + h, h), P_(L1 - h, h)],
            [P_(L1 - h, -D - h), P_(L1 + L3, -D - h), P_(L1 + L3, -D + h), P_(L1 - h, -D + h)]]
    # Inner corners: round the island's convex corner by r (adds pavement in the island's corner)
    r = v('z_fillet')
    fillets = []
    for (cu, cv, su, sv) in ((L1 - h, -h, -1, -1), (L1 + h, -D + h, 1, 1)):
        # square of side r at the island corner, minus the quarter disc centred r inside the island
        ccu, ccv = cu + su * r, cv + sv * r
        pts = [P_(cu, cv), P_(cu + su * r, cv)]
        for k in range(0, 17):
            a = k / 16 * math.pi / 2
            # arc from (cu + su*r, cv) round to (cu, cv + sv*r), centred on (ccu, ccv)
            du, dv = -su * r * math.cos(a), -sv * r * math.sin(a)
            pts.append(P_(ccu + du, ccv + dv))
        pts.append(P_(cu, cv + sv * r))
        fillets.append(pts)
    return legs, fillets


def corner_fillet(m, a, o, sa, so, r, n=16):
    """Pavement that rounds a grass corner. The corner is at (along a, offset o) in the mark's frame;
    sa, so (+/-1) point from the corner along the road edge and into the stub side."""
    (fx, fy), (lx, ly) = frame(m)
    ox, oy = m['x'], m['y']

    def P_(u, vv):
        return (ox + fx * u + lx * vv, oy + fy * u + ly * vv)
    cu, cv = a + sa * r, o + so * r
    pts = [P_(a, o), P_(a + sa * r, o)]
    for k in range(n + 1):
        ang = k / n * math.pi / 2
        pts.append(P_(cu - sa * r * math.sin(ang), cv - so * r * math.cos(ang)))
    pts.append(P_(a, o + so * r))
    return pts


def stub_line(m, a0, width, depth, gid):
    """A gate across a stub on the left, at a depth (metres from the route centreline)."""
    (fx, fy), (lx, ly) = frame(m)
    a = (m['x'] + fx * (a0 - 0.2) + lx * depth, m['y'] + fy * (a0 - 0.2) + ly * depth)
    b = (m['x'] + fx * (a0 + width + 0.2) + lx * depth, m['y'] + fy * (a0 + width + 0.2) + ly * depth)
    return dict(id=gid, a=[round(a[0], 3), round(a[1], 3)], b=[round(b[0], 3), round(b[1], 3)],
                heading_deg=round((math.degrees(m['h']) + 90) % 360, 2))


def slope_profile(a_mark):
    up, top, rise = v('hill_up'), v('hill_top'), v('hill_rise')
    return [[0.0, 0.0], [up, rise], [up + top, rise], [2 * up + top, 0.0]]


def gate(pts_by_s, s, w_pad=0.3, gid=''):
    S = np.array([p[0] for p in pts_by_s])
    i = int(np.clip(np.searchsorted(S, s), 0, len(S) - 1))
    _, x, y, h, w, tag = pts_by_s[i]
    n = (-math.sin(h), math.cos(h))
    half = w / 2 + w_pad
    return dict(id=gid, s=round(float(S[i]), 2), a=[round(x + n[0] * half, 3), round(y + n[1] * half, 3)],
                b=[round(x - n[0] * half, 3), round(y - n[1] * half, 3)], heading_deg=round(math.degrees(h) % 360, 2))


def main():
    t, M = build()
    pts = t.pts
    rw = v('road_w')

    pave_polys = corridor_polys(pts, skip_tags=('z-curve',))
    zlegs, zfill = z_polys(M['z'])
    # Z tapers sit outside the legs; keep their corridor quads
    z_taper = [q for q, (a, b) in zip(corridor_polys(pts), zip(pts, pts[1:]))
               if b[5] == 'z-curve' and (a[0] < M['z']['s'] - 1e-6 or b[0] > t.marks['z_out']['s'] + 1e-6)]
    pave_polys += zlegs + zfill + z_taper

    # Pockets and stub, all on the left of travel
    side_off = rw / 2
    pocket_a0 = 7.0
    side_pocket = rect_on_left(M['side'], pocket_a0, pocket_a0 + v('side_pocket_l'), side_off - 0.05,
                               side_off + v('side_pocket_d'))
    par_a0 = 7.0
    par_slot = rect_on_left(M['par'], par_a0, par_a0 + v('par_slot_l'), side_off - 0.05, side_off + v('par_slot_w'))
    tpt_a0 = 4.0
    tpt_stub = rect_on_left(M['tpt'], tpt_a0, tpt_a0 + v('tpt_w'), side_off - 0.05, side_off + v('tpt_d'))
    ramp_a0 = 6.0
    ramp_depth = v('ramp_mouth') + v('ramp_up') + v('ramp_top')
    ramp_stub = rect_on_left(M['ramp'], ramp_a0, ramp_a0 + v('ramp_w'), side_off - 0.05, side_off + ramp_depth)
    ramp_flares = [corner_fillet(M['ramp'], ramp_a0, side_off, -1, 1, v('flare_r')),
                   corner_fillet(M['ramp'], ramp_a0 + v('ramp_w'), side_off, 1, 1, v('flare_r'))]
    pave_polys += [side_pocket, par_slot, tpt_stub, ramp_stub] + ramp_flares

    # Exit road: the public-road stand-in the course merges into. It runs the length of the west
    # edge, gate to gate; after the finish the car drives out on it.
    gap = M['gap']
    acc = M['acc']
    (fx, fy), (lx, ly) = frame(acc)          # heading south here: forward = -y, left = +x
    main_x = acc['x'] - lx * gap             # right of travel = west
    end = t.marks['end']
    exit_north = acc['y'] + 6.0
    exit_south = end['y'] - 4.0
    exit_road = [(main_x - rw / 2, exit_south), (main_x + rw / 2, exit_south),
                 (main_x + rw / 2, exit_north), (main_x - rw / 2, exit_north)]
    pave_polys.append(exit_road)
    # Apron: west of the course start, kept 4 m clear of the acceleration lane and taper
    apron_w = max(acc['x'] + v('merge_w') / 2 + 4.0, -22.0)
    apron_s, apron_n = -rw / 2 - 6.0, rw / 2 + 6.0
    apron = [(apron_w, apron_s), (0.0, apron_s), (0.0, apron_n), (apron_w, apron_n)]
    pave_polys.append(apron)

    # Raster, kerbs, site
    xs = [x for poly in pave_polys for x, _ in poly]
    ys = [y for poly in pave_polys for _, y in poly]
    pad = 8.0
    site = [min(xs) - pad, min(ys) - pad, max(xs) + pad, max(ys) + pad]
    world = World(*site, res=0.05)
    for poly in pave_polys:
        world.add(poly)
    world.finish()

    gen = contourpy.contour_generator(z=world.mask.astype(float), line_type='Separate')
    rings = []
    for line in gen.lines(0.5):
        if len(line) < 8:
            continue
        xy = np.c_[site[0] + line[:, 0] * world.res, site[1] + line[:, 1] * world.res]
        rings.append(simplify(xy, 0.03))

    # Slopes
    sides = 'solid walls from the ground to the deck; kerbs run on the deck edges'
    hill_slope = dict(id='hill', start=[M['hill_a']['x'], M['hill_a']['y']], heading_deg=math.degrees(M['hill_a']['h']) % 360,
                      width=v('hill_w'), profile=slope_profile(M['hill_a']), sides=sides)
    (rfx, rfy), (rlx, rly) = frame(M['ramp'])
    ramp_axis_along = ramp_a0 + v('ramp_w') / 2
    ramp_foot = (M['ramp']['x'] + rfx * ramp_axis_along + rlx * (side_off + v('ramp_mouth')),
                 M['ramp']['y'] + rfy * ramp_axis_along + rly * (side_off + v('ramp_mouth')))
    ramp_heading = (math.degrees(M['ramp']['h']) + 90.0) % 360
    ramp_slope = dict(id='ramp', start=list(ramp_foot), heading_deg=ramp_heading, width=v('ramp_w'),
                      profile=[[0.0, 0.0], [v('ramp_up'), v('ramp_rise')], [v('ramp_up') + v('ramp_top'), v('ramp_rise')]],
                      sides=sides + '; the platform ends at a kerbed wall')
    slopes = [hill_slope, ramp_slope]
    pole_depth = side_off + ramp_depth - v('ramp_pole_in')
    ramp_pole_at = (M['ramp']['x'] + rfx * ramp_axis_along + rlx * pole_depth,
                    M['ramp']['y'] + rfy * ramp_axis_along + rly * pole_depth)

    # Stations
    def s_of(name):
        return t.marks[name]['s']
    up = v('hill_up')
    stop_s = s_of('hill_ramp_a') + v('hill_stop') * up
    side_bay_c_along = pocket_a0 + v('side_pocket_l') / 2
    (sfx, sfy), (slx, sly) = frame(M['side'])
    bay_c = (M['side']['x'] + sfx * side_bay_c_along + slx * (side_off + v('side_bay_l') / 2),
             M['side']['y'] + sfy * side_bay_c_along + sly * (side_off + v('side_bay_l') / 2))
    bay_axis = math.degrees(math.atan2(-sly, -slx)) % 360          # back of bay -> mouth = towards the road
    poles = []
    lat = v('side_bay_w') / 2 + v('pole_out')
    for depth in (v('side_bay_l') / 2, -v('side_bay_l') / 2):          # back line, mouth line
        for sgn in (1, -1):
            px_ = bay_c[0] + sfx * sgn * lat + slx * depth
            py_ = bay_c[1] + sfy * sgn * lat + sly * depth
            poles.append(dict(station='side-parking', at=[round(px_, 3), round(py_, 3)], radius=0.05, height=1.2,
                              status='decided 14 Oct: four corners, 0.3 m outside the lines'))
    poles.append(dict(station='ramp-test', at=[round(ramp_pole_at[0], 3), round(ramp_pole_at[1], 3)], radius=0.05,
                      height=1.2, base_z=v('ramp_rise'), status='decided 14 Oct: on the platform centreline'))
    (pfx, pfy), (plx, ply) = frame(M['par'])
    par_c_along = par_a0 + v('par_slot_l') / 2
    par_c = (M['par']['x'] + pfx * par_c_along + plx * (side_off + v('par_slot_w') / 2),
             M['par']['y'] + pfy * par_c_along + ply * (side_off + v('par_slot_w') / 2))
    stations = [
        dict(id='hill-start', order=1, title='Hill Start', s_from=s_of('hill_in'), s_to=s_of('hill_out'), slope='hill',
             gates=[gate(pts, stop_s, gid='stop-line'), gate(pts, s_of('hill_ramp_a') + up, gid='crest'),
                    gate(pts, s_of('hill_ramp_b'), gid='foot')],
             stop_line_height=round(v('hill_stop') * v('hill_rise'), 3),
             stop_band=dict(s_from=round(stop_s - v('hill_band') / 2, 2), s_to=round(stop_s + v('hill_band') / 2, 2),
                            note='painted yellow; the front wheels must stop on it')),
        dict(id='side-parking', order=2, title='Side Parking', s_from=s_of('side_in'), s_to=s_of('side_out'),
             pocket=side_pocket, bay=dict(centre=[round(bay_c[0], 3), round(bay_c[1], 3)], axis_deg=round(bay_axis, 2),
                                          length=v('side_bay_l'), width=v('side_bay_w')),
             gates=[gate(pts, s_of('side_in'), gid='enter'), gate(pts, s_of('side_out'), gid='leave')]),
        dict(id='parallel-parking', order=3, title='Parallel Park', s_from=s_of('par_in'), s_to=s_of('par_out'),
             bay=dict(centre=[round(par_c[0], 3), round(par_c[1], 3)], axis_deg=round(math.degrees(M['par']['h']) % 360, 2),
                      length=v('par_slot_l'), width=v('par_slot_w'), kerbed=True),
             gates=[gate(pts, s_of('par_in'), gid='enter'), gate(pts, s_of('par_out'), gid='leave')]),
        dict(id='three-point-turn', order=4, title='3-Point Turn', s_from=s_of('tpt_in'), s_to=s_of('tpt_out'),
             box=tpt_stub, width=v('tpt_w'), depth=v('tpt_d'),
             gates=[gate(pts, s_of('tpt_in') + tpt_a0 + v('tpt_w') / 2, gid='throat')]),
        dict(id='s-curve', order=5, title='S-Curve', s_from=s_of('s_in'), s_to=s_of('s_out'),
             gates=[gate(pts, s_of('s_a'), gid='entry'), gate(pts, (s_of('s_a') + s_of('s_mid')) / 2, gid='apex-1'),
                    gate(pts, s_of('s_mid'), gid='inflection'), gate(pts, (s_of('s_mid') + s_of('s_b')) / 2, gid='apex-2'),
                    gate(pts, s_of('s_b'), gid='exit')]),
        dict(id='z-curve', order=6, title='Z-Curve', s_from=s_of('z_in') - 3, s_to=s_of('z_out') + 3,
             legs=zlegs, fillets=zfill,
             gates=[gate(pts, s_of('z_in'), gid='entry', w_pad=0.2), gate(pts, s_of('z_c1'), gid='corner-1', w_pad=0.2),
                    gate(pts, s_of('z_c2'), gid='corner-2', w_pad=0.2), gate(pts, s_of('z_out'), gid='exit', w_pad=0.2)]),
        dict(id='ramp-test', order=7, title='Ramp Test', s_from=s_of('ramp_in'), s_to=s_of('ramp_out'), slope='ramp',
             box=ramp_stub, flares=ramp_flares, pole=[round(ramp_pole_at[0], 3), round(ramp_pole_at[1], 3)],
             axis=dict(start=[round(ramp_foot[0], 3), round(ramp_foot[1], 3)], heading_deg=round(ramp_heading, 2)),
             gates=[stub_line(M['ramp'], ramp_a0, v('ramp_w'), side_off + 0.5, 'mouth'),
                    stub_line(M['ramp'], ramp_a0, v('ramp_w'), side_off + v('ramp_mouth') + v('ramp_up'), 'platform')],
             manoeuvre='drive up, stop short of the pole, hold still, reverse down and out, then carry on'),
        dict(id='road-merging', order=8, title='Road Merging', s_from=s_of('merge_in'), s_to=s_of('merge_finish'),
             gates=[gate(pts, s_of('merge_in'), gid='lane-start'), gate(pts, s_of('merge_finish'), gid='finish', w_pad=0.5)],
             note='Simulator simplification: there is no traffic on the access road'),
    ]
    for st in stations:
        st['s_from'], st['s_to'] = round(st['s_from'], 2), round(st['s_to'], 2)

    # Props: booths beside stations (as on the real site), the office by the access road
    def beside(mark, along, off, size, heading=None):
        (fx_, fy_), (lx_, ly_) = frame(mark)
        return dict(centre=[round(mark['x'] + fx_ * along + lx_ * off, 2), round(mark['y'] + fy_ * along + ly_ * off, 2)],
                    size=size, heading_deg=round(math.degrees(mark['h']) % 360 if heading is None else heading, 1))
    booths = [beside(M['hill_a'], v('hill_up') * v('hill_stop'), -(v('hill_w') / 2 + 4.5), [2.4, 2.4]),
              beside(M['par'], 4.0, -(rw / 2 + 3.5), [2.4, 2.4]),
              beside(t.marks['s_in'], 2.0, -(rw / 2 + 4.0), [2.4, 2.4]),
              beside(M['ramp'], ramp_a0 - 5.0, side_off + 9.0, [2.4, 2.4])]
    office = dict(centre=[round(apron_w + 8.0, 2), round(apron_s - 7.0, 2)], size=[16.0, 8.0], heading_deg=0.0)
    spawn = dict(at=[-6.0, 0.0], heading_deg=0.0, handbrake=True)

    route = [[round(s, 3), round(x, 3), round(y, 3), round(math.degrees(h) % 360, 2), round(w, 3), tag]
             for s, x, y, h, w, tag in pts]
    out = dict(
        schema='drivemy.circuit/2',
        name='DriveMy practice circuit v2 (draft)',
        units='metres',
        frame=dict(x='east', y='north', z='up', three_js='X = x, Y = z, Z = -y', origin='where the course leaves the apron'),
        site=dict(bounds=[round(c, 2) for c in site], ground='grass everywhere that is not pavement'),
        car_config='car-swift-2022.json',
        parameters={k: dict(value=val, source=src, note=note) for k, (val, src, note) in P.items()},
        pavement=[[[round(x, 3), round(y, 3)] for x, y in poly] for poly in pave_polys],
        kerbs=dict(height=v('kerb_h'), width=v('kerb_w'),
                   placement='each ring is a pavement edge; the kerb sits on the grass side, inner face on the ring',
                   rings=[[[round(x, 3), round(y, 3)] for x, y in r] for r in rings]),
        slopes=slopes,
        stations=stations,
        route=dict(columns=['s', 'x', 'y', 'heading_deg', 'width', 'tag'], samples=route),
        obstacles=dict(poles=poles, cones=[]),
        props=dict(booths=booths, office=office, fence=site),
        spawn=spawn,
    )
    out = rnd(out)
    path = os.path.join(HERE, 'circuit.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, separators=(',', ':'))
    print('wrote', path, '%.1f KB' % (os.path.getsize(path) / 1024))
    print('site %.1f x %.1f m; route %.1f m; %d kerb rings' % (site[2] - site[0], site[3] - site[1], pts[-1][0], len(rings)))


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
        L = np.hypot(*seg)
        sub = pts[a + 1:b]
        if L < 1e-9:
            d = np.hypot(*(sub - A).T)
        else:
            d = np.abs(seg[0] * (sub[:, 1] - A[1]) - seg[1] * (sub[:, 0] - A[0])) / L
        i = int(np.argmax(d))
        if d[i] > tol:
            k = a + 1 + i
            keep[k] = True
            stack += [(a, k), (k, b)]
    return pts[keep].tolist()


if __name__ == '__main__':
    main()
