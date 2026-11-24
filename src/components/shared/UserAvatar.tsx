import { useState } from "react";
import { avatarUrl, initialsOf } from "@/lib/avatar";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  /** Size and text size, e.g. "h-8 w-8 text-xs". */
  className?: string;
}

/**
 * The learner's picture, or their initials on a solid colour when there is none or it will not load
 * (a provider's picture is not allowed by the page's image policy, and a failed address would otherwise
 * show a broken-image icon). Decorative: the name is always written next to it.
 */
export function UserAvatar({ className }: UserAvatarProps) {
  const user = useAuthStore((state) => state.user);
  const src = avatarUrl(user);
  // Remember which address failed, so a new picture is tried afresh.
  const [failedSrc, setFailedSrc] = useState<string>();

  const name =
    (user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email?.split("@")[0] ?? "";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 select-none place-items-center overflow-hidden rounded-full bg-brand font-heading font-bold text-brand-foreground",
        className
      )}
    >
      {src && failedSrc !== src ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailedSrc(src)} />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
