"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

const modifierTypes = ["SIZE", "SUGAR", "ICE", "TOPPING", "OTHER"] as const;
const defaultMaxSelections = 2;

export type ModifierTemplateFormState = {
  status: "idle" | "success" | "error";
  message: string;
  token: string;
};

function createModifierTemplateFormState(
  status: ModifierTemplateFormState["status"],
  message: string,
): ModifierTemplateFormState {
  return {
    status,
    message,
    token: crypto.randomUUID(),
  };
}

function revalidateModifierPaths(modifierId?: string) {
  revalidatePath("/admin/modifiers");
  revalidatePath("/admin/menu");
  revalidatePath("/menu");

  if (modifierId) {
    revalidatePath(`/admin/modifiers/${modifierId}`);
  }
}

async function getNextModifierTemplateOptionSortOrder(modifierTemplateId: string) {
  const lastOption = await prisma.modifierTemplateOption.findFirst({
    where: { modifierTemplateId },
    orderBy: [{ sortOrder: "desc" }],
    select: { sortOrder: true },
  });

  return (lastOption?.sortOrder ?? -1) + 1;
}

async function swapModifierTemplateOptionOrder(
  modifierTemplateId: string,
  optionId: string,
  direction: "up" | "down",
) {
  const currentOption = await prisma.modifierTemplateOption.findUnique({
    where: { id: optionId },
    select: {
      id: true,
      modifierTemplateId: true,
      sortOrder: true,
    },
  });

  if (!currentOption || currentOption.modifierTemplateId !== modifierTemplateId) {
    return;
  }

  const adjacentOption = await prisma.modifierTemplateOption.findFirst({
    where: {
      modifierTemplateId,
      ...(direction === "up"
        ? { sortOrder: { lt: currentOption.sortOrder } }
        : { sortOrder: { gt: currentOption.sortOrder } }),
    },
    orderBy:
      direction === "up"
        ? [{ sortOrder: "desc" }]
        : [{ sortOrder: "asc" }],
    select: {
      id: true,
      sortOrder: true,
    },
  });

  if (!adjacentOption) {
    return;
  }

  await prisma.$transaction([
    prisma.modifierTemplateOption.update({
      where: { id: currentOption.id },
      data: { sortOrder: adjacentOption.sortOrder },
    }),
    prisma.modifierTemplateOption.update({
      where: { id: adjacentOption.id },
      data: { sortOrder: currentOption.sortOrder },
    }),
  ]);

  revalidateModifierPaths(modifierTemplateId);
}

function parseMaxSelections(formData: FormData) {
  const rawValue = Number(formData.get("maxSelections") ?? defaultMaxSelections);

  if (!Number.isInteger(rawValue) || rawValue < 1) {
    return defaultMaxSelections;
  }

  return rawValue;
}

async function resolveDefaultOptionId(
  modifierTemplateId: string,
  candidateDefaultOptionId: string | null,
  fallbackDefaultOptionId: string | null,
) {
  const candidateIds = [candidateDefaultOptionId, fallbackDefaultOptionId].filter(
    (value): value is string => Boolean(value),
  );

  if (candidateIds.length > 0) {
    const validOption = await prisma.modifierTemplateOption.findFirst({
      where: {
        id: { in: candidateIds },
        modifierTemplateId,
      },
      select: {
        id: true,
      },
    });

    if (validOption) {
      return validOption.id;
    }
  }

  const firstOption = await prisma.modifierTemplateOption.findFirst({
    where: {
      modifierTemplateId,
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
    },
  });

  return firstOption?.id ?? null;
}

export async function addModifierTemplateAction(
  _state: ModifierTemplateFormState,
  formData: FormData,
): Promise<ModifierTemplateFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const required = String(formData.get("required") ?? "") === "on";
  const multiSelect = String(formData.get("multiSelect") ?? "") === "on";
  const maxSelections = parseMaxSelections(formData);

  if (!name || !modifierTypes.includes(type as (typeof modifierTypes)[number])) {
    return {
      ...createModifierTemplateFormState(
        "error",
        "Please enter a template name and choose a valid type.",
      ),
    };
  }

  const template = await prisma.modifierTemplate.create({
    data: {
      name,
      type: type as (typeof modifierTypes)[number],
      required,
      multiSelect,
      maxSelections,
    },
    select: {
      id: true,
    },
  });

  revalidateModifierPaths(template.id);

  return {
    ...createModifierTemplateFormState("success", "Template created successfully."),
  };
}

