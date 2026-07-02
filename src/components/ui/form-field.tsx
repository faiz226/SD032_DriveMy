/**
 * FormField — accessible label + input + error message wrapper.
 * Wires aria-describedby, aria-invalid, and aria-required automatically.
 * Use with react-hook-form's register() or Controller.
 */
import { useId } from "react";
import { Label } from "./label";
import { Input, type InputProps } from "./input";
import { cn } from "@/lib/utils";

interface FormFieldProps extends Omit<InputProps, 'error'> {
  label:        string;
  error?:       string;
  hint?:        string;
  required?:    boolean;
  containerClassName?: string;
}

export function FormField({
  label,
  error,
  hint,
  required,
  containerClassName,
  id: externalId,
  ...inputProps
}: FormFieldProps) {
  const generatedId  = useId();
  const id           = externalId ?? generatedId;
  const errorId      = `${id}-error`;
  const hintId       = `${id}-hint`;

  const describedBy = [
    hint  ? hintId  : null,
    error ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground -mt-0.5">
          {hint}
        </p>
      )}

      <Input
        id={id}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        aria-required={required}
        error={!!error}
        {...inputProps}
      />

      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-xs text-destructive flex items-center gap-1"
        >
          <span aria-hidden>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}
