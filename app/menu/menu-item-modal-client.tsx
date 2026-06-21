"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ProductDetailContent,
  type ProductDetailData,
} from "@/app/menu/[slug]/product-detail-content";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type MenuModalContextValue = {
  openProduct: (slug: string) => void;
  prefetchProduct: (slug: string) => void;
};

const MenuModalContext = React.createContext<MenuModalContextValue | null>(null);

const menuItemQueryKey = (slug: string) => ["menu-item", slug] as const;

async function fetchMenuItemDetail(slug: string) {
  const response = await fetch(`/api/menu-items/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load this menu item.");
  }

  const payload = (await response.json()) as { drink: ProductDetailData };
  return payload.drink;
}

type MenuModalProviderProps = {
  initialSlug: string | null;
  children: React.ReactNode;
};

export function MenuModalProvider({ initialSlug, children }: MenuModalProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeSlug, setActiveSlug] = React.useState(initialSlug);
  const [, startTransition] = React.useTransition();

  React.useEffect(() => {
    function syncFromUrl() {
      const nextSlug = new URLSearchParams(window.location.search).get("item")?.trim() || null;
      setActiveSlug(nextSlug);
    }

    window.addEventListener("popstate", syncFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);

  const openProduct = React.useCallback(
    (slug: string) => {
      setActiveSlug(slug);
      startTransition(() => {
        router.push(`/menu?item=${encodeURIComponent(slug)}`, { scroll: false });
      });
    },
    [router],
  );

  const prefetchProduct = React.useCallback(
    (slug: string) => {
      void queryClient.prefetchQuery({
        queryKey: menuItemQueryKey(slug),
        queryFn: () => fetchMenuItemDetail(slug),
      });
    },
    [queryClient],
  );

  const closeProduct = React.useCallback(() => {
    setActiveSlug(null);
    startTransition(() => {
      router.replace("/menu", { scroll: false });
    });
  }, [router]);

  const contextValue = React.useMemo(
    () => ({ openProduct, prefetchProduct }),
    [openProduct, prefetchProduct],
  );

  return (
    <MenuModalContext.Provider value={contextValue}>
      {children}
      {activeSlug ? <MenuItemModal slug={activeSlug} onClose={closeProduct} /> : null}
    </MenuModalContext.Provider>
  );
}

type MenuItemCardLinkProps = {
  slug: string;
  className?: string;
  children: React.ReactNode;
};

export function MenuItemCardLink({ slug, className, children }: MenuItemCardLinkProps) {
  const context = React.useContext(MenuModalContext);
  const href = `/menu?item=${encodeURIComponent(slug)}`;

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      !context ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    context.openProduct(slug);
  }

  function handleMouseEnter() {
    context?.prefetchProduct(slug);
  }

  function handleFocus() {
    context?.prefetchProduct(slug);
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      className={className}
    >
      {children}
    </a>
  );
}

type MenuItemModalProps = {
  slug: string;
  onClose: () => void;
};

function MenuItemModal({ slug, onClose }: MenuItemModalProps) {
  const query = useQuery({
    queryKey: menuItemQueryKey(slug),
    queryFn: () => fetchMenuItemDetail(slug),
  });

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Product details"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close product details"
        onClick={onClose}
      />

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={onClose} className="dialog-close cursor-pointer">
            Close
          </button>
        </div>

        {query.isPending ? <ProductDetailSkeleton /> : null}
        {query.data ? <ProductDetailContent drink={query.data} mode="modal" /> : null}
        {query.data === null ? (
          <div className="section-card p-7">
            <h2 className="section-title">Item not found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This menu item is unavailable or could not be loaded.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={onClose}
                className={cn(buttonVariants({ size: "sm" }), "cursor-pointer")}
              >
                Back to Menu
              </button>
            </div>
          </div>
        ) : null}
        {query.isError ? (
          <div className="section-card p-7">
            <h2 className="section-title">Could not load item</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Something went wrong while loading this item. Please try again.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={onClose}
                className={cn(buttonVariants({ size: "sm" }), "cursor-pointer")}
              >
                Back to Menu
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <section className="section-card max-h-[85vh] overflow-hidden p-7 sm:p-8">
      <div className="animate-pulse space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="h-4 w-28 rounded-full bg-muted" />
            <div className="h-7 w-24 rounded-full bg-muted" />
          </div>
          <div className="space-y-3">
            <div className="h-10 w-3/4 rounded-2xl bg-muted" />
            <div className="h-4 w-full rounded-full bg-muted" />
            <div className="h-4 w-2/3 rounded-full bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded-full bg-muted" />
            <div className="h-8 w-24 rounded-full bg-muted" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="soft-panel p-5">
            <div className="h-4 w-24 rounded-full bg-muted" />
            <div className="mt-4 h-9 w-28 rounded-2xl bg-muted" />
          </div>
          <div className="soft-panel p-5">
            <div className="h-4 w-28 rounded-full bg-muted" />
            <div className="mt-4 h-4 w-full rounded-full bg-muted" />
            <div className="mt-2 h-4 w-4/5 rounded-full bg-muted" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="soft-panel h-40 p-5" />
          <div className="soft-panel h-40 p-5" />
        </div>
      </div>
    </section>
  );
}
