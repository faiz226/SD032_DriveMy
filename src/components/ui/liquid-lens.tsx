/**
 * Chromium-only SVG displacement lens for small Liquid Glass pill backdrops
 * (tab bar active capsule, segmented control thumb). Never applied to text.
 * Non-Chromium browsers silently ignore `url(#liquid-glass-lens)` via `@supports`.
 */
export function LiquidLensDefs() {
  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      className="pointer-events-none fixed h-0 w-0 overflow-hidden"
    >
      <defs>
        <filter id="liquid-glass-lens" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015 0.015"
            numOctaves="1"
            seed="3"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
