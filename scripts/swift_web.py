"""Build the web Swift for the v2 simulator (three.js) from the source model.

Run headless:
  blender -b --python scripts/swift_web.py -- <source.glb> <out dir>

Writes <out>/low/ and <out>/medium/, each holding body.glb, wheel.glb and steering.glb (the
two tiers differ only in texture size: 512 and 1024 px, WebP), plus <out>/measure.json with
every position the car config needs.

THE FRAME (three.js, as the simulator wants it): +X is the nose, +Y is up, -Z is the driver's
left. The model is right-hand drive already and is never mirrored, only turned.

  glTF (source)  +Y up, nose +Z, +X the driver's left.
  Blender        the importer maps glTF (x, y, z) -> (x, -z, y): nose -Y, left +X, up +Z.
  Turned here    +90 deg about Blender Z: nose +X, left +Y.
  Exported       export_yup maps Blender (x, y, z) -> glTF (x, z, -y): nose +X, up +Y, left -Z.

ORIGINS:
  body.glb      at the wheelbase centre, at wheel-centre height.
  wheel.glb     at the front-left axle centre; radius exactly 0.324 m; the axle is along Z.
  steering.glb  at the hub; the column axis (pointing back at the driver) is along -X, so the
                car turns the wheel about its own X axis and tilts it by the column angle.

The carving of the moving parts follows the Godot-era scripts/swift_rig.py, whose measured
constants are reused unchanged. What is new here is the frame and a far smaller triangle budget
(about 50k for the whole car), spent by what the driver sees from the seat.
"""

import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

ARGS = sys.argv[sys.argv.index("--") + 1:]
SRC, OUT = Path(ARGS[0]), Path(ARGS[1])

# ── Measured in the source (glTF space), from swift_rig.py ───────────────────────
HUB_G = Vector((-0.3295, 0.6909, -1.4109))    # steering wheel hub
AXIS_G = Vector((0.0122, -0.3992, 0.9168))    # column axis, pointing toward the nose
AXLE_G = Vector((0.7466, 0.0557, -0.5407))    # front-left wheel centre
TYRE_R = 0.3237
WBC_Z = -1.76575                              # wheelbase centre, glTF Z
WHEEL_CENTRE_Y = 0.0557
TARGET_R = 0.324                              # the physics wheel radius
AXIS_SPLIT = 0.11                             # steering islands further than this along the column are shroud
ROT_MATS = ("SW_Chrome", "Ornamelta", "SW_PlastLeather", "SW_soft", "SW_stitsk")
MIXED_MATS = ("SW_Plastic", "Decals")

# ── Triangle budget ───────────────────────────────────────────────────────────────
BODY_TRIS = 38000
WHEEL_TRIS = 2600          # one corner; the scene shows it four times
STEERING_TRIS = 3200
MIN_TRIS = 24              # no part is decimated below this
# Weight per source triangle, by what the first-person view and the mirrors show. Earlier
# rows win: a part takes the first pattern its name contains.
WEIGHTS = [
    ("Mirrors", None),                   # mirror glass keeps every triangle
    ("IN_SEAT_MECHANISAM", 0.0),         # under the seats: never seen, removed
    ("EX_WHEEL_MECH", 0.0),              # brakes behind the rims: removed
    ("IN_DASH", 1.4),
    ("IN_STEERINGSPEEDO", 1.2),
    ("EX_CARBODY", 1.0),
    ("Windows", 1.0),
    ("Glass", 0.6),
    ("glass", 0.6),
    ("IN_CENTRECONSOLE", 0.55),
    ("EX_PARTS", 0.5),
    ("EX_LIGHTS", 0.35),
    ("IN_DOORS", 0.45),
    ("IN_SEAT", 0.4),
    ("IN_ROOF", 0.25),
    ("IN_FLOOR", 0.12),
    ("IN_", 0.4),
    ("EX_", 0.6),
]
GLASSY = ("Glass", "glass", "Windows")


def log(m):
    print(f"[web] {m}", flush=True)


def meshes():
    return [o for o in bpy.data.objects if o.type == "MESH"]


def tris(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)


def bake(o, M=None):
    o.data.transform((M or Matrix.Identity(4)) @ o.matrix_world)
    o.matrix_world = Matrix.Identity(4)


def g2b(v):
    return Vector((v.x, -v.z, v.y))


def b2g(v):
    return Vector((v.x, v.z, -v.y))


def islands(bm):
    seen, out = set(), []
    for f in bm.faces:
        if f.index in seen:
            continue
        stack, grp = [f], []
        seen.add(f.index)
        while stack:
            cur = stack.pop()
            grp.append(cur)
            for e in cur.edges:
                for nb in e.link_faces:
                    if nb.index not in seen:
                        seen.add(nb.index)
                        stack.append(nb)
        out.append(grp)
    return out


