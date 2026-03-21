import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-900 via-stone-800 to-black px-6 text-stone-100">
      <section className="w-full max-w-xl rounded-2xl border border-stone-700 bg-stone-900/70 p-8 text-center shadow-2xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-amber-300">
          MILK TEA POS
        </p>
        <h1 className="mt-2 text-4xl font-bold text-white">Static UI Demo</h1>
        <p className="mt-3 text-stone-300">
          Browse the mocked storefront flow using hardcoded drinks.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/menu"
            className="rounded-lg bg-amber-300 px-5 py-3 font-semibold text-stone-900 hover:bg-amber-200"
          >
            Open Menu
          </Link>
          <Link
            href="/cart"
            className="rounded-lg border border-stone-600 px-5 py-3 font-semibold text-stone-100 hover:bg-stone-800"
          >
            Open Cart
          </Link>
          <Link
            href="/checkout"
            className="rounded-lg border border-stone-600 px-5 py-3 font-semibold text-stone-100 hover:bg-stone-800"
          >
            Open Checkout
          </Link>
        </div>
      </section>
    </main>
  );
}
