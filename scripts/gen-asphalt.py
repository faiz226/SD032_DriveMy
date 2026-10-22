"""The yard's asphalt texture (the owner, 20 Oct: dark grey asphalt with slight texture variation, not flat black
or bright grey). Procedural and seeded, so it rebuilds the same: tileable noise in three bands (the stones'
grain, the wear patches a yard gets, and a few lighter and darker stones), around a weathered asphalt's grey.

Run:  python scripts/gen-asphalt.py        (writes public/sim/textures/asphalt-512.webp and -1024.webp)
"""
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'public', 'sim', 'textures')
BASE = np.array([92.0, 90.0, 88.0])   # sRGB: weathered asphalt, albedo about 0.1; a touch warm, as the blue sky cools it
SEED = 20261020


def band(n, rng, lo, hi):
    """Tileable noise whose spatial frequencies (cycles per tile) roll in at lo and out at hi, both smoothly (a
    hard-edged band rings into worm-like loops), scaled to unit spread."""
    f = np.fft.fftfreq(n) * n
    r = np.hypot(*np.meshgrid(f, f))
    gain = np.exp(-(r / hi) ** 2) * (1.0 - np.exp(-(r / max(lo, 1e-6)) ** 2))
    out = np.real(np.fft.ifft2(np.fft.fft2(rng.standard_normal((n, n))) * gain))
    return out / (out.std() or 1.0)


def texture(n, rng):
    px = n / 512                                  # pixels per pixel of the 512 version: same look at both sizes
    grain = band(n, rng, n / 64, n / (2.2 * px))  # the mix's fine stones and sand
    mottle = band(n, rng, 0.8, 5.0)               # wear and patching, metres across, faint
    img = BASE + 8.0 * grain[..., None] + 2.0 * mottle[..., None]
    # loose stones: a few lighter, a few darker, about 2 cm across
    yy, xx = np.mgrid[0:n, 0:n]
    for count, lift in ((int(0.006 * n * n / px ** 2), 34.0), (int(0.004 * n * n / px ** 2), -20.0)):
        cx, cy = rng.integers(0, n, count), rng.integers(0, n, count)
        size = rng.uniform(0.6, 1.6, count) * px
        for x, y, r in zip(cx, cy, size):
            x0, x1 = int(x - 2 * r - 1), int(x + 2 * r + 2)
            y0, y1 = int(y - 2 * r - 1), int(y + 2 * r + 2)
            ys, xs = np.mgrid[y0:y1, x0:x1]
            fall = np.clip(1.0 - np.hypot(xs - x, ys - y) / max(r, 0.5), 0, 1)
            img[ys % n, xs % n] += (lift * fall * rng.uniform(0.6, 1.0))[..., None]
    return np.clip(img, 0, 255).astype(np.uint8)


def main():
    os.makedirs(OUT, exist_ok=True)
    for n in (512, 1024):
        rng = np.random.default_rng(SEED + n)
        path = os.path.join(OUT, 'asphalt-%d.webp' % n)
        Image.fromarray(texture(n, rng), 'RGB').save(path, 'WEBP', quality=82, method=6)
        print('wrote', path, '%.0f KB' % (os.path.getsize(path) / 1024))


if __name__ == '__main__':
    main()
