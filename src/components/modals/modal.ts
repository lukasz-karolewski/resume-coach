import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import type { FC } from "react";

/**
 * `NiceModal.create`/`NiceModal.show` don't infer the value a modal resolves
 * with, so plain `NiceModal.show(Modal, props)` calls can't type-check the
 * result and accept any props object. These wrappers carry both the result
 * type and the props type through `createModal` into `showModal`.
 */
type ModalComponent<Result, Props extends object> = FC<
  Props & NiceModalHocProps
> & { __result?: Result };

export function createModal<Result, Props extends object = object>(
  Component: FC<Props>,
): ModalComponent<Result, Props> {
  return NiceModal.create(Component) as ModalComponent<Result, Props>;
}

const show = NiceModal.show as (
  modal: FC<Record<string, unknown>>,
  args?: Record<string, unknown>,
) => Promise<unknown>;

export function showModal<Result, Props extends object = object>(
  modal: ModalComponent<Result, Props>,
  props?: Props,
): Promise<Result> {
  return show(
    modal as FC<Record<string, unknown>>,
    props as Record<string, unknown> | undefined,
  ) as Promise<Result>;
}
