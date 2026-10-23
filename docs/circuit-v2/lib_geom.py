"""Shared geometry for the circuit-v2 generator and checks.

The car is a kinematic bicycle posed at its rear-axle centre: x, y in metres, heading th in
radians (counter-clockwise from +x = east), car frame x forward, y left. The world is a raster:
a drivable mask at RES metres per pixel and a signed clearance field (metres inside the drivable
area, negative outside).
"""
import json
import math
import os

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))


class Car:
    """Read from a car config file, so the car can be swapped without touching the circuit."""

    def __init__(self, cfg):
        self.name = cfg['name']
        self.L, self.W = cfg['length_m'], cfg['width_body_m']
        self.W_mirrors = cfg.get('width_mirrors_m', self.W)
        self.wb, self.track = cfg['wheelbase_m'], cfg['track_m']
        self.steer = cfg['steer_lock_rad']
        self.tyre_w, self.tyre_r = cfg['tyre_width_m'], cfg['tyre_radius_m']
        self.f_oh = cfg['front_overhang_m']
        self.r_oh = self.L - self.wb - self.f_oh
        self.R = self.wb / math.tan(self.steer)          # rear-axle radius at full lock

    @classmethod
    def load(cls, path=None):
        with open(path or os.path.join(HERE, 'car-swift-2022.json'), encoding='utf-8') as f:
            return cls(json.load(f))

    def tyre_half(self, kerb_h):
        """Half-length of the tyre's chord at kerb height: where a tyre first meets a kerb."""
        r = self.tyre_r
        return math.sqrt(max(r * r - (r - kerb_h) ** 2, 0.0))

    def body_swept(self, R):
        inner = R - self.W / 2
        outer = math.hypot(R + self.W / 2, self.wb + self.f_oh)
        return inner, outer, outer - inner

    def heading_limit(self, bay_w, mirrors=True):
        """PRD: the largest yaw t with L*sin t + W*cos t <= bay width (W over the mirrors)."""
        W = self.W_mirrors if mirrors else self.W
        if bay_w < W:
            return float('nan')
        d = math.hypot(self.L, W)
        return math.asin(min(bay_w / d, 1.0)) - math.atan2(W, self.L)

    def _world(self, pts, x, y, th):
        c, s = math.cos(th), math.sin(th)
        return [(x + px * c - py * s, y + px * s + py * c) for px, py in pts]

    def corners(self, x, y, th, mirrors=False):
        """Footprint corners. With mirrors=True the footprint is as wide as the mirrors: the bay
        rules judge the car with its mirrors in (a learner's account: the right mirror must be
        inside the box)."""
        xf, xr = self.wb + self.f_oh, -self.r_oh
        hw = (self.W_mirrors if mirrors else self.W) / 2
        return self._world([(xf, hw), (xf, -hw), (xr, -hw), (xr, hw)], x, y, th)

    def front_centre(self, x, y, th):
        xf = self.wb + self.f_oh
        return (x + xf * math.cos(th), y + xf * math.sin(th))

    def body_outline(self, x, y, th, n=6):
        xf, xr, hw = self.wb + self.f_oh, -self.r_oh, self.W / 2
        pts = []
        for i in range(n + 1):
            t = xr + (xf - xr) * i / n
            pts += [(t, hw), (t, -hw)]
        for i in range(1, 4):
            t = -hw + 2 * hw * i / 4
            pts += [(xf, t), (xr, t)]
        return self._world(pts, x, y, th)

    def tyre_outline(self, x, y, th, delta, kerb_h=0.13):
        half = self.tyre_half(kerb_h)
        pts = []
        for ax, d in ((0.0, 0.0), (self.wb, delta)):
            for side in (1, -1):
                cx, cy = ax, side * self.track / 2
                c, s = math.cos(d), math.sin(d)
                for u in (-half, 0.0, half):
                    for v in (-self.tyre_w / 2, self.tyre_w / 2):
                        pts.append((cx + u * c - v * s, cy + u * s + v * c))
        return self._world(pts, x, y, th)


def step(car, x, y, th, ds, delta):
    """Advance the rear axle by arc length ds (negative = reverse) at steer delta."""
    k = math.tan(delta) / car.wb
    if abs(k) < 1e-9:
        return x + ds * math.cos(th), y + ds * math.sin(th), th
    dth = ds * k
    r = 1.0 / k
    return (x + r * (math.sin(th + dth) - math.sin(th)),
            y - r * (math.cos(th + dth) - math.cos(th)), th + dth)


class World:
    """Raster world: polygons in metres drawn onto a mask, then a signed clearance field."""

    def __init__(self, x0, y0, x1, y1, res=0.05):
        self.x0, self.y0, self.res = x0, y0, res
        self.w = int(math.ceil((x1 - x0) / res)) + 1
        self.h = int(math.ceil((y1 - y0) / res)) + 1
        self.img = Image.new('L', (self.w, self.h), 0)
        self.draw = ImageDraw.Draw(self.img)
        self.obstacles = []          # (x, y, radius): poles and cones hit by the body

    def px(self, pts):
        # image row 0 is the SOUTH edge here; flip only when saving pictures
        return [((x - self.x0) / self.res, (y - self.y0) / self.res) for x, y in pts]

    def add(self, poly):
        self.draw.polygon(self.px(poly), fill=255)

    def cut(self, poly):
        self.draw.polygon(self.px(poly), fill=0)

    def finish(self):
        m = np.asarray(self.img) > 127
        self.mask = m
        self.field = np.where(m, ndi.distance_transform_edt(m), -ndi.distance_transform_edt(~m)) * self.res
        return self

    def clearance(self, pts):
        a = np.asarray(pts, float)
        ix = np.clip(np.rint((a[:, 0] - self.x0) / self.res).astype(int), 0, self.w - 1)
        iy = np.clip(np.rint((a[:, 1] - self.y0) / self.res).astype(int), 0, self.h - 1)
        return float(self.field[iy, ix].min())

    def obstacle_clearance(self, pts):
        if not self.obstacles:
            return float('inf')
        a = np.asarray(pts, float)
        return float(min(np.hypot(a[:, 0] - ox, a[:, 1] - oy).min() - r for ox, oy, r in self.obstacles))


def follow(car, world, path, lookahead=2.5, ds=0.05, start=None, kerb_h=0.13):
    """Pure-pursuit the rear axle along a centreline polyline [(x, y), ...].
    Returns per-step records: arc position s along the path, pose, steer, clearances."""
    P = np.asarray(path, float)
    seg = np.diff(P, axis=0)
    Ls = np.hypot(seg[:, 0], seg[:, 1])
    S = np.concatenate([[0], np.cumsum(Ls)])
    total = S[-1]

    def at(s):
        s = min(max(s, 0.0), total)
        i = min(np.searchsorted(S, s, side='right') - 1, len(seg) - 1)
        t = (s - S[i]) / Ls[i] if Ls[i] > 0 else 0.0
        return P[i] + seg[i] * t

    x, y = P[0]
    th = math.atan2(seg[0][1], seg[0][0])
    if start is not None:
        x, y, th = start
    s_now, out, i_hint = 0.0, [], 0
    while s_now < total - 0.3:
        lo = max(0, i_hint - 40)
        hi = min(len(seg), i_hint + 80)
        best, bs, bi = 1e9, s_now, i_hint
        for i in range(lo, hi):
            a, d = P[i], seg[i]
            t = 0.0 if Ls[i] == 0 else max(0.0, min(1.0, ((x - a[0]) * d[0] + (y - a[1]) * d[1]) / Ls[i] ** 2))
            q = a + d * t
            e = math.hypot(x - q[0], y - q[1])
            if e < best and S[i] + t * Ls[i] >= s_now - 2.0:
                best, bs, bi = e, S[i] + t * Ls[i], i
        s_now, i_hint = max(s_now, bs), bi
        tx, ty = at(s_now + lookahead)
        alpha = math.atan2(ty - y, tx - x) - th
        alpha = math.atan2(math.sin(alpha), math.cos(alpha))
        delta = max(-car.steer, min(car.steer, math.atan2(2 * car.wb * math.sin(alpha), lookahead)))
        x, y, th = step(car, x, y, th, ds, delta)
        out.append((s_now, x, y, th, delta, best,
                    world.clearance(car.body_outline(x, y, th)),
                    world.clearance(car.tyre_outline(x, y, th, delta, kerb_h)),
                    world.obstacle_clearance(car.body_outline(x, y, th))))
        if len(out) > 400000:
            break
    return out


