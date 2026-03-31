import { AnimatedCard } from "@/components/ui/animated-card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  iconColor?: string
  className?: string
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
}

export function StatCard({ title, value, description, icon: Icon, iconColor, trend, className }: StatCardProps) {
  return (
    <AnimatedCard containerClassName={className} className="flex flex-col p-6">
      <div className="flex flex-row items-center justify-between pb-2 flex-shrink-0 text-foreground">
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        {Icon && <Icon className={`h-4 w-4 ${iconColor || 'text-muted-foreground'}`} />}
      </div>
      <div className="flex-1 flex flex-col justify-center text-foreground">
        <div className="text-4xl md:text-5xl font-bold mb-2 tracking-tighter drop-shadow-sm dark:drop-shadow-[0_2px_12px_rgba(255,255,255,0.15)]">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
        )}
        {trend && (
          <div className="mt-auto flex items-center text-xs">
            <span
              className={
                trend.positive !== false
                  ? "text-green-400 font-medium"
                  : "text-red-400 font-medium"
              }
            >
              {trend.positive !== false ? "+" : "-"}
              {trend.value}%
            </span>
            <span className="ml-1 text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </div>
    </AnimatedCard>
  )
}