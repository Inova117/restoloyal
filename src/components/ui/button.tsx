import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transform-gpu",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.96] active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.96] active:translate-y-0",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:-translate-y-0.5 active:scale-[0.96] active:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.96] active:translate-y-0",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline hover:scale-[1.02] active:scale-[0.98]",
        sage: "bg-sage-turquoise-600 text-white shadow-sm hover:bg-sage-turquoise-700 hover:shadow-sage hover:-translate-y-0.5 active:scale-[0.96] active:translate-y-0",
        warm: "bg-warm-gray-600 text-white shadow-sm hover:bg-warm-gray-700 hover:shadow-warm hover:-translate-y-0.5 active:scale-[0.96] active:translate-y-0",
        success: "bg-soft-emerald-500 text-white shadow-sm hover:bg-soft-emerald-600 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.96] active:translate-y-0",
        warning: "bg-soft-amber-500 text-white shadow-sm hover:bg-soft-amber-600 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.96] active:translate-y-0",
      },
      size: {
        default: "h-12 px-6 py-3 touch-target",
        sm: "h-10 rounded-lg px-4 text-sm",
        lg: "h-14 rounded-xl px-8 text-base touch-comfortable",
        xl: "h-16 rounded-2xl px-10 text-lg touch-spacious",
        icon: "h-12 w-12 touch-target",
        "icon-sm": "h-10 w-10 rounded-lg",
        "icon-lg": "h-14 w-14 rounded-xl touch-comfortable",
      },
      effect: {
        none: "",
        lift: "hover:shadow-lg hover:-translate-y-1",
        glow: "hover:shadow-lg hover:shadow-primary/20",
        scale: "hover:scale-105 active:scale-95",
        bounce: "hover:animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      effect: "none",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  success?: boolean
  error?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    effect,
    asChild = false, 
    loading, 
    loadingText,
    success,
    error,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Apply success/error animations
    const animationClass = React.useMemo(() => {
      if (success) return "success-bounce"
      if (error) return "error-shake"
      return ""
    }, [success, error])
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, effect, className }),
          animationClass,
          {
            "cursor-not-allowed": disabled || loading,
            "relative overflow-hidden": loading,
          }
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <>
            <div className="absolute inset-0 bg-current opacity-10 animate-pulse" />
            <div className="loading-dots mr-2">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </>
        )}
        {loading ? (loadingText || "Loading...") : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
