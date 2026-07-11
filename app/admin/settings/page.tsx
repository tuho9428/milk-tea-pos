import Link from "next/link";

import {
  updateOrderEmailSettingsAction,
  updateTaxSettingsAction,
} from "@/app/admin/settings/actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getOrderEmailsEnabled,
  getOrderEmailsEnabledOverride,
  getStoreSettings,
} from "@/lib/store-settings";
import { cn } from "@/lib/utils";

type AdminSettingsPageProps = {
  searchParams?: Promise<{
    error?: string;
    saved?: string;
  }>;
};

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const settings = await getStoreSettings();
  const orderEmailsEnabled = await getOrderEmailsEnabled();
  const orderEmailsOverride = getOrderEmailsEnabledOverride();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const saved = resolvedSearchParams?.saved === "1";
  const hasError = resolvedSearchParams?.error === "invalid-tax-rate";
  const hasEmailError = resolvedSearchParams?.error === "invalid-email-settings";

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

              {saved ? <p className="status-pill status-success mt-4">Settings saved.</p> : null}

              {hasError ? (
                <p className="status-pill status-danger mt-4">
                  Enter a valid tax rate between 0 and 100.
                </p>
              ) : null}

              {hasEmailError ? (
                <p className="status-pill status-danger mt-4">
                  Could not save email settings. Please try again.
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

              <div className="mt-6 border-t border-border pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="section-title">Transactional Emails</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Control whether paid orders send confirmation emails through Resend.
                    </p>
                  </div>
                  <div className={cn("section-card px-4 py-3 text-right")}>
                    <p className="eyebrow">Effective Status</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {orderEmailsEnabled ? "Enabled" : "Disabled"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {orderEmailsOverride === null
                        ? "Controlled by store settings"
                        : "Controlled by ORDER_EMAILS_ENABLED"}
                    </p>
                  </div>
                </div>

                <form action={updateOrderEmailSettingsAction} className="mt-5 space-y-4">
                  <label
                    className={cn(
                      "flex gap-3 rounded-2xl border border-border bg-background/70 p-4",
                      orderEmailsOverride !== null && "opacity-70",
                    )}
                  >
                    <input
                      type="checkbox"
                      name="orderEmailsEnabled"
                      value="true"
                      defaultChecked={settings.orderEmailsEnabled}
                      disabled={orderEmailsOverride !== null}
                      className="mt-1 h-4 w-4 rounded border-border accent-primary"
                    />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Send order confirmation emails</p>
                      <p className="text-sm text-muted-foreground">
                        When enabled, paid orders can trigger a single transactional email.
                        Marketing emails are not affected.
                      </p>
                      {orderEmailsOverride !== null ? (
                        <p className="text-xs text-muted-foreground">
                          This setting is overridden by the environment variable
                          <code className="ml-1 rounded bg-muted px-1 py-0.5 text-[0.8em]">
                            ORDER_EMAILS_ENABLED
                          </code>
                          .
                        </p>
                      ) : null}
                    </div>
                  </label>

                  <div>
                    <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                      Save Email Settings
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
