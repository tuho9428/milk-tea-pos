"use client";

type OrderModalShellProps = {
  closeHref: string;
  children: React.ReactNode;
};

export function OrderModalShell({ closeHref, children }: OrderModalShellProps) {
  function closeModal() {
    window.location.assign(closeHref);
  }

  return (
    <div className="dialog-backdrop">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/28 backdrop-blur-sm"
        aria-label="Close order details"
        onClick={closeModal}
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-3 flex justify-end">
          <button type="button" className="dialog-close" onClick={closeModal}>
            Close
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
