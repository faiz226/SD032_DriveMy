import { useState } from "react";
import { HOTSPOTS, PartArt } from "./PartArt";
import { PART_PHOTOS, type PartPhoto } from "./photos";
import { cn } from "@/lib/utils";

interface PartPictureProps {
  topicId: string;
  /** What the picture shows, for a screen reader. */
  label: string;
  stepCount: number;
  /** The step lit now (hovered, focused or tapped), counting from 0. */
  active: number | null;
  stepName: (index: number) => string;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
  /** A photo in place of the drawing (defaults to the one registered for this part, if any). */
  photo?: PartPhoto;
}

/**
 * A part's picture with one numbered hotspot per step. A hotspot is a real button, 44 px square, so a thumb
 * and the keyboard reach it; the page lights the matching step, and a lit step lights its hotspot.
 */
export function PartPicture({ topicId, label, stepCount, active, stepName, onSelect, onHover, photo = PART_PHOTOS[topicId] }: PartPictureProps) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const usePhoto = !!photo && !photoFailed;
  // Percentages of the picture: the photo's own, or the drawing's 400 x 300 positions.
  const spots: [number, number][] = usePhoto
    ? photo.spots.slice(0, stepCount)
    : (HOTSPOTS[topicId]?.slice(0, stepCount) ?? []).map(([x, y]) => [(x / 400) * 100, (y / 300) * 100]);
  return (
    <figure className="relative mx-auto my-5 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-background">
      {usePhoto ? (
        <img src={photo.src} srcSet={photo.srcSet} sizes="(min-width: 640px) 576px, 100vw" alt={label} className="block h-auto w-full" onError={() => setPhotoFailed(true)} />
      ) : (
        <PartArt topicId={topicId} label={label} />
      )}
      {spots.map(([x, y], index) => {
        const on = active === index;
        return (
          <button
            key={index}
            type="button"
            aria-label={stepName(index)}
            aria-pressed={on}
            aria-controls={`rpk-step-${index}`}
            onClick={() => onSelect(index)}
            onPointerEnter={() => onHover(index)}
            onPointerLeave={() => onHover(null)}
            style={{ left: `${x}%`, top: `${y}%` }}
            className="group absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              aria-hidden="true"
              className={cn(
                "type-figure grid h-7 w-7 place-items-center rounded-full border-2 text-sm font-bold shadow-sm transition-[background-color,color,transform] duration-150 motion-reduce:transition-none",
                on ? "scale-110 border-foreground bg-brand text-brand-foreground motion-reduce:scale-100" : "border-foreground/70 bg-card text-foreground group-hover:bg-brand/40"
              )}
            >
              {index + 1}
            </span>
          </button>
        );
      })}
    </figure>
  );
}