def run_move(car, world, pose, direction, delta, crit='tyre', margin=0.05, ds=0.02, max_len=40.0,
             kerb_h=0.13):
    """One movement at fixed steer until the next step would break the criterion. The stop must
    leave room for the steered tyres at either lock, because the next movement swaps lock."""
    x, y, th = pose
    travelled = 0.0
    while travelled < max_len:
        nx, ny, nth = step(car, x, y, th, direction * ds, delta)
        body = car.body_outline(nx, ny, nth)
        tyre = min(world.clearance(car.tyre_outline(nx, ny, nth, delta, kerb_h)),
                   world.clearance(car.tyre_outline(nx, ny, nth, -delta, kerb_h)))
        bad = (tyre < margin) if crit == 'tyre' else (world.clearance(body) < margin)
        if bad or world.obstacle_clearance(body) < 0.0:
            break
        x, y, th = nx, ny, nth
        travelled += ds
    return (x, y, th), travelled


def three_point(car, world, start, turn, crit='tyre', margin=0.05, need_deg=148.0, moves=3):
    """Full lock toward the far side, reverse on the opposite lock, repeat. Returns
    (reached, [(heading change after each movement, distance), ...])."""
    pose, th0, hist = start, start[2], []
    for m in range(moves):
        fwd = (m % 2 == 0)
        delta = turn * car.steer if fwd else -turn * car.steer
        pose, d = run_move(car, world, pose, 1 if fwd else -1, delta, crit, margin)
        change = abs(math.degrees(pose[2] - th0))
        hist.append((round(change, 1), round(d, 2)))
        if change >= need_deg:
            return True, hist
    return False, hist


def inside_rect(pts, cx, cy, ang, half_l, half_w, tol=0.0):
    c, s = math.cos(-ang), math.sin(-ang)
    for px, py in pts:
        dx, dy = px - cx, py - cy
        u, v = dx * c - dy * s, dx * s + dy * c
        if abs(u) > half_l + tol or abs(v) > half_w + tol:
            return False
    return True


def path_ok(car, world, pose, moves, crit='tyre', margin=0.05, ds=0.05, kerb_h=0.13):
    x, y, th = pose
    for direction, delta, length in moves:
        n = max(1, int(round(length / ds)))
        for _ in range(n):
            x, y, th = step(car, x, y, th, direction * length / n, delta)
            body = car.body_outline(x, y, th)
            c = world.clearance(car.tyre_outline(x, y, th, delta, kerb_h)) if crit == 'tyre' else world.clearance(body)
            if c < margin or world.obstacle_clearance(body) < 0:
                return None
    return (x, y, th)


