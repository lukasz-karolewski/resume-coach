"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type * as React from "react";
import {
  type FieldValues,
  type Resolver,
  type UseFormProps,
  useForm,
} from "react-hook-form";
import type { z } from "zod";

import { cn } from "~/lib/utils";

type AppFormOptions<TValues extends FieldValues> = Omit<
  UseFormProps<TValues>,
  "mode" | "reValidateMode" | "resolver"
> & {
  schema?: z.ZodType<TValues>;
};

export function useAppForm<TValues extends FieldValues>({
  schema,
  ...options
}: AppFormOptions<TValues>) {
  return useForm<TValues>({
    ...options,
    mode: "onTouched",
    resolver: schema
      ? (zodResolver(schema as never) as unknown as Resolver<TValues>)
      : undefined,
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
