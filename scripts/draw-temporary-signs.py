"""Draw the temporary (roadworks) signs as our own SVGs and write the data file for them.
Meanings are the captions of the Construction signs gallery on https://en.wikipedia.org/wiki/Road_signs_in_Malaysia
(orange and black, a diamond on a rectangular board). The pictograms are drawn here, not copied from any file."""
import os, json, hashlib

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

K = 'fill="#000" stroke="none"'
S = 'fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round"'


def mirror(g):
    return f'<g transform="translate(300 0) scale(-1 1)">{g}</g>'


def arrow_head(x, y, ang):
    return f'<polygon {K} points="0,-15 24,0 0,15" transform="translate({x} {y}) rotate({ang})"/>'


worker = (
    f'<circle cx="138" cy="92" r="13" {K}/>'
    f'<path d="M138 108 L124 152 L152 152 Z" {K}/>'
    f'<path d="M128 152 L118 196 M150 152 L160 196" {S} stroke-width="10"/>'
    f'<path d="M146 122 L178 156" {S} stroke-width="8"/>'
    f'<path d="M178 156 L192 184" {S} stroke-width="6"/>'
    f'<path d="M182 182 L206 176 L200 200 L178 194 Z" {K}/>'
    f'<path d="M168 204 Q190 180 216 204 Z" {K}/>'
)
worker_small = f'<g transform="translate(150 150) scale(.8) translate(-160 -150)">{worker}</g>'


def lanes(closed):
    xs = [(105, 135), (135, 165), (165, 195)]
    cx = sum(xs[closed]) / 2
    target = {0: 150, 1: 180, 2: 120}[closed]
    g = f'<path d="M105 200 V90 M195 200 V90" {S} stroke-width="7"/>'
    g += f'<path d="M135 200 V90 M165 200 V90" {S} stroke-width="3" stroke-dasharray="9 8"/>'
    g += f'<rect x="{xs[closed][0] + 4}" y="92" width="22" height="40" {K}/>'
    g += f'<path d="M{cx} 192 L{target} 146" {S} stroke-width="8"/>' + arrow_head(target, 140, -90 + (18 if target > cx else -18 if target < cx else 0))
    return g


narrows_left = (
    f'<path d="M185 200 V84" {S} stroke-width="9"/>'
    f'<path d="M110 200 V152 L138 112 V84" {S} stroke-width="9"/>'
)
curve_right = f'<path d="M116 202 Q116 118 184 112" {S} stroke-width="16"/>' + arrow_head(190, 112, 0)
chevron = '<path d="M120 92 L188 150 L120 208" fill="none" stroke="#000" stroke-width="24" stroke-linejoin="miter"/>'
diverge = (
    f'<path d="M150 204 V152 M150 152 L116 112 M150 152 L184 112" {S} stroke-width="12"/>'
    + arrow_head(112, 106, -130)
    + arrow_head(188, 106, -50)
)
flagman = (
    f'<circle cx="132" cy="92" r="13" {K}/>'
    f'<path d="M132 108 L120 152 L144 152 Z" {K}/>'
    f'<path d="M122 152 L114 196 M142 152 L150 196" {S} stroke-width="10"/>'
    f'<path d="M140 120 L170 100" {S} stroke-width="7"/>'
    f'<path d="M170 100 V78" {S} stroke-width="5"/>'
    f'<path d="M172 78 H204 V104 H172 Z" {K}/>'
)
detour = f'<path d="M116 204 V138 Q116 100 156 100 H178" {S} stroke-width="16"/>' + arrow_head(182, 100, 0)
one_lane = f'<path d="M126 204 V86 M174 204 V86" {S} stroke-width="8"/>' + f'<path d="M150 196 V112" {S} stroke-width="12"/>' + arrow_head(150, 100, -90)
caution = f'<rect x="141" y="82" width="18" height="74" rx="8" {K}/><circle cx="150" cy="184" r="11" {K}/>'
speed50 = (
    '<circle cx="150" cy="150" r="58" fill="#fff" stroke="#d81e1e" stroke-width="12"/>'
    '<text x="150" y="172" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="56" fill="#000">50</text>'
)
lorry = (
    f'<rect x="96" y="112" width="72" height="56" rx="3" {K}/>'
    f'<path d="M168 128 H190 L206 148 V168 H168 Z" {K}/>'
    '<circle cx="124" cy="176" r="12" fill="#000" stroke="#f5911e" stroke-width="4"/>'
    '<circle cx="186" cy="176" r="12" fill="#000" stroke="#f5911e" stroke-width="4"/>'
)
end_works = (
    f'<g opacity=".4">{worker_small}</g>'
    f'<path d="M104 202 L196 98" {S} stroke-width="14"/>'
)


