# WP0: Set up the v2 workspace (about 30 minutes)

Paste everything below the line into Claude Code started in the **main app folder**:
`C:\Users\ASUS\Documents\2026\SEM 2\FYP\FYP1 D-Day\SourceCode\SD032_DriveMy_BolehEdit`

---

Set up the workspace for the DriveMy v2 simulator rebuild. Do not change anything in this
folder's working tree: it holds the owner's uncommitted work on other features (exam, quizzes,
results), and that work must stay exactly as it is.

1. Create a separate git worktree at
   `C:\Users\ASUS\Documents\2026\SEM 2\FYP\FYP1 D-Day\SourceCode\SD032-sim-v2`. Put it on a new
   branch `feat/sim-v2`, made from the current `HEAD`.
2. Carry the owner's in-progress changes across without touching them here:
   1. Copy every modified file that `git status --short` lists into the same path in the new
      worktree. Leave out the untracked `.claude/` and `3D Assets/` folders.
   2. In the new worktree, run `npm ci`, `npm run build` and `npm test`.
   3. If the build and the tests pass, commit the copied files as
      `chore: snapshot the owner's in-progress work (14 Oct)`.
   4. If either fails, restore those files to `HEAD` in the new worktree, and list in your report
      which ones broke it. The originals stay safe in the main folder either way.
3. Copy these two folders into the new worktree unchanged. The source root is
   `C:\Users\ASUS\Documents\2026\SEM 2\FYP\FYP1 D-Day\SourceCode\SD032_DriveMy_BolehEdit\.claude\worktrees\driving-license-simulator-b9fedf`.
   - `docs\circuit-v2` → `docs/circuit-v2`
   - `docs\v2-plan` → `docs/v2-plan`
4. Add the simulator skeleton.
   - `src/sim/contracts.ts`, a copy of `docs/v2-plan/contracts.ts`.
   - Modules `src/sim/core`, `src/sim/physics`, `src/sim/world`, `src/sim/render`, `src/sim/ui` and
     `src/sim/assets`, each with an `index.ts`.
   - An npm script `"check:circuit": "python docs/circuit-v2/check.py"`.
   - An npm script
     `"check:car": "node docs/v2-plan/physics/car-check.cjs node_modules/@dimforge/rapier3d-compat"`.
   - Python with numpy, scipy, Pillow and matplotlib is already installed on this machine.
5. Commit `chore(sim): v2 workspace, plan, circuit data and contracts`.

**Done when:**

- `npm run build`, `npm test`, `npm run check:circuit` and `npm run check:car` all pass in the new
  worktree.
- `git status` in the main folder shows exactly the same changes as before you started.

**Report:**

- The worktree path and the branch.
- Whether the owner's snapshot was committed.
- The output of the four commands.
