"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

const modifierTypes = ["SIZE", "SUGAR", "ICE", "TOPPING", "OTHER"] as const;

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

export async function addModifierTemplateAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const required = String(formData.get("required") ?? "") === "on";
  const multiSelect = String(formData.get("multiSelect") ?? "") === "on";

  if (!name || !modifierTypes.includes(type as (typeof modifierTypes)[number])) {
    return;
  }

  const template = await prisma.modifierTemplate.create({
    data: {
      name,
      type: type as (typeof modifierTypes)[number],
      required,
      multiSelect,
    },
    select: {
      id: true,
    },
  });

  revalidateModifierPaths(template.id);
}

export async function updateModifierTemplateAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const required = String(formData.get("required") ?? "") === "on";
  const multiSelect = String(formData.get("multiSelect") ?? "") === "on";

  if (!id || !name || !modifierTypes.includes(type as (typeof modifierTypes)[number])) {
    return;
  }

  await prisma.modifierTemplate.update({
    where: { id },
    data: {
      name,
      type: type as (typeof modifierTypes)[number],
      required,
      multiSelect,
    },
  });

  revalidateModifierPaths(id);
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

export async function updateModifierTemplateOptionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const modifierTemplateId = String(formData.get("modifierTemplateId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const priceDelta = Number(formData.get("priceDelta") ?? 0);

  if (!id || !modifierTemplateId || !name || !Number.isFinite(priceDelta)) {
    return;
  }

  await prisma.modifierTemplateOption.update({
    where: { id },
    data: {
      name,
      priceDelta,
    },
  });

  revalidateModifierPaths(modifierTemplateId);
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
