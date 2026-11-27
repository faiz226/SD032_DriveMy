"""Traces the flat Axia side silhouette used by the stopping-distance scene from the owner's photo
(axia-side-red-right.jpg): body outline, glasshouse and wheel positions are measured from the photo by colour,
simplified to a few dozen points, and written as an SVG path. The output is vector only; the photo is not shipped.
Usage: python scripts/trace-axia-side.py <photo> -> prints the data for src/components/theory/axiaSide.ts"""
import sys, json
import cv2, numpy as np

img = cv2.imread(sys.argv[1])
H, W = img.shape[:2]
b, g, r = [img[:, :, i].astype(int) for i in range(3)]
red = (r - g > 60) & (r - b > 50)
dark = (r + g + b) < 270
mask = (red | dark).astype(np.uint8)
mask[int(H * 0.77):, :] = 0                      # the ground shadow starts under the wheels
mask[:int(H * 0.24), :] = 0                      # the antenna
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
body = max(cs, key=cv2.contourArea)
x, y, w, h = cv2.boundingRect(body)
print("bbox", x, y, w, h, file=sys.stderr)
approx = cv2.approxPolyDP(body, 0.0035 * cv2.arcLength(body, True), True)[:, 0, :]

# the glasshouse: dark window glass in the upper part of the body
glass = ((r + g + b) < 200).astype(np.uint8)
glass[: y, :] = 0
glass[int(y + h * 0.55):, :] = 0
glass = cv2.morphologyEx(glass, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
gcs, _ = cv2.findContours(glass, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
gcs = [c for c in gcs if cv2.contourArea(c) > 0.004 * W * H]
wins = [cv2.approxPolyDP(c, 0.01 * cv2.arcLength(c, True), True)[:, 0, :] for c in gcs]

# the wheels: dark round regions at the bottom, by the circle that fits each
low = np.zeros_like(mask)
low[int(y + h * 0.6):, :] = ((r + g + b) < 150)[int(y + h * 0.6):, :]
low = cv2.morphologyEx(low.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
wcs, _ = cv2.findContours(low, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
wheels = []
for c in sorted(wcs, key=cv2.contourArea, reverse=True)[:2]:
    (cx, cy), rad = cv2.minEnclosingCircle(c)
    wheels.append((cx, cy, rad))
wheels.sort()

s = 120 / w  # scale to a 120 unit wide car
fx = lambda px: round((px - x) * s, 1)
fy = lambda py: round((py - y) * s, 1)
path = lambda pts: "M" + " L".join(f"{fx(px)} {fy(py)}" for px, py in pts) + " Z"
out = {
    "viewBox": f"0 0 120 {round(h * s, 1)}",
    "body": path(approx),
    "windows": [path(p) for p in wins],
    "wheels": [[fx(cx), fy(cy), round(rad * s, 1)] for cx, cy, rad in wheels],
}
print(json.dumps(out))
