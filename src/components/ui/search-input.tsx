import * as React from "react"
import { cn } from "@/lib/utils"

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "flex h-10 w-full rounded-full border border-foreground/10 bg-foreground/5 dark:bg-foreground/5 backdrop-blur-md px-4 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground placeholder:opacity-70",
            icon && "pl-11",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }