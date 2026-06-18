import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva("status-pill", {
  variants: {
    variant: {
      default: "status-muted",
      primary: "status-primary",
      success: "status-success",
      warning: "status-warning",
      destructive: "status-danger",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
