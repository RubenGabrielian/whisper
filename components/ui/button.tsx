import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold " +
  "rounded-xl " +
  "focus-visible:outline-none focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/20 " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 " +
  "active:scale-[0.99] transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-950 text-white shadow-md hover:bg-zinc-800",
        destructive:
          "bg-red-600 text-white shadow-md hover:bg-red-500",
        outline:
          "border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50",
        secondary:
          "border border-zinc-200 bg-zinc-50/50 text-zinc-700 shadow-sm hover:bg-zinc-100",
        ghost:
          "bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        link:
          "bg-transparent p-0 text-zinc-600 underline-offset-4 hover:underline hover:text-zinc-900",
      },
      size: {
        default: "h-[46px] px-5 text-[0.88rem]",
        sm: "h-9 px-3.5 text-[0.8rem] rounded-lg",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-0",
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
