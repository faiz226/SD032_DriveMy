# Real ARM yard: trace notes (14 Oct 2026)

The map is the real ARM yard (the drone photo and blueprint in `bar/circuit/`), drawn cleanly.
These are the outlines read off the photo; `generate.py` builds the yard from them, and
`yard-vs-photo.png` draws the result over the photo.

**Source:** `bar/circuit/reference_aerial_grid.png` (1271 × 734 px) with the grid lines painted
out. Scale 0.0943 m/px (±5%). Pixel coordinates: x right, y down. To get metres:
`x_m = px * 0.0943`, `y_m = (750 - py) * 0.0943` (the bottom edge of the yard sits near py 748,
just below the photo).

## Islands (kerb outlines, px; corners rounded about 10 px)

| Island | Outline (px) | Notes |
|---|---|---|
| A (top left) | (213,204) (393,204) (393,329) (353,329) (353,399) (393,399) (393,439) (308,439), curve to (200.5,303), (200.5,218), round corner to (213,204) | Recess 3.8 × 6.6 m opens east onto lane A–B: parallel parking |
| B | (468,203) (518,203) (518,438) (468,438) (468,313) (501.5,313) (501.5,244.5) (468,244.5) | Recess 3.1 × 6.6 m opens west onto lane A–B; booth at x 474–500, y 360–400 |
| C | (591.5,204) (628,204) (628,437) (591.5,437) | Plain strip |
| D | (704,203) (750.5,203) (750.5,329) (719,329) (719,399) (750.5,399) (750.5,437) (704,437) | Recess 3.0 × 6.6 m opens east onto lane D–E |
| E | (833,202) (878,202) (878,437) (829,437) (829,312) (865.5,312) (865.5,243) (833,243) | Recess 3.1 × 6.4 m opens west onto lane D–E |
| F (top right) | (955.5,202) (1155.5,202) (1155.5,438) (1039,438) (1039,382) (1100.5,382) (1100.5,332) (1044,332) (1044,273) (994,273) (994,438) (955.5,438) | U shape: a 4.7 m dead-end lane with a side bay; booth at x 974–1024, y 217–252 |
| Roundabout | circle, centre (152.9, 478.8), r 65.8 px (6.2 m) | Fitted to the kerb paint |
| G (bottom left) | (310.5,522) (380.5,522) (380.5,627) (317,627) (317,565.5) (269,565.5) (269,628) (210,628) (210,675) (373,675) (373,686) (183,686) (183,653), curve to (310.5,522) | Pocket 4.5 × 5.9 m off a 4.4 m band that opens east: side parking. Black-and-white kerb along the band's south side |
| 8 (Γ) | (457,518) (562,518) (562,580.5) (480.5,580.5) (480.5,688) (457,688) | West wall of the Z; booth on top |
| 9 | (600.5,518) (618,518) (618,684) (518,684) (518,623) (600.5,623) | East wall of the Z |
| S block | rectangle (699,519)–(1149,683) minus the S lane | S lane: enters at x 753–795.5 heading south, exits at x 1030.5–1078 heading south; matches the parametric S (3.6 m lane, +141° then −141° at 7.5 m radius, 26.7 m sideways, 6.0 m of straight legs in total). Booth near x 1095–1140, y 595–625 |

**Z** (between islands 8 and 9): entry lane x 562–600.5 from the spine road, a 4.0 m jog at
y 580.5–623 running west, and an exit lane x 480.5–518 to the bottom lane. The jog is 7.7 m
centre to centre, as measured before.

## Roads and edges (px)

- **Spine road:** y 438–518 (7.5 m), east–west across the middle. The STOP box sits at x 625–700.
- **Lanes between islands:** A–B 7.0 m, B–C 6.9 m (a dark plate at y 295–330), C–D 7.1 m,
  D–E 7.8 m, E–F 7.3 m, F to the right edge 6.5 m. Bottom: G–8 7.2 m. The lane between island 9
  and the S block is 7.6 m: the three-point-turn lane.
- **Hill strip:** x 478–760, y 70.5–119 (26.6 × 4.6 m), with a 4.0 m flat lane north of it
  (y 28–70.5). Crest marking near x 610–628.
- **Top area:** y 119–203 (7.9 m) between the hill and the islands; open floor x 760–1224, y 28–203
  (the blueprint draws a structure here, with U-turn arrows: the place for the decided ramp).
- **Apron:** x 121–478, y 28–203 (the staging area, office above it).
- **Outer edge:** top y 28 (x 318–1224); right x 1224; bottom about y 748; left x 99 below
  y 653, a concave arc (centre (−20.7, 675.2), r 118) up to (73, 598), the bulge round the
  roundabout (centre (165.5, 479.1), r 153.3) up to about (53, 378), then (73,363) (103,333)
  (120.5,303), straight up x 120.5 to y 153, and the top-left curve through (128,148) (143,118)
  (168,93) (208,73) (263,48) (318,28).
- **Right edge, outside the car area:** a 2.4 m kerbed lane x 1225–1250 with cones (likely the
  motorcycle lane). Leave it as scenery.

## Refinements made while building

- Island A's south-west edge was read at 4× zoom: (308,439) (299,426.5) (276.5,404) (251.5,379)
  (226.5,354) (216.5,344) (209,331.5) (202.75,316.5) (200.5,301).
- Island G was re-read at 4× zoom: the pocket is x 267.75–317.75 by y 565.25–626.5 (4.72 × 5.78 m)
  and the band's west end is x 207.75; its curved edge runs (183,686) (180.25,656.5) (191.5,639)
  (209,616.5) (231.5,596.5) (256.5,571.5) (279,546.5) (300,530) (310.5,522).
- The Z and the S are built from their measured centrelines and widths rather than from pixel
  outlines, so their lanes are exact: Z lanes 4.0 m about x 499 and 581 px with the jog at
  y 602 px; the S as two 141° bends at 7.5 m from the entry at x 774.25 px.
