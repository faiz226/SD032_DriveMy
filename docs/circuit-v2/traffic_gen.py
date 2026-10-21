"""The yard's traffic and road markings (the owner, 20 Oct): other cars on the two-way roads, a signalled
junction, the merge where the route's last station joins moving traffic, where each station's queue waits
(with a marker pole on the grass beside it), a zebra crossing, arrows, chevrons, stop and give-way lines and
white edge lines. generate.py calls build() once the route, the roads and the pavement are known.

Every number carries its source, as in generate.py: decided (20 Oct, no public source), car, photo, or jkr: the
markings follow JKR's Arahan Teknik (Jalan) 2D/85, Manual on Traffic Control Devices: Road Marking and
Delineation (the owner, 20 Oct), cited by clause and figure.
"""
import math

import numpy as np

DESIGN = {
    'turn_left_r':   (3.5,  'decided', 'Other cars turn left at 3.5 m, inside their lane at the narrow island corners'),
    'turn_right_r':  (4.5,  'decided', 'Other cars turn right at 4.5 m, across the junction'),
    'loop_kmh':      (25,   'decided', 'Other cars on the island roads: a yard pace, under the merge leg\'s 30'),
    'main_kmh':      (30,   'decided', 'The outer loop, round the yard\'s edge roads'),
    'ring_kmh':      (20,   'decided', 'Cars going round the roundabout (its bend holds them to about 16 km/h)'),
    'cycle':         ((12, 3, 1, 10, 3, 1), 'decided', 'Signal cycle, s: spine road green, amber, all red, side road green, amber, all red'),
    'offsets':       ((0,), 'decided', 'Signal offset, s: one signalled junction, J1 (spine road x lane D-E); J2, 4.4 m along, is unsignalled'),
    'gap_s':         (3.0,  'decided', 'At the merge, the gap to the next main-road car a joining car needs, in seconds to the conflict point'),
    'zebra':         ((46.7, 3.0, 0.6, 0.6), 'jkr',     'Zebra crossing: centre x (decided: between the two booths across the spine road), then 4.2.4 and Fig 13 type A: a crossing 1.8 to 3.6 m wide, strips 600 mm, gaps 600 mm'),
    'zebra_stop':    (1.35, 'jkr',     '4.2.2 and Fig 13: a stop line 1.2 m before a crossing (here to the line\'s middle)'),
    'arrow_back':    (6.0,  'decided', 'Direction arrows sit this far before a junction, in each lane traffic uses'),
    'stop_off':      (1.5,  'jkr',     '4.2.2, 4.2.3, Fig 12: stop and give-way lines 1.2 m to 10 m from the edge of the road crossed (here 1.5 m to the line\'s middle)'),
    'edge_in':       (0.325, 'jkr',    '4.1.6 and Fig 9: a 150 mm white edge line, a 0.25 m strip in from the kerb (here to the line\'s middle)'),
    'merge_taper':   (30.0, 'jkr',     '4.1.8: a merging transition L = 0.45 V W to 0.6 V W, at least 30 m in town (V 20 km/h, W 3.3 m: 30 m)'),
    'split_taper':   (7.0,  'jkr',     '4.1.8: a diverging transition L = 0.15 V W to 0.3 V W (V 20 km/h, W 1.2 m); site-adjusted, the apron in front of the hill strips is 14 m deep'),
    'chevron_lead':  (5.0,  'jkr',     'Fig 14: the double line run on from a chevron area\'s tip, 5 m or to suit the site'),
}


def v(key):
    return DESIGN[key][0]


def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def in_poly(p, poly):
    x, y = p
    inside = False
    for (xi, yi), (xj, yj) in zip(poly, poly[-1:] + poly[:-1]):
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
    return inside


def polys_overlap(a, b):
    """Convex polygons overlap (separating axis)."""
    for poly in (a, b):
        for (x0, y0), (x1, y1) in zip(poly, poly[1:] + poly[:1]):
            nx, ny = y0 - y1, x1 - x0
            pa = [nx * x + ny * y for x, y in a]
            pb = [nx * x + ny * y for x, y in b]
            if max(pa) < min(pb) or max(pb) < min(pa):
                return False
    return True


def wrap_deg(d):
    return (d + 180.0) % 360.0 - 180.0


