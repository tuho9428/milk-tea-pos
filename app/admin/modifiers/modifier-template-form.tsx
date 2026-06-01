"use client";

import * as React from "react";
import { toast } from "sonner";

import type { ModifierTemplateFormState } from "@/app/admin/modifiers/actions";
import { ModifierTemplateSettings } from "@/app/admin/modifiers/modifier-template-settings";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const modifierTypes = ["SIZE", "SUGAR", "ICE", "TOPPING", "OTHER"] as const;

type ModifierTemplateFormAction = (
  state: ModifierTemplateFormState,
  formData: FormData,
) => Promise<ModifierTemplateFormState>;

type ModifierTemplateFormProps = {
  action: ModifierTemplateFormAction;
  submitLabel: string;
  initialId?: string;
  initialName?: string;
  initialType?: (typeof modifierTypes)[number];
  initialRequired?: boolean;
  initialMultiSelect?: boolean;
  initialMaxSelections?: number;
  showDefaultOptionSelect?: boolean;
  defaultOptionId?: string | null;
  defaultOptionChoices?: Array<{
    id: string;
    name: string;
  }>;
};

const initialFormState: ModifierTemplateFormState = {
  status: "idle",
  message: "",
  token: "",
};

export function ModifierTemplateForm({
  action,
  submitLabel,
  initialId,
  initialName = "",
  initialType = "OTHER",
  initialRequired = false,
  initialMultiSelect = false,
  initialMaxSelections = 2,
  showDefaultOptionSelect = false,
  defaultOptionId = null,
  defaultOptionChoices = [],
}: ModifierTemplateFormProps) {
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
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {initialId ? <input type="hidden" name="id" value={initialId} /> : null}
      <Input name="name" placeholder="Template name" defaultValue={initialName} required />
      <select name="type" defaultValue={initialType} className="field-select">
        {modifierTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/45 px-4 py-3 text-sm text-foreground">
        <input
          name="required"
          type="checkbox"
          defaultChecked={initialRequired}
          className="field-checkbox"
        />
        Required
      </label>
      <ModifierTemplateSettings
        initialMultiSelect={initialMultiSelect}
        initialMaxSelections={initialMaxSelections}
      />
      {showDefaultOptionSelect ? (
        <label className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/45 px-4 py-3 text-sm text-foreground sm:col-span-2">
          <span className="font-medium">Default option for required groups</span>
          <select
            name="defaultOptionId"
            defaultValue={defaultOptionId ?? ""}
            className="field-select"
          >
            <option value="">Use first option</option>
            {defaultOptionChoices.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            Required groups will preselect this option. If none is set, the first option is used.
          </span>
        </label>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants({ size: "sm" }), "sm:col-span-2 w-fit")}
      >
        {isPending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
