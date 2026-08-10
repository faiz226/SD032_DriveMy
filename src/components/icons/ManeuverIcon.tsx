import type { SVGProps } from 'react';

/**
 * Overhead path diagrams for the eight JPJ circuit maneuvers — drawn, not
 * imported, because no icon library has "hill-start" or "s-curve". Keys must
 * match the maneuver ids in src/lib/licence.ts exactly.
 *
 * 40x40 viewBox: these read as diagrams, not toolbar icons, and need more
 * room than the 24px grid the rest of the icon set uses. stroke-width 2.5,
 * butt caps, miter joins, currentColor — verified legible at 20-80px in both
 * themes in .screenshots/icon-test.html.
 */
const PATHS: Record<string, string> = {
  'hill-start': `
    <path d="M6,30 L15,30 L27,18 L34,18"/>
    <path d="M19.3,22.7 L22.7,26.1"/>
    <path d="M34,18 L29,15.5 M34,18 L29,20.5"/>`,

  'ramp-test': `
    <path d="M6,28 L14,28 L21,13 L28,28 L35,28"/>
    <path d="M35,28 L30,25.5 M35,28 L30,30.5"/>`,

  'side-parking': `
    <path d="M14,21 L14,34 L26,34 L26,21"/>
    <path d="M6,15 L15,15 Q20,15 20,21 L20,29"/>
    <path d="M20,29 L17,24.7 M20,29 L23,24.7"/>`,

  'parallel-parking': `
    <path d="M28,6 L36,6 L36,13 L28,13 Z"/>
    <path d="M28,20 L36,20 L36,27 L28,27 Z"/>
    <path d="M6,10 L14,10 Q20,10 20,16.5 L27,16.5"/>
    <path d="M27,16.5 L22,14 M27,16.5 L22,19"/>`,

  'three-point-turn': `
    <path d="M10,10 L24,10 L24,17 L10,17 L10,24 L24,24"/>
    <path d="M21.5,13.5 L26.5,13.5"/>
    <path d="M7.5,20.5 L12.5,20.5"/>
    <path d="M24,24 L19,21.5 M24,24 L19,26.5"/>`,

  's-curve': `
    <path d="M16,6 C24,9 24,17 16,20 C8,23 8,31 16,34"/>
    <path d="M16,34 L11,34 M16,34 L16,29"/>`,

  'z-curve': `
    <path d="M8,8 L26,8 L14,20 L32,20"/>
    <path d="M32,20 L27,17.5 M32,20 L27,22.5"/>`,

  'road-merging': `
    <path d="M24,6 L24,34"/>
    <path d="M8,32 C8,22 12,16 22,10.5"/>
    <path d="M22,10.5 L17,11 M22,10.5 L19.5,15.5"/>`,
};

export type ManeuverId = keyof typeof PATHS;

interface ManeuverIconProps extends SVGProps<SVGSVGElement> {
  maneuver: string;
}

export function ManeuverIcon({ maneuver, ...props }: ManeuverIconProps) {
  const body = PATHS[maneuver];
  if (!body) return null;

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: body }}
      {...props}
    />
  );
}
