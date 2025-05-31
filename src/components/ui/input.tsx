import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  icon?: React.ReactNode
  floating?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, success, icon, floating = false, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)
    
    const handleFocus = () => setFocused(true)
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false)
      setHasValue(e.target.value.length > 0)
      props.onBlur?.(e)
    }
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0)
      props.onChange?.(e)
    }

    if (floating && label) {
      return (
        <div className="relative group">
          <input
            type={type}
            className={cn(
              "peer flex h-12 w-full rounded-xl border border-input bg-background px-4 pt-6 pb-2 text-sm transition-all duration-200 ease-smooth",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
              "placeholder:text-transparent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "hover:border-ring/50 hover:shadow-sm",
              "transform-gpu",
              {
                "border-destructive focus-visible:ring-destructive": error,
                "border-soft-emerald-500 focus-visible:ring-soft-emerald-500": success,
                "focus-visible:border-ring": !error && !success,
              },
              className
            )}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          <label
            className={cn(
              "absolute left-4 top-4 text-sm text-muted-foreground transition-all duration-200 ease-smooth pointer-events-none",
              "peer-focus:top-2 peer-focus:text-xs peer-focus:text-ring",
              "transform-gpu",
              {
                "top-2 text-xs text-ring": hasValue || focused,
                "text-destructive peer-focus:text-destructive": error,
                "text-soft-emerald-500 peer-focus:text-soft-emerald-500": success,
              }
            )}
          >
            {label}
          </label>
          {icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200">
              {icon}
            </div>
          )}
          {error && (
            <p className="mt-2 text-sm text-destructive animate-in slide-in-from-top-1 duration-200">
              {error}
            </p>
          )}
        </div>
      )
    }

    if (label) {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
          <div className="relative group">
            <input
              type={type}
              className={cn(
                "flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-all duration-200 ease-smooth",
                "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "hover:border-ring/50 hover:shadow-sm hover:-translate-y-0.5",
                "focus-visible:translate-y-0 focus-visible:shadow-md",
                "transform-gpu",
                {
                  "border-destructive focus-visible:ring-destructive hover:border-destructive/70": error,
                  "border-soft-emerald-500 focus-visible:ring-soft-emerald-500 hover:border-soft-emerald-400": success,
                  "focus-visible:border-ring": !error && !success,
                },
                className
              )}
              ref={ref}
              {...props}
            />
            {icon && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200 group-hover:text-ring">
                {icon}
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive animate-in slide-in-from-top-1 duration-200 error-shake">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-soft-emerald-500 animate-in slide-in-from-top-1 duration-200 success-bounce">
              Input validated successfully
            </p>
          )}
        </div>
      )
    }

    return (
      <div className="relative group">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-all duration-200 ease-smooth",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "hover:border-ring/50 hover:shadow-sm hover:-translate-y-0.5",
            "focus-visible:translate-y-0 focus-visible:shadow-md",
            "transform-gpu",
            {
              "border-destructive focus-visible:ring-destructive hover:border-destructive/70": error,
              "border-soft-emerald-500 focus-visible:ring-soft-emerald-500 hover:border-soft-emerald-400": success,
              "focus-visible:border-ring": !error && !success,
            },
            className
          )}
          ref={ref}
          {...props}
        />
        {icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200 group-hover:text-ring">
            {icon}
          </div>
        )}
        {error && (
          <p className="mt-2 text-sm text-destructive animate-in slide-in-from-top-1 duration-200 error-shake">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
