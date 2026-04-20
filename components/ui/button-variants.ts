import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-[0_10px_24px_hsl(var(--primary)/0.18)] hover:bg-[hsl(var(--primary-hover))] hover:border-[hsl(var(--primary-hover))]",
        outline:
          "border-border bg-card text-foreground shadow-sm hover:border-primary/20 hover:bg-primary-soft hover:text-primary",
        secondary:
          "border-border/60 bg-secondary text-secondary-foreground shadow-sm hover:bg-muted",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
        destructive:
          "border-destructive/10 bg-destructive/10 text-destructive shadow-sm hover:bg-destructive/14",
        link:
          "h-auto rounded-none border-transparent px-0 text-primary shadow-none hover:text-primary/90 hover:underline underline-offset-4",
      },
      size: {
        default: "h-11 px-5",
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-6 text-sm",
        icon: "size-11 rounded-full",
        "icon-sm": "size-9 rounded-full",
        "icon-lg": "size-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

export { buttonVariants, type ButtonVariants }