def select_wheel_islands(o, hub, axis):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bm.faces.ensure_lookup_table()
    keep = []
    for grp in islands(bm):
        if max((v.co - hub).dot(axis) for f in grp for v in f.verts) < AXIS_SPLIT:
            keep.extend(grp)
    if not keep:
        bm.free()
        return False
    for f in bm.faces:
        f.select_set(False)
    for v in bm.verts:
        v.select_set(False)
    for f in keep:
        f.select_set(True)
    bm.select_flush(True)
    bm.to_mesh(o.data)
    bm.free()
    o.data.update()
    return True


def keep_front_left(o, wbc):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bm.faces.ensure_lookup_table()
    drop = [f for f in bm.faces if not (f.calc_center_median().x > 0.0 and f.calc_center_median().y < wbc)]
    bmesh.ops.delete(bm, geom=drop, context="FACES")
    bm.to_mesh(o.data)
    bm.free()
    o.data.update()
    return len(o.data.polygons) > 0


def separate(o):
    before = set(bpy.data.objects.keys())
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.context.tool_settings.mesh_select_mode = (False, False, True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.separate(type="SELECTED")
    bpy.ops.object.mode_set(mode="OBJECT")
    new = set(bpy.data.objects.keys()) - before
    return bpy.data.objects[new.pop()] if new else None


def join(objs, name):
    objs = [o for o in objs if o and len(o.data.polygons)]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    out = bpy.context.view_layer.objects.active
    out.name = name
    return out


def decimate(o, target, symmetric):
    n = tris(o)
    if n <= target or n == 0:
        return n
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    mod = o.modifiers.new("dec", "DECIMATE")
    mod.decimate_type = "COLLAPSE"
    mod.ratio = max(0.001, target / n)
    mod.use_collapse_triangulate = True
    if symmetric:
        mod.use_symmetry = True
        mod.symmetry_axis = "X"            # left-right, in the source's Blender frame
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return tris(o)


def weight_of(name):
    for pat, w in WEIGHTS:
        if pat in name:
            return w
    return 0.5


def smooth(o, angle_deg=35.0):
    """Normals from the decimated surface: smooth, with edges sharper than the angle kept sharp."""
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    if o.data.has_custom_normals:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angle_deg))


def finish_materials(objs):
    """Single-sided opaque surfaces, see-through glass (no transmission extension)."""
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if m is None:
                continue
            glassy = any(k in m.name for k in GLASSY)
            m.use_backface_culling = not glassy
            if m.node_tree:
                for nd in m.node_tree.nodes:
                    if nd.type != "BSDF_PRINCIPLED":
                        continue
                    for key in ("Transmission Weight", "Transmission"):
                        if key in nd.inputs:
                            nd.inputs[key].default_value = 0.0
                    if glassy and nd.inputs["Alpha"].default_value >= 0.99:
                        nd.inputs["Alpha"].default_value = 0.28 if "Windows" in m.name else 0.45
            for attr, val in (("blend_method", "BLEND" if glassy else "OPAQUE"),
                              ("surface_render_method", "BLENDED" if glassy else "DITHERED")):
                if hasattr(m, attr):
                    try:
                        setattr(m, attr, val)
                    except TypeError:
                        pass


def radius_about_axle(o):
    """Largest distance from the axle (the origin, along Blender Y) in the wheel's plane."""
    return max(math.hypot(v.co.x, v.co.z) for v in o.data.vertices)


