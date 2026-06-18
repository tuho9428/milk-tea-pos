import Link from "next/link";

import { updateTaxSettingsAction } from "@/app/admin/settings/actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStoreSettings } from "@/lib/store-settings";
import { cn } from "@/lib/utils";

type AdminSettingsPageProps = {
  searchParams?: Promise<{
    saved?: string;
    error?: string;
  }>;
};

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const settings = await getStoreSettings();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const saved = resolvedSearchParams?.saved === "1";
  const hasError = resolvedSearchParams?.error === "invalid-tax-rate";

  return (
    <main className="page-shell">
      <div className="page-wrap">
        <Link
          href="/admin"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Back to Dashboard
        </Link>

        <Card className="hero-panel">
          <CardHeader className="relative z-10 border-b border-border">
            <p className="eyebrow">Store Settings</p>
            <CardTitle className="mt-2 page-title text-[2.15rem]">Settings</CardTitle>
            <CardDescription>
              Manage store-level values used across the ordering flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 pt-6">
            <section className="soft-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="section-title">Tax Settings</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Enter tax as a percentage. Example: `8.25` means 8.25%.
                  </p>
                </div>
                <div className="section-card px-4 py-3 text-right">
                  <p className="eyebrow">Current Tax Rate</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {(Number(settings.taxRate) * 100).toFixed(2)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Stored as decimal: {Number(settings.taxRate).toFixed(4)}
                  </p>
                </div>
              </div>

              {saved ? (
                <p className="status-pill status-success mt-4">Tax settings saved.</p>
              ) : null}

              {hasError ? (
                <p className="status-pill status-danger mt-4">
                  Enter a valid tax rate between 0 and 100.
                </p>
              ) : null}

              <form action={updateTaxSettingsAction} className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Store Name</span>
                  <Input
                    name="storeName"
                    defaultValue={settings.storeName ?? ""}
                    placeholder="Milk Tea Shop"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Tax Rate (%)</span>
                  <Input
                    name="taxRatePercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={(Number(settings.taxRate) * 100).toFixed(2)}
                    required
                  />
                </label>

                <div className="sm:col-span-2">
                  <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                    Save Tax Settings
                  </button>
                </div>
              </form>
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
