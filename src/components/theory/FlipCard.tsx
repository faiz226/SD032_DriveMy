import { useState } from "react";
import { cn } from "@/lib/utils";
import { Star, Image } from "phosphor-react";
import { useLanguageStore } from "@/stores/languageStore";

interface FlipCardProps {
  name: string;
  description: string;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  imageUrl?: string;
  className?: string;
}

export function FlipCard({
  name,
  description,
  isBookmarked,
  onToggleBookmark,
  imageUrl,
  className,
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imgError, setImgError] = useState(false);
  const t = useLanguageStore((s) => s.t);

  return (
    <div
      className={cn(
        "relative w-full aspect-square group perspective-1000",
        "hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out-quart",
        className
      )}
      onClick={() => setIsFlipped(!isFlipped)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsFlipped((v) => !v);
        }
      }}
      aria-label={`${name} - Flip to read`}
    >
      <div
        className={cn(
          "w-full h-full transform-style-3d cursor-pointer rounded-lg relative",
          "transition-transform duration-500 ease-out-quart motion-reduce:transition-none motion-reduce:duration-0",
          isFlipped ? "rotate-y-180" : ""
        )}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-lg bg-card border border-border shadow-sm flex flex-col items-center justify-center p-6 overflow-hidden">
          <div className="flex-1 flex items-center justify-center w-full min-h-0">
            {imageUrl && !imgError ? (
              <img
                src={imageUrl}
                alt={name}
                className="max-w-full max-h-32 object-contain rounded transition-transform duration-300 group-hover:scale-102"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-32 bg-muted rounded-md flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground text-center px-2">
                {imgError ? (
                  <>
                    <Image className="h-6 w-6 opacity-50" />
                    <span>{t("theory.imageUnavailable")}</span>
                  </>
                ) : (
                  <span>Road Sign Placeholder<br />({name})</span>
                )}
              </div>
            )}
          </div>
          
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 group-hover:text-primary transition-colors font-medium mt-4 select-none">
            Tap to Reveal / Ketik untuk Lihat
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark();
            }}
            className={cn(
              "absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full",
              "bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-accent transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label="Bookmark sign"
          >
            <Star
              className={cn(
                "h-4 w-4",
                isBookmarked ? "fill-warning text-warning" : "text-muted-foreground"
              )}
            />
          </button>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-lg bg-card border border-border shadow-sm flex flex-col items-center justify-center p-6 text-center">
          <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">{description}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark();
            }}
            className={cn(
              "absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full",
              "bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-accent transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label="Bookmark sign"
          >
            <Star
              className={cn(
                "h-4 w-4",
                isBookmarked ? "fill-warning text-warning" : "text-muted-foreground"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