export async function updateModifierTemplateAction(
  _state: ModifierTemplateFormState,
  formData: FormData,
): Promise<ModifierTemplateFormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const required = String(formData.get("required") ?? "") === "on";
  const multiSelect = String(formData.get("multiSelect") ?? "") === "on";
  const maxSelections = parseMaxSelections(formData);
  const defaultOptionId = String(formData.get("defaultOptionId") ?? "").trim() || null;

  if (!id || !name || !modifierTypes.includes(type as (typeof modifierTypes)[number])) {
    return {
      ...createModifierTemplateFormState(
        "error",
        "Please complete the template fields before saving.",
      ),
    };
  }

  const template = await prisma.modifierTemplate.findUnique({
    where: { id },
    select: {
      id: true,
      defaultOptionId: true,
      options: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
          id: true,
        },
      },
    },
  });

  if (!template) {
    return {
      ...createModifierTemplateFormState(
        "error",
        "We couldn't find that modifier template.",
      ),
    };
  }

  const resolvedDefaultOptionId = required
    ? await resolveDefaultOptionId(id, defaultOptionId, template.defaultOptionId)
    : null;

  await prisma.modifierTemplate.update({
    where: { id },
    data: {
      name,
      type: type as (typeof modifierTypes)[number],
      required,
      multiSelect,
      maxSelections,
      defaultOptionId: resolvedDefaultOptionId,
    },
  });

  revalidateModifierPaths(id);

  return {
    ...createModifierTemplateFormState("success", "Template saved successfully."),
  };
}

export async function deleteModifierTemplateAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  await prisma.modifierTemplate.delete({
    where: { id },
  });

  revalidateModifierPaths();
}

export async function addModifierTemplateOptionAction(formData: FormData) {
  const modifierTemplateId = String(formData.get("modifierTemplateId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const priceDelta = Number(formData.get("priceDelta") ?? 0);

  if (!modifierTemplateId || !name || !Number.isFinite(priceDelta)) {
    return;
  }

  const sortOrder = await getNextModifierTemplateOptionSortOrder(modifierTemplateId);

  await prisma.modifierTemplateOption.create({
    data: {
      modifierTemplateId,
      name,
      priceDelta,
      sortOrder,
    },
  });

  revalidateModifierPaths(modifierTemplateId);
}

export async function updateModifierTemplateOptionAction(
  _state: ModifierTemplateFormState,
  formData: FormData,
): Promise<ModifierTemplateFormState> {
  const id = String(formData.get("id") ?? "");
  const modifierTemplateId = String(formData.get("modifierTemplateId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const priceDelta = Number(formData.get("priceDelta") ?? 0);

  if (!id || !modifierTemplateId || !name || !Number.isFinite(priceDelta)) {
    return {
      ...createModifierTemplateFormState(
        "error",
        "Please complete the option fields before saving.",
      ),
    };
  }

  await prisma.modifierTemplateOption.update({
    where: { id },
    data: {
      name,
      priceDelta,
    },
  });

  revalidateModifierPaths(modifierTemplateId);

  return {
    ...createModifierTemplateFormState("success", "Option saved successfully."),
  };
}

export async function deleteModifierTemplateOptionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const modifierTemplateId = String(formData.get("modifierTemplateId") ?? "");

  if (!id || !modifierTemplateId) {
    return;
  }

  await prisma.modifierTemplateOption.delete({
    where: { id },
  });

  revalidateModifierPaths(modifierTemplateId);
}

export async function moveModifierTemplateOptionUpAction(formData: FormData) {
  const modifierTemplateId = String(formData.get("modifierTemplateId") ?? "");
  const optionId = String(formData.get("optionId") ?? "");

  if (!modifierTemplateId || !optionId) {
    return;
  }

  await swapModifierTemplateOptionOrder(modifierTemplateId, optionId, "up");
}

export async function moveModifierTemplateOptionDownAction(formData: FormData) {
  const modifierTemplateId = String(formData.get("modifierTemplateId") ?? "");
  const optionId = String(formData.get("optionId") ?? "");

  if (!modifierTemplateId || !optionId) {
    return;
  }

  await swapModifierTemplateOptionOrder(modifierTemplateId, optionId, "down");
}
