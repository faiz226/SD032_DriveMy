# 3D assets — a deployment trap and a bandwidth problem

> Status: **needs a decision.** The driving simulator will not work on a fresh
> deployment as things stand.

## The trap

`src/pages/Simulation3DView.tsx` loads the car model from `CAR_MODEL_URL`,
which defaults to `/toyota-corolla-e170-2017.glb`.

`.gitignore:48` contains `*.glb`.

So the asset the simulator depends on is **not in the repository**. It exists
only on machines where somebody placed it by hand. A fresh `git clone`, a CI
run, or a Vercel build produces a `public/` with no model in it, and the
simulator 404s.

This was introduced by commit `a54e4ca` ("chore: untrack models, error logs and
temp files"), which untracked the models to keep the repo small — reasonable in
itself, but it removed a runtime dependency with nothing put in its place.

## Current state on disk

| File | Size | Referenced in code? |
|---|---:|---|
| `public/toyota-corolla-e170-2017.glb` | **35.0 MB** | **Yes** — the only one used |
| `public/myvi.glb` | 10.7 MB | No |
| `public/myvi-draco.glb` | 9.3 MB | No |
| `public/car_interior.glb` | 1.0 MB | No |
| `myvi.glb` (repo root) | 10.7 MB | No |

`public/` totals **58 MB**, of which **35 MB is needed and 21 MB is dead
weight**. Verified with
`grep -rnoE '"/[^"]*\.(glb|gltf)"' src/` — only the Toyota model appears.

The unused files are untracked, so deleting them is **not** recoverable through
git. Confirm before removing.

## The bandwidth problem

35 MB per simulation session is not viable:

- **Supabase Free tier** allows 2 GB egress/month — about **57 sessions**
  before the project is throttled or paused. On this project a quota pause is a
  full outage, not a bill.
- On a typical Malaysian mobile connection this is a multi-minute download
  before the simulator becomes usable.
- It is roughly **six times** the size of the entire rest of the application
  bundle.

The presence of `myvi-draco.glb` suggests Draco compression was tried on the
older model and gave only ~13% (10.7 → 9.3 MB), which points at textures rather
than geometry being the bulk. Texture compression (KTX2/Basis) usually matters
far more than mesh compression for models like this.

## Options

### 1. Compress, then commit (recommended first step)

```bash
npx @gltf-transform/cli optimize \
  public/toyota-corolla-e170-2017.glb \
  public/car.glb \
  --texture-compress webp --texture-size 1024
```

Models of this kind commonly drop to 3–6 MB with no visible difference at the
sizes rendered on screen. If the result is small enough, committing it is
reasonable and removes the trap entirely.

Verify visually before accepting — this is a judgement call about how the car
looks, and no automated check substitutes for looking at it.

### 2. Serve from object storage

Upload to a public Supabase Storage bucket and set `VITE_CAR_MODEL_URL` in the
Vercel project settings. Keeps the repo small and lets the asset be replaced
without a redeploy.

Note this does **not** solve the bandwidth problem — it moves the egress to
Supabase, where the free-tier ceiling is lower. Compress first.

Remember to add the bucket origin to `img-src`/`connect-src` in the CSP in
`vercel.json` if it differs from the existing Supabase origin.

### 3. Git LFS

Works, but adds a clone-time dependency for every contributor and still ships
35 MB to every user. Least attractive of the three.

## Whatever is chosen

- Remove the 21 MB of unreferenced models.
- Keep `CAR_MODEL_URL` configurable so the source can change without a code
  change.
- If the asset stays in `public/`, narrow the `.gitignore` rule so the one
  required model is tracked while scratch models stay ignored:

  ```gitignore
  *.glb
  !public/car.glb
  ```

## Related findings

`TechStack.md` §3.6.1 (uncapped spend / quota pause), §3.15.1 (no load testing
or capacity planning), §3.1.6 (Lighthouse only measures the login page, so this
route's Core Web Vitals are entirely unmeasured).
