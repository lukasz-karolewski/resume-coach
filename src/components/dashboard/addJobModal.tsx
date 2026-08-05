import { useModal } from "@ebay/nice-modal-react";
import { useForm } from "react-hook-form";

import { createModal } from "~/components/modals/modal";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import Modal from "~/components/ui/modal";
import type { RouterInputs } from "~/trpc/shared";

import FormField from "../ui/form-field";

export type AddJobFormResult = RouterInputs["job"]["addJob"];

export const AddJobModal = createModal<AddJobFormResult>(() => {
  const modal = useModal();
  const { register, handleSubmit } = useForm<AddJobFormResult>();

  function dismiss() {
    modal.reject(new Error("dismissed"));
    modal.remove();
  }

  const onSubmit = handleSubmit((values) => {
    modal.resolve(values);
    modal.remove();
  });

  return (
    <Modal
      open={modal.visible}
      onClose={dismiss}
      title="Add a job"
      className="md:w-1/2"
    >
      <form onSubmit={onSubmit}>
        <div className="p-4">
          <FormField label="Url" help="The URL of the job posting">
            <Input type="text" {...register("url", { required: true })} />
          </FormField>
        </div>
        <div className="flex justify-end gap-4 bg-slate-100 p-4 ">
          <Button type="submit">Save</Button>
          <Button type="button" variant="secondary" onClick={dismiss}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
});
