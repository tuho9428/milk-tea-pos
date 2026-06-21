"use client";

type HardNavigationButtonProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
};

export function HardNavigationButton({
  href,
  className,
  children,
}: HardNavigationButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.location.assign(href);
      }}
    >
      {children}
    </button>
  );
}
