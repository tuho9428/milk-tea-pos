import Link from "next/link";

import { updateTaxSettingsAction } from "@/app/admin/settings/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getStoreSettings } from "@/lib/store-settings";

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
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
          >
            Back to Dashboard
          </Link>
        </div>

        <Card className="border border-stone-200 bg-white py-0">
          <CardHeader className="border-b border-stone-200 px-6 py-6">
            <CardTitle className="text-3xl font-bold text-stone-900">Settings</CardTitle>
            <CardDescription className="text-stone-600">
              Manage store-level values used across the ordering flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 py-6">
            <section className="rounded-xl border border-stone-200 bg-stone-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">Tax Settings</h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Enter tax as a percentage. Example: `8.25` means 8.25%.
                  </p>
                </div>
                <div className="rounded-lg bg-white px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Current Tax Rate
                  </p>
                  <p className="mt-1 text-lg font-semibold text-stone-900">
                    {(Number(settings.taxRate) * 100).toFixed(2)}%
                  </p>
                  <p className="text-sm text-stone-500">
                    Stored as decimal: {Number(settings.taxRate).toFixed(4)}
                  </p>
                </div>
              </div>

              {saved ? (
                <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  Tax settings saved.
                </p>
              ) : null}

              {hasError ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Enter a valid tax rate between 0 and 100.
                </p>
              ) : null}

              <form action={updateTaxSettingsAction} className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-stone-700">Store Name</span>
                  <input
                    name="storeName"
                    defaultValue={settings.storeName ?? ""}
                    placeholder="Milk Tea Shop"
                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-stone-300 focus:ring-2"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-stone-700">
                    Tax Rate (%)
                  </span>
                  <input
                    name="taxRatePercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={(Number(settings.taxRate) * 100).toFixed(2)}
                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-stone-300 focus:ring-2"
                    required
                  />
                </label>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-700"
                  >
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
