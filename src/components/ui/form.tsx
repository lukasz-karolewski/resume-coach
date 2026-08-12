"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type * as React from "react";
import { type FieldValues, type UseFormProps, useForm } from "react-hook-form";
import type { z } from "zod";

import { cn } from "~/lib/utils";

type AppFormOptions<TValues extends FieldValues> = Omit<
  UseFormProps<TValues>,
  "mode" | "reValidateMode" | "resolver"
> & {
  // Both of zod's generics are pinned: leaving `Input` to its `unknown` default
  // makes `zodResolver` produce a `Resolver<unknown>` that no longer lines up
  // with the form, which is what previously forced a cast here.
  schema?: z.ZodType<TValues, TValues>;
};

export function useAppForm<TValues extends FieldValues>({
  schema,
  ...options
}: AppFormOptions<TValues>) {
  return useForm<TValues>({
    ...options,
    mode: "onTouched",
    resolver: schema ? zodResolver(schema) : undefined,
    reValidateMode: "onChange",
  });
}

export function Form({ className, ...props }: React.ComponentProps<"form">) {
  return (
    <form
      method="post"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}
