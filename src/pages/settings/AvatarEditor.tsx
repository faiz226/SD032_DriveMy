import { useRef, useState } from "react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { Camera } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuthStore } from "@/stores/authStore";
import { useLanguage } from "@/hooks/useLanguage";
import { hasOwnAvatar } from "@/lib/avatar";
import { removeAvatar, uploadAvatar } from "@/services/avatar.service";
import type { TranslationKey } from "@/lib/translations/en";

/** The learner's picture in Settings: tap it to choose another, or remove their own. */
export function AvatarEditor({ displayName }: { displayName: string }) {
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const run = async (job: (userId: string) => Promise<User>, done: TranslationKey) => {
    if (!user) return;
    setBusy(true);
    try {
      setUser(await job(user.id));
      toast.success(t(done));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      toast.error(t(reason === "not-an-image" ? "profile.avatar.notImage" : reason === "too-large" ? "profile.avatar.tooLarge" : "profile.avatar.failed"));
    } finally {
      setBusy(false);
    }
  };

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void run((id) => uploadAvatar(id, file), "profile.avatar.updated");
  };

  return (
    <div className="flex items-center gap-4">
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onPick} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={t("profile.avatar.change")}
        className="relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
      >
        <UserAvatar className="h-16 w-16 text-xl" />
        <span aria-hidden="true" className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-card text-foreground ring-1 ring-border">
          <Camera className="h-3.5 w-3.5" />
        </span>
      </button>
      <div className="min-w-0 space-y-1">
        <p className="font-heading text-lg font-semibold truncate">{displayName || t("nav.profile")}</p>
        <p className="text-xs text-muted-foreground font-tabular-nums">ID {user?.id.slice(0, 8) ?? "-"}</p>
        {hasOwnAvatar(user) && (
          <Button type="button" variant="ghost" size="sm" className="-ml-3.5 min-h-11" disabled={busy} onClick={() => void run(removeAvatar, "profile.avatar.removed")}>
            {t("profile.avatar.remove")}
          </Button>
        )}
      </div>
    </div>
  );
}