def text_strip(label):
    return (
        '<rect x="92" y="268" width="116" height="48" rx="4" fill="#f5911e" stroke="#000" stroke-width="6"/>'
        f'<text x="150" y="303" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="30" fill="#000">{label}</text>'
    )


def sign(body, label=None, diamond=True):
    d = '<path d="M150 22 L262 150 L150 258 L38 150 Z" fill="#f5911e" stroke="#000" stroke-width="9" stroke-linejoin="round"/>' if diamond else ""
    h = 340 if label else 300
    strip = text_strip(label) if label else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 {h}" role="img">'
        f'<rect width="300" height="{h}" rx="14" fill="#f5911e"/><rect x="5" y="5" width="290" height="{h - 10}" rx="10" fill="none" stroke="#000" stroke-width="10"/>'
        f"{d}{body}{strip}</svg>"
    )


# id, svg body, label, EN name, BM name, EN action, BM action, source tag
SIGNS = [
    ("temp-roadworks", worker, None, "Roadworks", "Kerja jalan", "Roadworks ahead. Slow down and watch for workers.", "Kerja jalan di hadapan. Perlahankan kenderaan dan awasi pekerja."),
    ("temp-caution", caution, None, "Caution (work zone)", "Awas (zon kerja)", "Take care and be ready for a hazard in the work zone.", "Berhati-hati dan bersedia menghadapi bahaya di zon kerja."),
    ("temp-lane-closed-left", lanes(0), None, "Left lane closed ahead", "Lorong kiri ditutup di hadapan", "Check your mirror, signal and move into the open lane in good time.", "Periksa cermin, beri isyarat dan masuk ke lorong yang dibuka lebih awal."),
    ("temp-lane-closed-middle", lanes(1), None, "Middle lane closed ahead", "Lorong tengah ditutup di hadapan", "Choose the open lane early and keep a safe gap.", "Pilih lorong yang dibuka lebih awal dan kekalkan jarak selamat."),
    ("temp-lane-closed-right", lanes(2), None, "Right lane closed ahead", "Lorong kanan ditutup di hadapan", "Check your mirror, signal and move left in good time.", "Periksa cermin, beri isyarat dan beralih ke kiri lebih awal."),
    ("temp-curve-right", curve_right, None, "Curve to the right (work zone)", "Selekoh ke kanan (zon kerja)", "Slow down before the curve and keep to your lane.", "Perlahankan kenderaan sebelum selekoh dan kekal di lorong anda."),
    ("temp-curve-left", mirror(curve_right), None, "Curve to the left (work zone)", "Selekoh ke kiri (zon kerja)", "Slow down before the curve and keep to your lane.", "Perlahankan kenderaan sebelum selekoh dan kekal di lorong anda."),
    ("temp-narrows-left", narrows_left, None, "Road narrows on the left", "Jalan menyempit di sebelah kiri", "Slow down and give way to traffic already in the narrow part where needed.", "Perlahankan kenderaan dan beri laluan kepada trafik di bahagian sempit jika perlu."),
    ("temp-narrows-right", mirror(narrows_left), None, "Road narrows on the right", "Jalan menyempit di sebelah kanan", "Slow down and give way to traffic already in the narrow part where needed.", "Perlahankan kenderaan dan beri laluan kepada trafik di bahagian sempit jika perlu."),
    ("temp-chevron-left", mirror(chevron), None, "Chevron: route shifts left", "Chevron: laluan beralih ke kiri", "Slow down and follow the chevrons to the left.", "Perlahankan kenderaan dan ikut chevron ke kiri."),
    ("temp-diverge", diverge, None, "Roadway diverges", "Jalan bercabang", "Choose your lane early and follow the signs for your direction.", "Pilih lorong lebih awal dan ikut papan tanda arah anda."),
    ("temp-works-200m", worker, "200 m", "Construction works ahead in 200 m", "Kerja pembinaan 200 m di hadapan", "Start slowing down now and be ready to change lane.", "Mula perlahankan kenderaan sekarang dan bersedia menukar lorong."),
    ("temp-flagman-200m", flagman, "200 m", "Flagman ahead in 200 m", "Pengawal bendera 200 m di hadapan", "Slow down and obey the flagman's signals.", "Perlahankan kenderaan dan patuhi isyarat pengawal bendera."),
    ("temp-detour", detour, None, "Detour", "Lencongan", "Follow the arrow and the detour route.", "Ikut anak panah dan laluan lencongan."),
    ("temp-one-lane", one_lane, None, "One-lane road ahead", "Jalan satu lorong di hadapan", "Slow down, keep to the lane and watch for oncoming traffic.", "Perlahankan kenderaan, kekal di lorong dan awasi trafik dari arah bertentangan."),
    ("temp-speed-50", speed50, None, "Temporary speed limit 50 km/h", "Had laju sementara 50 km/j", "Do not drive faster than 50 km/h while the sign applies.", "Jangan memandu lebih laju daripada 50 km/j selagi papan tanda ini berkuat kuasa."),
    ("temp-heavy-vehicles", lorry, None, "Heavy vehicles entering and leaving the work zone", "Kenderaan berat keluar masuk zon kerja", "Slow down and watch for lorries crossing the road.", "Perlahankan kenderaan dan awasi lori yang melintas jalan."),
    ("temp-end-works", end_works, None, "End of construction", "Pembinaan tamat", "The work zone ends here. Normal rules apply again.", "Zon kerja tamat di sini. Peraturan biasa berkuat kuasa semula."),
]