class Roads:
    """The two-way roads lane_centres measured, section by section."""

    def __init__(self, roads):
        self.roads = roads

    def find(self, axis, near):
        return min((r for r in self.roads if r['axis'] == axis), key=lambda r: abs(r['mid'] - near))

    def section(self, axis, near, along):
        r = self.find(axis, near)
        best = min(r['sections'], key=lambda s: 0 if s[0] <= along <= s[1] else min(abs(along - s[0]), abs(along - s[1])))
        return best[2], best[3]

    def lane(self, axis, near, along, heading):
        """A lane's middle: keep left. heading: 'e', 'w', 'n', 's'."""
        m, w = self.section(axis, near, along)
        return m + {'e': w / 4, 'w': -w / 4, 'n': -w / 4, 's': w / 4}[heading]


def build(L, pts, stations, roads_list, world, keep_mask, Turtle, car):
    roads = Roads(roads_list)
    RL, RR = v('turn_left_r'), v('turn_right_r')
    res = world.res

    def paved(x, y):
        ix, iy = int((x - world.x0) / res), int((y - world.y0) / res)
        return 0 <= iy < world.mask.shape[0] and 0 <= ix < world.mask.shape[1] and bool(world.mask[iy, ix])

    def kept(x, y):
        ix, iy = int((x - world.x0) / res), int((y - world.y0) / res)
        return 0 <= iy < keep_mask.shape[0] and 0 <= ix < keep_mask.shape[1] and bool(keep_mask[iy, ix])

    # ------------------------------------------------------------ junction boxes: where roads meet
    junctions = []
    ew = [r for r in roads_list if r['axis'] == 'ew']
    ns = [r for r in roads_list if r['axis'] == 'ns']
    for e in ew:
        for n in ns:
            if not (e['a0'] - 3 <= n['mid'] <= e['a1'] + 3 and n['a0'] - 4 <= e['mid'] <= n['a1'] + 4):
                continue
            secs = [s for s in n['sections']]
            x0 = min(m - w / 2 for _, _, m, w in secs)
            x1 = max(m + w / 2 for _, _, m, w in secs)
            em, ewid = e['mid'], e['width']
            name = 'spine' if abs(em - 25.6) < 2 else 'top' if abs(em - 55.4) < 2 else 'bottom' if abs(em - 3.2) < 2 else 'ew%d' % round(em)
            junctions.append(dict(id='%s-%d' % (name, math.floor(n['mid'] + 0.5)),
                                  polygon=rect(round(x0, 2), round(em - ewid / 2, 2), round(x1, 2), round(em + ewid / 2, 2))))
    # Two roads meeting a third at the same place from either side (a crossroads, a little staggered: lane C-D and the
    # lane south of the spine road, the three-point turn's until 20 Oct) share one box. Two overlapping boxes let two
    # cars each hold half the crossroads and wait for the other (the owner saw three cars stuck at J2, 20 Oct).
    def extent(poly):
        return min(q[0] for q in poly), min(q[1] for q in poly), max(q[0] for q in poly), max(q[1] for q in poly)
    shared = []
    for j in junctions:
        a = extent(j['polygon'])
        twin = next((k for k in shared if k['id'].split('-')[0] == j['id'].split('-')[0]
                     and extent(k['polygon'])[0] < a[2] and a[0] < extent(k['polygon'])[2]), None)
        if twin is None:
            shared.append(j)
            continue
        b = extent(twin['polygon'])
        twin['polygon'] = rect(min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))
    junctions = shared
    # the band's mouth and the bottom road's west end, on the west road's south section
    wm, ww_ = roads.section('ns', 40.3, 10.0)
    junctions.append(dict(id='band-mouth', polygon=rect(round(wm - ww_ / 2, 2), 0.0, round(wm + ww_ / 2, 2), 12.0)))
    jbox = {j['id']: j for j in junctions}
    spine_m, spine_w = roads.section('ew', 25.6, 80.0)
    J1 = next(j for j in junctions if j['id'] == 'spine-75')
    J2 = next(j for j in junctions if j['id'] == 'spine-63')
    J1['signal'] = 'J1'   # J2 stays unsignalled: 4.4 m apart, two signals would trap a car between them (decided 20 Oct)

    # ------------------------------------------------------------ the other cars' loops (keep left)
    def loop_points(t):
        return [[round(q[1], 3), round(q[2], 3)] for q in t.pts[::2]]

    e_spine, w_spine = roads.lane('ew', 25.6, 80, 'e'), roads.lane('ew', 25.6, 80, 'w')
    e_top, w_top = roads.lane('ew', 55.5, 60, 'e'), roads.lane('ew', 55.5, 60, 'w')
    n74, s74 = roads.lane('ns', 74.5, 40, 'n'), roads.lane('ns', 74.5, 40, 's')
    n52, s52 = roads.lane('ns', 52.3, 40, 'n'), roads.lane('ns', 52.3, 40, 's')
    n_west = roads.lane('ns', 40.3, 15, 'n')
    s_east = roads.lane('ns', 112.3, 15, 's')
    w_bottom = roads.lane('ew', 3.0, 80, 'w')
    loops = []
    # A: against the learner, round islands C and D the other way, every turn a left
    t = Turtle(n74, 40.0, 90.0, 3.6)
    t.line_to(w_top - RL, 3.6); t.arc(RL, 90, 3.6)
    t.line_to(s52 + RL, 3.6); t.arc(RL, 90, 3.6)
    t.line_to(e_spine + RL, 3.6); t.arc(RL, 90, 3.6)
    t.line_to(n74 - RL, 3.6); t.arc(RL, 90, 3.6)
    t.line_to(40.0, 3.6)
    loops.append(dict(id='island-ccw', kmh=v('loop_kmh'), cars=1, points=loop_points(t), length=round(t.s, 2),
                      note='round islands C and D by left turns: against the learner on lane D-E, the spine road and the top road'))
    # B: with the learner, round the same islands by right turns
    t = Turtle(s74, 40.0, 270.0, 3.6)
    t.line_to(w_spine + RR, 3.6); t.arc(RR, -90, 3.6)
    t.line_to(n52 + RR, 3.6); t.arc(RR, -90, 3.6)
    t.line_to(e_top - RR, 3.6); t.arc(RR, -90, 3.6)
    t.line_to(s74 - RR, 3.6); t.arc(RR, -90, 3.6)
    t.line_to(40.0, 3.6)
    loops.append(dict(id='island-cw', kmh=v('loop_kmh'), cars=1, points=loop_points(t), length=round(t.s, 2),
                      note='round islands C and D by right turns: the learner\'s way down lane D-E and along the spine road'))
    # C: the outer loop, which brings the merge's main road traffic down the east road
    t = Turtle(n_west, 14.0, 90.0, 3.6)
    t.line_to(e_spine - RR, 3.6); t.arc(RR, -90, 3.6)
    t.line_to(s_east - RR, 3.6); t.arc(RR, -90, 3.6)
    t.line_to(w_bottom + RR, 3.6); t.arc(RR, -90, 3.6)
    t.line_to(n_west + RR, 3.6); t.arc(RR, -90, 3.6)
    t.line_to(14.0, 3.6)
    outer = t
    loops.append(dict(id='outer', kmh=v('main_kmh'), cars=1, points=loop_points(t), length=round(t.s, 2),
                      note='up the west road, along the spine road, down the east road, back along the bottom road'))
    # D: round the roundabout, clockwise (traffic keeps left): the traffic road merging joins (the owner, 20 Oct)
    rc, rr = L['rb_c'], L['rb_r']
    t = Turtle(rc[0] + rr, rc[1], 270.0, 3.6)
    t.arc(rr, -360.0, 3.6)
    ring_pts = loop_points(t)
    if math.hypot(ring_pts[-1][0] - ring_pts[0][0], ring_pts[-1][1] - ring_pts[0][1]) < 0.05:
        ring_pts = ring_pts[:-1]
    loops.append(dict(id='roundabout', kmh=v('ring_kmh'), cars=2, points=ring_pts, length=round(t.s, 2),
                      note='round the roundabout, clockwise: the traffic the last station joins'))

    # ------------------------------------------------------------ signals
    cyc = v('cycle')
    signals = []
    for sig, box, offset in (('J1', J1, v('offsets')[0]),):
        (x0, y0), _, (x1, y1), _ = box['polygon']
        nm = (x0 + x1) / 2
        so = v('stop_off')
        approaches = [
            dict(group='ew', heading_deg=0.0, stop=[[x0 - so, spine_m], [x0 - so, y1]]),           # from the west, eastbound lane
            dict(group='ew', heading_deg=180.0, stop=[[x1 + so, y0], [x1 + so, spine_m]]),         # from the east, westbound lane
            dict(group='ns', heading_deg=270.0, stop=[[nm, y1 + so], [x1, y1 + so]]),              # from the north, southbound lane
        ]
        heads = []
        for a in approaches:
            (ax, ay), (bx, by) = a['stop']
            h = math.radians(a['heading_deg'])
            # on the near side's left, past the kerb, facing the drivers it governs
            lx, ly = -math.sin(h), math.cos(h)
            end = (ax, ay) if (ax - (ax + bx) / 2) * lx + (ay - (ay + by) / 2) * ly > 0 else (bx, by)
            heads.append(dict(at=[round(end[0] + lx * 0.9 - math.cos(h) * 0.4, 2), round(end[1] + ly * 0.9 - math.sin(h) * 0.4, 2)],
                              heading_deg=round((a['heading_deg'] + 180) % 360, 1), group=a['group']))
        signals.append(dict(id=sig, junction=box['id'], offset_s=offset,
                            phases=dict(ew=dict(green=cyc[0], amber=cyc[1], all_red=cyc[2]), ns=dict(green=cyc[3], amber=cyc[4], all_red=cyc[5])),
                            approaches=[dict(a, stop=[[round(p[0], 2), round(p[1], 2)] for p in a['stop']]) for a in approaches],
                            heads=heads))

    # ------------------------------------------------------------ the merge, at the roundabout
    # the route joins the circle at its mark 'rb_join'; the give-way line crosses the approach lane just before the join
    # arc starts, 3.7 m from the circulating lane's edge (JKR 4.2.3: 1.2 m to 10 m)
    join = next(q for q in pts if q[0] >= L['marks']['rb_join'])
    cum = [0.0]
    for a, b in zip(ring_pts, ring_pts[1:]):
        cum.append(cum[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    k_cp = min(range(len(ring_pts)), key=lambda k: math.hypot(ring_pts[k][0] - join[1], ring_pts[k][1] - join[2]))
    gx = L['rb_entry_x'] + 0.3
    merge = dict(give_way=[[round(gx, 2), round(spine_m - spine_w / 2 + 0.2, 2)], [round(gx, 2), round(spine_m, 2)]], heading_deg=180.0,
                 loop='roundabout', conflict_point=ring_pts[k_cp], conflict_s=round(cum[k_cp], 2),
                 window=[round(cum[k_cp] - 20.0, 2), round(cum[k_cp] + 4.0, 2)], gap_s=v('gap_s'), junction='roundabout',
                 note='the learner gives way at the roundabout\'s entry to the cars already going round, which have priority, and joins them')

    # ------------------------------------------------------------ the zebra crossing (between the booths at x 46)
    zx, zlen, zstripe, zgap = v('zebra')
    zebra = dict(centre=[zx, round(spine_m, 2)], heading_deg=0.0, length=zlen, width=round(spine_w, 2), stripe=zstripe, gap=zgap,
                 note='between the examiners\' booths on island B and on the Z island, across the spine road')
    zebra_box = rect(zx - zlen / 2, spine_m - spine_w / 2, zx + zlen / 2, spine_m + spine_w / 2)

    # ------------------------------------------------------------ where each station's queue waits, and its pole
    S = np.array([q[0] for q in pts])
    back = car['length_m'] - car['wheelbase_m'] - car['front_overhang_m']
    nose = car['wheelbase_m'] + car['front_overhang_m']
    half = car['width_body_m'] / 2

    def pose(s):
        i = int(np.clip(np.searchsorted(S, s), 0, len(S) - 1))
        return pts[i]

    def footprint(x, y, h, m=0.0):
        c, s_ = math.cos(h), math.sin(h)
        return [(x + c * al - s_ * ac, y + s_ * al + c * ac) for al, ac in ((-back - m, -half - m), (nose + m, -half - m), (nose + m, half + m), (-back - m, half + m))]

    boxes = [j['polygon'] for j in junctions] + [zebra_box]
    for sg in signals:                               # a queue waits behind the stop line, never on it
        for a in sg['approaches']:
            (ax, ay), (bx, by) = a['stop']
            boxes.append(rect(min(ax, bx) - 0.15, min(ay, by) - 0.15, max(ax, bx) + 0.15, max(ay, by) + 0.15))
    waiting = []
    for st in sorted(stations, key=lambda g: g['order']):
        found = None
        s_rear = st['s_from'] - 0.3 - nose
        while s_rear > st['s_from'] - 40:
            q = pose(s_rear)
            ahead = pose(s_rear + nose)
            behind = pose(s_rear - back - 1.0)
            straight = abs(wrap_deg(math.degrees(ahead[3] - behind[3]))) < 3.0 and math.hypot(ahead[1] - q[1], ahead[2] - q[2]) < nose + 0.5
            fp = footprint(q[1], q[2], q[3], 0.2)
            if straight and not any(polys_overlap(fp, b) for b in boxes):
                found = q
                break
            s_rear -= 0.25
        if not found:
            raise SystemExit('no waiting spot for %s' % st['id'])
        x, y, h = found[1], found[2], found[3]
        fx, fy = x + math.cos(h) * nose, y + math.sin(h) * nose
        pole, side = None, None
        for sgn, name in ((1, 'left'), (-1, 'right')):
            lx, ly = -math.sin(h) * sgn, math.cos(h) * sgn
            for k in range(int(half / res), int(9.0 / res)):
                px, py = fx + lx * k * res, fy + ly * k * res
                if not paved(px, py):
                    pole, side = (px + lx * 0.5, py + ly * 0.5), name
                    break
            if pole:
                break
        waiting.append(dict(station=st['id'], s=round(float(found[0]), 2), at=[round(x, 3), round(y, 3)], heading_deg=round(math.degrees(h) % 360, 2),
                            front=[round(fx, 3), round(fy, 3)], pole=[round(pole[0], 2), round(pole[1], 2)], pole_side=side,
                            pole_gap=round(math.hypot(pole[0] - fx, pole[1] - fy), 2)))

    # ------------------------------------------------------------ direction arrows, from the movements traffic makes
    route_xy = [(q[1], q[2], q[3]) for q in pts]
    paths = [('route', route_xy)]
    for lp in loops:
        p_ = lp['points']
        xy = [(p_[i][0], p_[i][1], math.atan2(p_[(i + 1) % len(p_)][1] - p_[i - 1][1], p_[(i + 1) % len(p_)][0] - p_[i - 1][0])) for i in range(len(p_))]
        paths.append((lp['id'], xy + xy[:40]))
    groups = {}
    for name, xy in paths:
        for j in junctions:
            if j['id'] == 'band-mouth':
                continue
            poly = j['polygon']
            inside = [in_poly((p[0], p[1]), poly) for p in xy]
            k = 1
            while k < len(xy):
                if inside[k] and not inside[k - 1] and math.hypot(xy[k][0] - xy[k - 1][0], xy[k][1] - xy[k - 1][1]) < 1.0:
                    e = k
                    while e < len(xy) and inside[e]:
                        e += 1
                    if e < len(xy):
                        h_in, h_out = math.degrees(xy[k - 1][2]), math.degrees(xy[e][2])
                        turn = wrap_deg(h_out - h_in)
                        move = 'L' if turn > 45 else 'R' if turn < -45 else 'S'
                        # the arrow: arrow_back metres before the box on this path, or 2.3 m where the junctions
                        # come close together (the spine road's are 4.4 m apart)
                        spots = []
                        for back_m in (v('arrow_back'), 2.3):
                            b = k - 1
                            dist = 0.0
                            while b > 0 and dist < back_m:
                                dist += math.hypot(xy[b][0] - xy[b - 1][0], xy[b][1] - xy[b - 1][1])
                                b -= 1
                            spots.append((xy[b][0], xy[b][1]))
                        hx = round(h_in / 90.0) * 90.0 % 360
                        key = (j['id'], hx, round(xy[k - 1][0] if hx in (90.0, 270.0) else xy[k - 1][1], 0))
                        g = groups.setdefault(key, dict(moves=set(), at=[], heading=hx))
                        g['moves'].add(move)
                        g['at'].append(spots)
                    k = e
                k += 1
    arrows = []
    for (jid, hx, _), g in sorted(groups.items()):
        h = math.radians(hx)
        for k in range(2):
            ax = float(np.mean([p[k][0] for p in g['at']]))
            ay = float(np.mean([p[k][1] for p in g['at']]))
            ends = [(ax + math.cos(h) * e, ay + math.sin(h) * e) for e in (-1.5, 0.0, 1.5)]   # JKR Fig 19: an urban arrow is 3.0 m long
            if any(kept(*q) or not paved(*q) or in_poly(q, zebra_box) or any(in_poly(q, j['polygon']) for j in junctions) for q in ends):
                continue
            kind = ''.join(m for m in 'LSR' if m in g['moves'])
            arrows.append(dict(at=[round(ax, 2), round(ay, 2)], heading_deg=hx, kind=kind, junction=jid))
            break

    # ------------------------------------------------------------ chevrons
    hy, hh, wwall = L['hill_y'], L['hill_w'] / 2, L['wall_w']
    hx0 = L['hill_x0_wall']
    split_y = hy + hh + wwall / 2                    # the wall between our hill strip and the twin's
    st_ = v('split_taper')
    chevrons = [
        dict(polygon=[[round(hx0, 2), round(split_y - 1.2, 2)], [round(hx0, 2), round(split_y + 1.2, 2)], [round(hx0 - st_, 2), round(split_y, 2)]], heading_deg=0.0,
             tip=[round(hx0 - st_, 2), round(split_y, 2)], lead=v('chevron_lead'),
             note='the lane split in front of the wall between the two hill strips (JKR Fig 14, diverging)'),
    ]

    # ------------------------------------------------------------ stop, give-way and edge lines
    stop_lines = [a['stop'] for sg in signals for a in sg['approaches']]
    zs = v('zebra_stop')
    stop_lines += [[[round(zx - zlen / 2 - zs, 2), round(spine_m, 2)], [round(zx - zlen / 2 - zs, 2), round(spine_m + spine_w / 2 - 0.2, 2)]],
                   [[round(zx + zlen / 2 + zs, 2), round(spine_m - spine_w / 2 + 0.2, 2)], [round(zx + zlen / 2 + zs, 2), round(spine_m, 2)]]]
    give_way = [merge['give_way']]
    edge_lines = []
    for r in roads_list:
        if r['width'] < 6.0:
            continue
        for a, b, m, w in r['sections']:
            for sgn in (1, -1):
                cur = []
                for t_ in list(np.arange(a, b + 0.01, 0.25)) + [None]:
                    ok = False
                    if t_ is not None:
                        off = m + sgn * (w / 2 - v('edge_in'))
                        out = m + sgn * (w / 2 + 0.4)
                        x, y = (t_, off) if r['axis'] == 'ew' else (off, t_)
                        xo, yo = (t_, out) if r['axis'] == 'ew' else (out, t_)
                        ok = paved(x, y) and not paved(xo, yo) and not kept(x, y) and not any(in_poly((x, y), j['polygon']) for j in junctions)
                    if ok:
                        cur.append([round(float(x), 2), round(float(y), 2)])
                    elif cur:
                        if math.hypot(cur[-1][0] - cur[0][0], cur[-1][1] - cur[0][1]) >= 3.0:
                            edge_lines.append([cur[0], cur[-1]])
                        cur = []

    # the second 3-side parking bay (the owner, 20 Oct): the pocket off the lane cut into island F, painted as station
    # 2's is, with another learner reversed into it
    fx0, fx1 = L['M'](1044, 0)[0], L['M'](1100.5, 0)[0]
    fy0, fy1 = L['M'](0, 382)[1], L['M'](0, 332)[1]
    twin_bay = dict(centre=[round((fx0 + fx1) / 2, 3), round((fy0 + fy1) / 2, 3)], axis_deg=180.0, length=5.0, width=2.6,
                    note='the second 3-side parking bay, in the pocket off the lane cut into island F; its mouth faces west')

    traffic = dict(loops=loops, junctions=junctions, signals=signals, merge=merge, waiting=waiting, zebra=zebra,
                   parameters={k: dict(value=val, source=src, note=note) for k, (val, src, note) in DESIGN.items()})
    # yellow box junctions at J1 (signalled) and J2 (the crossroads): no waiting in them (JKR 4.3.7, Fig 24)
    yellow_boxes = [J1['polygon'], J2['polygon']]
    markings = dict(edge_lines=edge_lines, stop_lines=stop_lines, give_way=give_way, arrows=arrows, chevrons=chevrons, zebras=[zebra],
                    yellow_boxes=yellow_boxes, bays=[twin_bay])
    return traffic, markings, zebra_box, [lp['points'] for lp in loops], twin_bay
