"use client";

import { Slot } from "@radix-ui/react-slot";
import type * as React from "react";

import { cn } from "~/lib/utils";
import { type ButtonVariants, buttonVariants } from "./button-variants";

function Button({
  asChild = false,
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"button"> &
  ButtonVariants & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
