"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function revalidateMenuPaths(menuId?: string, menuSlug?: string) {
  revalidatePath("/admin/menu");
  revalidatePath("/admin/modifiers");
  revalidatePath("/menu");

  if (menuId) {
    revalidatePath(`/admin/menu/${menuId}`);
  }

  if (menuSlug) {
    revalidatePath(`/menu/${menuSlug}`);
  }
}

async function getNextMenuItemSortOrder() {
  const lastMenuItem = await prisma.menuItem.findFirst({
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
    select: { sortOrder: true },
  });

  return (lastMenuItem?.sortOrder ?? -1) + 1;
}

async function swapMenuItemOrder(itemId: string, direction: "up" | "down") {
  const currentItem = await prisma.menuItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      slug: true,
      sortOrder: true,
    },
  });

  if (!currentItem) {
    return;
  }

  const adjacentItem = await prisma.menuItem.findFirst({
    where:
      direction === "up"
        ? { sortOrder: { lt: currentItem.sortOrder } }
        : { sortOrder: { gt: currentItem.sortOrder } },
    orderBy:
      direction === "up"
        ? [{ sortOrder: "desc" }, { createdAt: "desc" }]
        : [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      sortOrder: true,
    },
  });

  if (!adjacentItem) {
    return;
  }

  await prisma.$transaction([
    prisma.menuItem.update({
      where: { id: currentItem.id },
      data: { sortOrder: adjacentItem.sortOrder },
    }),
    prisma.menuItem.update({
      where: { id: adjacentItem.id },
      data: { sortOrder: currentItem.sortOrder },
    }),
  ]);

  revalidateMenuPaths(currentItem.id, currentItem.slug);
}

async function getNextTemplateAttachmentSortOrder(menuItemId: string) {
  const lastAttachment = await prisma.menuItemModifierTemplate.findFirst({
    where: { menuItemId },
    orderBy: [{ sortOrder: "desc" }],
    select: { sortOrder: true },
  });

  return (lastAttachment?.sortOrder ?? -1) + 1;
}