os.makedirs("public/signs", exist_ok=True)
rows = []
doc_lines = []
for sid, body, label, en, ms, act_en, act_ms in SIGNS:
    data = sign(body, label).encode("utf-8")
    name = hashlib.sha256(data).hexdigest()[:16] + ".svg"  # public sign assets are named by their hash
    open(f"public/signs/{name}", "wb").write(data)
    rows.append(
        {
            "id": sid, "type": "temporary", "name": en, "nameMs": ms,
            "desc": f"{en}. {act_en}", "descMs": f"{ms}. {act_ms}",
            "meaning": en, "meaningMs": ms, "action": act_en, "actionMs": act_ms,
            "source": "Wikipedia, Road signs in Malaysia (Construction signs)",
            "img": f"/signs/{name}",
        }
    )
    doc_lines.append(
        f"| `{name}` | [Meaning: Wikipedia](https://en.wikipedia.org/wiki/Road_signs_in_Malaysia#Construction_signs) | "
        f"[Own drawing](https://github.com/faiz226/DriveMy) | DriveMy (own drawing of: {en}) | "
        "Drawn from plain shapes by scripts/draw-temporary-signs.py; no third-party artwork or file is used. |"
    )

# docs/sign-sources.md: one line per drawn sign, replaced on every run
doc_path = "docs/sign-sources.md"
doc = open(doc_path, encoding="utf-8", newline="").read()
eol = "\r\n" if "\r\n" in doc else "\n"
kept = [line for line in doc.split(eol) if "Own drawing" not in line]
while kept and kept[-1] == "":
    kept.pop()
open(doc_path, "w", encoding="utf-8", newline="").write(eol.join(kept + doc_lines) + eol)

ts = '''import type { RoadSignItem } from "./theory";

// Temporary (work zone) signs. The meanings are the captions in the Construction signs gallery of
// https://en.wikipedia.org/wiki/Road_signs_in_Malaysia (orange and black, a diamond on a rectangular board).
// The pictures are drawn for this app by scripts/draw-temporary-signs.py, not copied from any file.
export const temporarySigns: RoadSignItem[] = ''' + json.dumps(rows, indent=2, ensure_ascii=False) + ";\n"
open("src/content/temporary-signs.ts", "w", encoding="utf-8", newline="\n").write(ts)
print(len(rows), "signs")
