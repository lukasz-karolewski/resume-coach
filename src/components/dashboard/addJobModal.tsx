import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import Modal from "~/components/ui/modal";
import { toast } from "~/components/ui/toast";
import { useTRPC } from "~/trpc/react";
import type { RouterInputs } from "~/trpc/shared";
import { zodErrorsToString } from "~/utils";

import FormField from "../ui/form-field";
import { Input } from "../ui/input";

interface AddJobModalProps {
  a?: string;
}
type FormValues = RouterInputs["job"]["addJob"];

export const AddJobModal = NiceModal.create<AddJobModalProps>(() => {
  const modal = useModal();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { register, handleSubmit } = useForm<FormValues>();

  const { mutate: create } = useMutation(
    trpc.job.addJob.mutationOptions({
      onError: (error) => {
        const errorMessage = zodErrorsToString(error);
        toast.add({
          title: errorMessage || "Failed to save",
          type: "error",
        });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.job.pathFilter());
      },
      onSuccess: (_data) => {
        toast.add({ title: "Saved", type: "success" });
        modal.resolve();
        modal.remove();
      },
    }),
  );

  const onSubmit: SubmitHandler<FormValues> = (data, _event) => {
    return create(data);
  };

  return (
    <Modal
      open={modal.visible}
      onClose={() => {
        modal.remove();
      }}
      title={"Add a job"}
      className="md:w-1/2"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-4">
          <FormField label="Url" help="The URL of the job posting">
            <Input type="text" {...register("url", { required: true })} />
          </FormField>
        </div>
        <div className="flex justify-end gap-4 bg-slate-100 p-4 ">
          <Button type="submit">Save</Button>
          <Button type="button" variant="secondary" onClick={modal.remove}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
});
