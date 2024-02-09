import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Job } from "@prisma/client";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { Button } from "~/components/ui/button";
import Modal from "~/components/ui/modal";
import { api } from "~/trpc/react";
import { RouterInputs } from "~/trpc/shared";
import { zodErrorsToString } from "~/utils";

import FormField from "../ui/form-field";
import { Input } from "../ui/input";

interface AddJobModalProps {}
type FormValues = RouterInputs["job"]["addJob"];

export const AddJobModal = NiceModal.create<AddJobModalProps>(() => {
  const modal = useModal();

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>();

  const { mutate: create } = api.job.addJob.useMutation({
    onSuccess: (data: any) => {
      toast.success("Saved");
      modal.resolve();
      modal.remove();
    },
    onError: (error: any) => {
      const errorMessage = zodErrorsToString(error);
      if (errorMessage) toast.error(errorMessage);
      else toast.error("Failed to save");
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data, event) => {
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
