import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

interface StartOverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** A timed test starts its clock again too, and the dialog says so. */
  timed?: boolean;
}

/** Asks before wiping a test that holds its answers until the end: this clears them and the saved progress. */
export function StartOverDialog({ open, onOpenChange, onConfirm, timed }: StartOverDialogProps) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("exam.startOverConfirm")}</DialogTitle>
          <DialogDescription>{t(timed ? "exam.startOverDescTimed" : "exam.startOverDesc")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("exam.keepGoing")}</Button>
          <Button variant="destructive" onClick={onConfirm}>{t("exam.startOverAction")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
