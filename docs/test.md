install all this skill and organize their files.:

# === CORE DESIGN GUARDRAILS ===
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
npx skills add pbakaus/impeccable
npx skills add https://github.com/emilkowalski/skill
npx skills add https://github.com/giuseppe-trisciuoglio/developer-kit

# === ANTHROPIC & VERCEL OFFICIAL ===
npx skills add anthropics/claude-code --skill frontend-design -g -y
npx skills add vercel-labs/agent-skills@web-design-guidelines -g -y

# === UI ANTI-SLOP & MOTION ===
npx ui-skills add --all
npx skills add mblode/agent-skills@ui-animation -g -y
npx skills add wshobson/agents@tailwind-design-system -g -y
npx skills add supercent-io/skills-template@web-accessibility -g -y

# === MASSIVE SKILL LIBRARY (new one you added) ===
# Install the full library, then activate specific bundles
npx antigravity-awesome-skills --antigravity