def reverse_into_bay(car, world, bay, aisle_heading, crit='tyre', margin=0.05):
    """Reverse 90 degrees into a bay off an aisle: one full-lock reverse arc, then straight back.
    bay = dict(centre, axis_deg, length, width): axis_deg points from the bay's back to its mouth.
    Returns (heading error deg, start pose, end pose) for the best plan, or None."""
    cx, cy = bay['centre']
    ang = math.radians(bay['axis_deg'])
    hd, hw = bay['length'] / 2, bay['width'] / 2
    lim = car.heading_limit(bay['width'])
    mx, my = cx + hd * math.cos(ang), cy + hd * math.sin(ang)
    turn = math.atan2(math.sin(ang - aisle_heading), math.cos(ang - aisle_heading))
    lock = car.steer if turn < 0 else -car.steer
    ux, uy = math.cos(aisle_heading), math.sin(aisle_heading)
    best = None
    for along in np.arange(0.0, 8.01, 0.2):
        for off in np.arange(1.2, 6.01, 0.2):
            pose = (mx + ux * along + math.cos(ang) * off, my + uy * along + math.sin(ang) * off, aisle_heading)
            if world.clearance(car.tyre_outline(*pose, 0.0)) < margin:
                continue
            for sweep in (abs(turn),):
                mid = path_ok(car, world, pose, [(-1, lock, car.R * sweep)], crit, margin)
                if mid is None:
                    continue
                prev = mid
                for _ in range(int(2 * hd / 0.05) + 1):
                    if inside_rect(car.corners(*prev, mirrors=True), cx, cy, ang, hd, hw):
                        err = abs(math.atan2(math.sin(prev[2] - ang), math.cos(prev[2] - ang)))
                        if err <= lim and (best is None or err < best[0]):
                            best = (math.degrees(err), pose, prev)
                        break
                    nxt = path_ok(car, world, prev, [(-1, 0.0, 0.05)], crit, margin)
                    if nxt is None:
                        break
                    prev = nxt
    return best


def parallel_into_slot(car, world, slot, road_heading, crit='tyre', margin=0.05):
    """Two-arc reverse into a parallel slot on the LEFT of travel (traffic keeps left).
    slot = dict(centre, length, width) with its long axis along road_heading."""
    cx, cy = slot['centre']
    hl, hw = slot['length'] / 2, slot['width'] / 2
    lim = car.heading_limit(slot['width'])
    ux, uy = math.cos(road_heading), math.sin(road_heading)
    lx, ly = -uy, ux
    best = None
    for out in np.arange(0.4, 2.41, 0.2):
        for ahead in np.arange(0.0, 6.01, 0.5):
            off = hw + out + car.W / 2
            pose = (cx + ux * ahead - lx * off, cy + uy * ahead - ly * off, road_heading)
            if world.clearance(car.tyre_outline(*pose, 0.0)) < margin:
                continue
            for phi in np.radians(np.arange(25, 61, 2.5)):
                for straight in np.arange(0.0, 3.01, 0.25):
                    a1 = car.R * phi
                    end = path_ok(car, world, pose, [(-1, car.steer, a1), (-1, 0.0, straight), (-1, -car.steer, a1)],
                                  crit, margin)
                    if end is None:
                        continue
                    if inside_rect(car.corners(*end, mirrors=True), cx, cy, road_heading, hl, hw):
                        err = abs(math.atan2(math.sin(end[2] - road_heading), math.cos(end[2] - road_heading)))
                        if err <= lim and (best is None or err < best[0]):
                            best = (math.degrees(err), dict(out=round(float(out), 2), ahead=round(float(ahead), 2),
                                    phi_deg=round(math.degrees(phi), 1), straight=round(float(straight), 2)), end)
                            if err < 1e-6:
                                return best
    return best


def reverse_out(car, world, pose, target_heading, lane_test, crit='tyre', margin=0.05):
    """Back out of a dead end: straight back, then reverse on full lock until the car faces
    target_heading (within 15 deg). lane_test(x, y, th) says whether the end pose is in the lane.
    Returns (straight metres, lock side, end pose) or None."""
    x, y, th = pose
    for back in np.arange(0.0, 25.01, 0.5):
        start = path_ok(car, world, pose, [(-1, 0.0, back)], crit, margin) if back > 0 else pose
        if start is None:
            break
        for side in (1, -1):
            p = start
            for _ in range(int(car.R * math.pi / 0.05)):
                nxt = path_ok(car, world, p, [(-1, side * car.steer, 0.05)], crit, margin)
                if nxt is None:
                    break
                p = nxt
                err = abs(math.atan2(math.sin(p[2] - target_heading), math.cos(p[2] - target_heading)))
                if err < math.radians(15) and lane_test(*p):
                    return round(float(back), 2), ('left' if side > 0 else 'right'), p
    return None
