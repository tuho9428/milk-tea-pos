"use client";

import * as React from "react";
import { toast } from "sonner";

import type { ModifierTemplateFormState } from "@/app/admin/modifiers/actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ModifierTemplateOptionFormAction = (
  state: ModifierTemplateFormState,
  formData: FormData,
) => Promise<ModifierTemplateFormState>;

type ModifierTemplateOptionFormProps = {
  action: ModifierTemplateOptionFormAction;
  optionId: string;
  modifierTemplateId: string;
  initialName: string;
  initialPriceDelta: number;
};

const initialFormState: ModifierTemplateFormState = {
  status: "idle",
  message: "",
  token: "",
};

export function ModifierTemplateOptionForm({
  action,
  optionId,
  modifierTemplateId,
  initialName,
  initialPriceDelta,
}: ModifierTemplateOptionFormProps) {
  const [name, setName] = React.useState(initialName);
  const [priceDelta, setPriceDelta] = React.useState(String(initialPriceDelta));
  const actionWithToast = React.useCallback(
    async (state: ModifierTemplateFormState, formData: FormData) => {
      const nextState = await action(state, formData);

      if (nextState.status === "success") {
        toast.success(nextState.message);
      }

      if (nextState.status === "error") {
        toast.error(nextState.message);
      }

      return nextState;
    },
    [action],
  );

  const [, formAction, isPending] = React.useActionState(
    actionWithToast,
    initialFormState,
  );

  return (
    <form
      action={formAction}
      className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
    >
      <input type="hidden" name="id" value={optionId} />
      <input type="hidden" name="modifierTemplateId" value={modifierTemplateId} />
      <Input name="name" value={name} onChange={(event) => setName(event.target.value)} required />
      <Input
        name="priceDelta"
        type="number"
        step="0.01"
        value={priceDelta}
        onChange={(event) => setPriceDelta(event.target.value)}
        required
      />
      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        {isPending ? "Saving..." : "Save Option"}
      </button>
    </form>
  );
}
