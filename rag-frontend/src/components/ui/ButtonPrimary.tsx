"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

export type ButtonPrimaryProps = {
  asChild?: boolean;
  variant?: "solid" | "ghost" | "outline";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<NonNullable<ButtonPrimaryProps["variant"]>, string> = {
  solid:
    "bg-cyan-600 text-white shadow-sm hover:bg-cyan-500 focus-visible:ring-cyan-300",
  ghost:
    "bg-transparent text-white border border-white/20 hover:bg-white/10 focus-visible:ring-cyan-300",
  outline:
    "border border-cyan-600 text-cyan-700 hover:bg-cyan-50 focus-visible:ring-cyan-200",
};

export const ButtonPrimary = React.forwardRef<HTMLButtonElement, ButtonPrimaryProps>(
  ({ asChild = false, className, variant = "solid", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
ButtonPrimary.displayName = "ButtonPrimary";

