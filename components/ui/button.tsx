import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base: sharp corners, bold, no rounded, strong press animation
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold " +
  "rounded-none border-2 border-zinc-950 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-40 " +
  "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 " +
  // 3D press animation — snappy
  "transition-[transform,box-shadow] duration-[50ms] ease-out " +
  "active:translate-x-[3px] active:translate-y-[3px]",
  {
    variants: {
      variant: {
        // Primary: Construction Yellow — main CTA
        default:
          "bg-amber-400 text-zinc-950 border-zinc-950 " +
          "shadow-[6px_6px_0px_0px_#000] " +
          "hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] " +
          "active:shadow-[1px_1px_0px_0px_#000]",

        // Destructive: Red
        destructive:
          "bg-red-500 text-white border-zinc-950 " +
          "shadow-[6px_6px_0px_0px_#000] " +
          "hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] " +
          "active:shadow-[1px_1px_0px_0px_#000]",

        // Outline: White/cream with black border
        outline:
          "bg-white text-zinc-950 border-zinc-950 " +
          "shadow-[6px_6px_0px_0px_#000] " +
          "hover:bg-zinc-50 hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] " +
          "active:shadow-[1px_1px_0px_0px_#000]",

        // Secondary: Light gray
        secondary:
          "bg-zinc-100 text-zinc-950 border-zinc-950 " +
          "shadow-[6px_6px_0px_0px_#000] " +
          "hover:bg-zinc-200 hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] " +
          "active:shadow-[1px_1px_0px_0px_#000]",

        // Ghost: No shadow, minimal
        ghost:
          "border-transparent shadow-none bg-transparent text-zinc-700 " +
          "hover:bg-zinc-100 hover:text-zinc-950 hover:border-transparent " +
          "active:translate-x-0 active:translate-y-0",

        // Link: Underline only
        link:
          "border-transparent shadow-none bg-transparent text-amber-700 underline-offset-4 hover:underline " +
          "active:translate-x-0 active:translate-y-0",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 py-1.5 text-xs",
        lg: "h-13 px-8 py-3.5 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