async function swapTemplateAttachmentOrder(
  menuItemId: string,
  modifierTemplateId: string,
  direction: "up" | "down",
) {
  const currentLink = await prisma.menuItemModifierTemplate.findUnique({
    where: {
      menuItemId_modifierTemplateId: {
        menuItemId,
        modifierTemplateId,
      },
    },
    select: {
      menuItemId: true,
      modifierTemplateId: true,
      sortOrder: true,
      menuItem: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!currentLink) {
    return;
  }

  const adjacentLink = await prisma.menuItemModifierTemplate.findFirst({
    where: {
      menuItemId,
      ...(direction === "up"
        ? { sortOrder: { lt: currentLink.sortOrder } }
        : { sortOrder: { gt: currentLink.sortOrder } }),
    },
    orderBy:
      direction === "up"
        ? [{ sortOrder: "desc" }]
        : [{ sortOrder: "asc" }],
    select: {
      menuItemId: true,
      modifierTemplateId: true,
      sortOrder: true,
    },
  });

  if (!adjacentLink) {
    return;
  }

  await prisma.$transaction([
    prisma.menuItemModifierTemplate.update({
      where: {
        menuItemId_modifierTemplateId: {
          menuItemId: currentLink.menuItemId,
          modifierTemplateId: currentLink.modifierTemplateId,
        },
      },
      data: {
        sortOrder: adjacentLink.sortOrder,
      },
    }),
    prisma.menuItemModifierTemplate.update({
      where: {
        menuItemId_modifierTemplateId: {
          menuItemId: adjacentLink.menuItemId,
          modifierTemplateId: adjacentLink.modifierTemplateId,
        },
      },
      data: {
        sortOrder: currentLink.sortOrder,
      },
    }),
  ]);

  revalidateMenuPaths(menuItemId, currentLink.menuItem.slug);
}

export async function addMenuItemAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const tagsInput = String(formData.get("tags") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const categoryId = String(formData.get("categoryId") ?? "");
  const tags = tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!name || !categoryId || !Number.isFinite(price) || price <= 0) {
    return;
  }

  const slug = toSlug(slugInput || name);
  const sortOrder = await getNextMenuItemSortOrder();

  const menuItem = await prisma.menuItem.create({
    data: {
      name,
      slug,
      description: description || null,
      tags,
      basePrice: price,
      categoryId,
      sortOrder,
      isActive: true,
      isSoldOut: false,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  revalidateMenuPaths(menuItem.id, menuItem.slug);
}

export async function updateMenuItemAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const tagsInput = String(formData.get("tags") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const categoryId = String(formData.get("categoryId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "on";
  const tags = tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!id || !name || !categoryId || !Number.isFinite(price) || price <= 0) {
    return;
  }

  const slug = toSlug(slugInput || name);

  await prisma.menuItem.update({
    where: { id },
    data: {
      name,
      slug,
      description: description || null,
      tags,
      basePrice: price,
      categoryId,
      isActive,
    },
  });

  revalidateMenuPaths(id, slug);
}

export async function toggleSoldOutAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const menuSlug = String(formData.get("menuSlug") ?? "");
  const current = String(formData.get("current") ?? "") === "true";

  if (!id) {
    return;
  }

  await prisma.menuItem.update({
    where: { id },
    data: { isSoldOut: !current },
  });

  revalidateMenuPaths(id, menuSlug);
}

export async function moveMenuItemUpAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  await swapMenuItemOrder(id, "up");
}

export async function moveMenuItemDownAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  await swapMenuItemOrder(id, "down");
}

export async function attachModifierTemplateAction(formData: FormData) {
  const menuItemId = String(formData.get("menuItemId") ?? "");
  const modifierTemplateId = String(formData.get("modifierTemplateId") ?? "");
  const menuSlug = String(formData.get("menuSlug") ?? "");

  if (!menuItemId || !modifierTemplateId) {
    return;
  }

  const existingLink = await prisma.menuItemModifierTemplate.findUnique({
    where: {
      menuItemId_modifierTemplateId: {
        menuItemId,
        modifierTemplateId,
      },
    },
    select: {
      menuItemId: true,
    },
  });

  if (existingLink) {
    return;
  }

  const sortOrder = await getNextTemplateAttachmentSortOrder(menuItemId);

  await prisma.menuItemModifierTemplate.create({
    data: {
      menuItemId,
      modifierTemplateId,
      sortOrder,
    },
  });

  revalidateMenuPaths(menuItemId, menuSlug);
}

export async function detachModifierTemplateAction(formData: FormData) {
  const menuItemId = String(formData.get("menuItemId") ?? "");
  const modifierTemplateId = String(formData.get("modifierTemplateId") ?? "");
  const menuSlug = String(formData.get("menuSlug") ?? "");

  if (!menuItemId || !modifierTemplateId) {
    return;
  }

  await prisma.menuItemModifierTemplate.delete({
    where: {
      menuItemId_modifierTemplateId: {
        menuItemId,
        modifierTemplateId,
      },
    },
  });

  revalidateMenuPaths(menuItemId, menuSlug);
}

export async function moveAttachedModifierTemplateUpAction(formData: FormData) {
  const menuItemId = String(formData.get("menuItemId") ?? "");
  const modifierTemplateId = String(formData.get("modifierTemplateId") ?? "");

  if (!menuItemId || !modifierTemplateId) {
    return;
  }

  await swapTemplateAttachmentOrder(menuItemId, modifierTemplateId, "up");
}

export async function moveAttachedModifierTemplateDownAction(formData: FormData) {
  const menuItemId = String(formData.get("menuItemId") ?? "");
  const modifierTemplateId = String(formData.get("modifierTemplateId") ?? "");

  if (!menuItemId || !modifierTemplateId) {
    return;
  }

  await swapTemplateAttachmentOrder(menuItemId, modifierTemplateId, "down");
}
