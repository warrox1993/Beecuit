"use client";
import { forwardRef, type InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";

type State = "default" | "error" | "success";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  state?: State;
  hint?: string;
  size?: "md" | "lg";
};

/**
 * FormField — Au Fil des Saveurs (Phase 4E).
 *
 * Floating-label text input with accessible focus rings and themed
 * success/error states. Uses HTML5 :placeholder-shown trick (no JS)
 * for the floating label position.
 *
 * Usage:
 *   <FormField label="Email" type="email" required />
 *   <FormField label="Code postal" state="error" hint="Code postal invalide" />
 */
export const FormField = forwardRef<HTMLInputElement, Props>(function FormField(
  { label, state = "default", hint, size = "md", className, id: idProp, placeholder = " ", ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const stateBorder =
    state === "error"
      ? "border-terracotta/70 focus-within:border-terracotta focus-within:ring-terracotta/25"
      : state === "success"
        ? "border-leaf/70 focus-within:border-leaf focus-within:ring-leaf/25"
        : "border-warm-brown/25 focus-within:border-honey-dark focus-within:ring-honey-dark/30";
  const sizeCls = size === "lg" ? "h-14 pt-5 px-4 text-base" : "h-12 pt-4 px-3.5 text-sm";

  return (
    <div className="w-full">
      <div
        className={cn(
          "bg-cream-light/60 relative rounded-xl border transition-all focus-within:ring-2",
          stateBorder,
          className,
        )}
      >
        <label
          htmlFor={id}
          className={cn(
            "text-warm-brown/60 pointer-events-none absolute left-3.5 origin-left transition-all duration-200",
            "top-1/2 -translate-y-1/2 text-sm",
            // raise when input has content or is focused
            "peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[0.65rem] peer-focus:font-semibold peer-focus:tracking-[0.12em] peer-focus:uppercase",
            "peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:text-[0.65rem] peer-[&:not(:placeholder-shown)]:font-semibold peer-[&:not(:placeholder-shown)]:tracking-[0.12em] peer-[&:not(:placeholder-shown)]:uppercase",
            state === "error"
              ? "peer-focus:text-terracotta peer-[&:not(:placeholder-shown)]:text-terracotta"
              : state === "success"
                ? "peer-focus:text-leaf peer-[&:not(:placeholder-shown)]:text-leaf"
                : "peer-focus:text-honey-dark peer-[&:not(:placeholder-shown)]:text-honey-dark",
          )}
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          placeholder={placeholder}
          aria-invalid={state === "error"}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(
            "text-warm-brown placeholder:text-transparent peer w-full bg-transparent focus:outline-none",
            sizeCls,
          )}
          {...rest}
        />
      </div>
      {hint && (
        <p
          id={`${id}-hint`}
          className={cn(
            "mt-1 text-xs",
            state === "error"
              ? "text-terracotta"
              : state === "success"
                ? "text-leaf"
                : "text-warm-brown/65",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
});
