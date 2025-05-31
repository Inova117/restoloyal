import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    interactive?: boolean
    elevated?: boolean
    variant?: 'default' | 'editorial' | 'compact' | 'stats'
  }
>(({ className, interactive = false, elevated = false, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-smooth",
      {
        "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer": interactive,
        "shadow-lg": elevated,
        // Editorial variant - generous padding and larger radius
        "rounded-2xl p-10 lg:p-12": variant === 'editorial',
        // Compact variant - moderate padding
        "p-8 lg:p-10": variant === 'compact',
        // Stats variant - optimized for metrics display
        "p-8 hover:shadow-lg hover:-translate-y-1": variant === 'stats',
        // Default variant - standard padding
        "": variant === 'default',
      },
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'editorial' | 'compact' | 'stats'
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "flex flex-col space-y-2",
      {
        // Editorial variant - more generous spacing
        "space-y-3 mb-8 lg:mb-10": variant === 'editorial',
        // Compact variant - moderate spacing
        "space-y-2 mb-6": variant === 'compact',
        // Stats variant - minimal spacing for metrics
        "flex-row items-center justify-between space-y-0 mb-6": variant === 'stats',
        // Default variant - standard spacing
        "p-8 pb-6": variant === 'default',
      },
      className
    )} 
    {...props} 
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    variant?: 'default' | 'editorial' | 'compact' | 'stats'
  }
>(({ className, children, variant = 'default', ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-editorial font-semibold leading-snug tracking-tight text-balance",
      {
        // Editorial variant - larger, more prominent
        "text-3xl lg:text-4xl": variant === 'editorial',
        // Compact variant - moderate size
        "text-xl lg:text-2xl": variant === 'compact',
        // Stats variant - smaller, secondary
        "text-sm font-medium text-muted-foreground": variant === 'stats',
        // Default variant - standard size
        "text-2xl": variant === 'default',
      },
      className
    )}
    {...props}
  >
    {children}
  </h3>
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    variant?: 'default' | 'editorial' | 'compact'
  }
>(({ className, children, variant = 'default', ...props }, ref) => (
  <p 
    ref={ref} 
    className={cn(
      "text-muted-foreground leading-relaxed text-pretty",
      {
        // Editorial variant - larger, more readable
        "text-lg lg:text-xl": variant === 'editorial',
        // Compact variant - standard size
        "text-base": variant === 'compact',
        // Default variant - standard size
        "": variant === 'default',
      },
      className
    )} 
    {...props}
  >
    {children}
  </p>
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'editorial' | 'compact' | 'stats'
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "space-comfortable",
      {
        // Editorial variant - generous spacing
        "space-y-8 lg:space-y-10": variant === 'editorial',
        // Compact variant - moderate spacing
        "space-y-6": variant === 'compact',
        // Stats variant - minimal spacing
        "": variant === 'stats',
        // Default variant - standard spacing and padding
        "p-8 pt-0": variant === 'default',
      },
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'editorial' | 'compact'
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "flex items-center",
      {
        // Editorial variant - generous spacing
        "mt-10 lg:mt-12": variant === 'editorial',
        // Compact variant - moderate spacing
        "mt-8": variant === 'compact',
        // Default variant - standard spacing and padding
        "p-8 pt-0": variant === 'default',
      },
      className
    )} 
    {...props} 
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
