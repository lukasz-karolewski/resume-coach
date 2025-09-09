import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx as cn } from "clsx";
import { type ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva("disabled:pointer-events-none disabled:opacity-50", {
  defaultVariants: {
    size: "default",
    variant: "default",
  },
  variants: {
    size: {
      default: "h-10 px-4 py-2",
      icon: "size-10",
      lg: "h-11 rounded-md px-8",
      sm: "h-9 rounded-md px-3",
    },
    variant: {
      default: "bg-blue-500 text-white hover:bg-blue-600",
      destructive: "bg-red-500",
      ghost: "bg-transparent",
      link: "bg-transparent underline",
      outline: "border border-gray-300 bg-transparent",
      secondary: "bg-gray-500 text-white hover:bg-gray-600",
    },
  },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ className, size, variant }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