def export(o, path):
    # The source's colour sets are blank (COLOR_0 all white, COLOR_1 all zero), so they change nothing
    # on screen; glTF would still carry them, about 0.7 MB of the Low tier.
    for a in list(o.data.color_attributes):
        o.data.color_attributes.remove(a)
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True, export_yup=True,
                              export_apply=True, export_image_format="WEBP", export_image_quality=80,
                              export_draco_mesh_compression_enable=False)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(SRC))
    for o in meshes():
        bake(o)
    src_tris = sum(tris(o) for o in meshes())
    log(f"source: {len(meshes())} parts, {src_tris} triangles")

    hub0, axis0 = g2b(HUB_G), g2b(AXIS_G).normalized()
    wbc = -WBC_Z

    # 1. The steering wheel: whole rotating parts, plus the rotating islands of the mixed ones.
    pure = [o for o in meshes() if "STEERING" in o.name.upper() and any(m in o.name for m in ROT_MATS)]
    mixed = [o for o in meshes() if "STEERING" in o.name.upper() and any(m in o.name for m in MIXED_MATS)]
    carved = [p for p in (separate(o) for o in mixed if select_wheel_islands(o, hub0, axis0)) if p]
    steering = join(pure + carved, "Steering")

    # 2. The road wheel: one corner (front left); the brakes and the other three corners go.
    corners = []
    for o in list(meshes()):
        if "EX_WHEEL" not in o.name.upper() or o is steering:
            continue
        if "MECH" not in o.name.upper() and keep_front_left(o, wbc):
            corners.append(o)
        else:
            bpy.data.objects.remove(o, do_unlink=True)
    wheel = join(corners, "Wheel")

    # 3. Spend the body's budget by what is seen; drop what never is.
    body_parts = [o for o in meshes() if o not in (steering, wheel)]
    for o in list(body_parts):
        if weight_of(o.name) == 0.0:
            body_parts.remove(o)
            bpy.data.objects.remove(o, do_unlink=True)
    keep = [o for o in body_parts if weight_of(o.name) is None]
    cut = [o for o in body_parts if weight_of(o.name) is not None]
    spare = BODY_TRIS - sum(tris(o) for o in keep)
    total_w = sum(tris(o) * weight_of(o.name) for o in cut)
    for o in cut:
        target = max(MIN_TRIS, round(spare * tris(o) * weight_of(o.name) / total_w))
        decimate(o, target, symmetric=o.name.split("_ZP_")[-1].startswith("EX_"))
    decimate(steering, STEERING_TRIS, symmetric=False)
    decimate(wheel, WHEEL_TRIS, symmetric=False)
    body = join(body_parts, "Body")

    # 4. Turn the car nose-to-+X and put each moving part on its pivot.
    world = Matrix.Rotation(math.pi / 2, 4, "Z") @ Matrix.Translation(-Vector((0.0, wbc, WHEEL_CENTRE_Y)))
    for o in (body, steering, wheel):
        bake(o, world)
    hub = world @ hub0
    axle = world @ g2b(AXLE_G)
    spin = -(world.to_3x3() @ axis0).normalized()            # points back at the driver
    tilt_deg = math.degrees(math.asin(max(-1.0, min(1.0, spin.z))))
    steering.data.transform(Matrix.Translation(-hub))
    steering.data.transform(spin.rotation_difference(Vector((-1.0, 0.0, 0.0))).to_matrix().to_4x4())
    wheel.data.transform(Matrix.Translation(-axle))
    s = TARGET_R / radius_about_axle(wheel)
    wheel.data.transform(Matrix.Diagonal((s, s, s, 1.0)))

    for o in (body, steering, wheel):
        smooth(o)
    finish_materials((body, steering, wheel))

    # 5. Measure, in the simulator's frame (three.js: x forward, y up, z = -left).
    def three(v):
        g = b2g(v)
        return [round(g.x, 4), round(g.y, 4), round(g.z, 4)]

    def centre(points):
        pts = list(points)
        return Vector((sum(p.x for p in pts) / len(pts), sum(p.y for p in pts) / len(pts), sum(p.z for p in pts) / len(pts)))

    mirror_glass = [v.co.copy() for p in body.data.polygons if "Mirrors" in body.material_slots[p.material_index].material.name
                    for v in (body.data.vertices[i] for i in p.vertices)]
    door = [v for v in mirror_glass if abs(v.y) > 0.6]
    cabin = [v for v in mirror_glass if abs(v.y) <= 0.6]
    xs = [v.co.x for v in body.data.vertices]
    ys = [v.co.y for v in body.data.vertices]
    zs = [v.co.z for v in body.data.vertices]
    measure = {
        "frame": "three.js car frame: x forward, y up, z = -(driver's left); origin at the wheelbase centre, wheel-centre height",
        "wheel_radius_m": TARGET_R,
        "axle_front_left": three(axle),
        "steering_hub": three(hub),
        "column_tilt_deg": round(tilt_deg, 2),
        "mirror_left_glass": three(centre(v for v in door if v.y > 0)) if door else None,
        "mirror_right_glass": three(centre(v for v in door if v.y < 0)) if door else None,
        "mirror_interior_glass": three(centre(cabin)) if cabin else None,
        "body_extent": {"length": round(max(xs) - min(xs), 4), "width": round(max(ys) - min(ys), 4),
                        "top_above_wheel_centre": round(max(zs), 4), "bottom_above_wheel_centre": round(min(zs), 4)},
        "triangles": {"body": tris(body), "wheel": tris(wheel), "steering": tris(steering),
                      "car_total": tris(body) + 4 * tris(wheel) + tris(steering)},
        "materials": {"body": len(body.material_slots), "wheel": len(wheel.material_slots), "steering": len(steering.material_slots)},
    }

    # 6. Export both tiers: the larger textures first, then shrink them for Low.
    for tier, cap in (("medium", 1024), ("low", 512)):
        for im in bpy.data.images:
            w, h = im.size
            if w and max(w, h) > cap:
                im.scale(max(1, w * cap // max(w, h)), max(1, h * cap // max(w, h)))
        (OUT / tier).mkdir(parents=True, exist_ok=True)
        for o, fn in ((body, "body.glb"), (wheel, "wheel.glb"), (steering, "steering.glb")):
            export(o, OUT / tier / fn)
        measure[f"bytes_{tier}"] = {fn: (OUT / tier / fn).stat().st_size for fn in ("body.glb", "wheel.glb", "steering.glb")}
        log(f"{tier}: {measure[f'bytes_{tier}']}")

    (OUT / "measure.json").write_text(json.dumps(measure, indent=2))
    log(json.dumps(measure, indent=2))


if __name__ == "__main__":
    main()
