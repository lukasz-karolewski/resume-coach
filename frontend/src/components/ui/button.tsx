import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx as cn } from "clsx";
import { forwardRef, ButtonHTMLAttributes } from "react";

const buttonVariants = cva("disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-blue-500 text-white hover:bg-blue-600",
      destructive: "bg-red-500",
      outline: "border border-gray-300 bg-transparent",
      secondary: "bg-gray-500 text-white hover:bg-gray-600",
      ghost: "bg-transparent",
      link: "bg-transparent underline",
    },
    size: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "size-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
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
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
