import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"
import type { LucideIcon } from 'lucide-react'

const Tabs = TabsPrimitive.Root

type TabsListVariant = 'default' | 'underline'

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: TabsListVariant
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = 'default', ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      variant === 'default'
        ? "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
        : "flex flex-wrap text-sm font-medium text-center text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: TabsListVariant
  icon?: LucideIcon
  badge?: string
  color?: string
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant = 'default', icon: Icon, badge, color, children, ...props }, ref) => {
  // Always call hooks unconditionally (Rules of Hooks)
  const internalRef = React.useRef<HTMLButtonElement>(null)
  const [isActive, setIsActive] = React.useState(false)

  React.useImperativeHandle(ref, () => internalRef.current!)

  React.useEffect(() => {
    // Only run effect logic for underline variant
    if (variant !== 'underline') return

    const button = internalRef.current
    if (!button) return

    const checkActive = () => {
      setIsActive(button.getAttribute('data-state') === 'active')
    }

    // Check initially
    checkActive()

    // Use MutationObserver to watch for attribute changes
    const observer = new MutationObserver(checkActive)
    observer.observe(button, { attributes: true, attributeFilter: ['data-state'] })

    return () => observer.disconnect()
  }, [variant])

  if (variant === 'underline') {
    return (
      <TabsPrimitive.Trigger
        ref={internalRef}
        className={cn(
          "inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group transition-colors me-2",
          "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300",
          className
        )}
        style={{
          color: isActive && color ? color : undefined,
          borderColor: isActive && color ? color : undefined
        }}
        {...props}
      >
        {Icon && (
          <Icon
            className={cn(
              "w-4 h-4 me-2",
              !isActive && "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300"
            )}
            style={isActive && color ? { color } : undefined}
          />
        )}
        {children}
        {badge && (
          <span
            className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full"
            style={{
              backgroundColor: color ? `${color}20` : 'rgba(139, 92, 246, 0.2)',
              color: color || '#8b5cf6'
            }}
          >
            {badge}
          </span>
        )}
      </TabsPrimitive.Trigger>
    )
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 me-2" />}
      {children}
      {badge && (
        <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
          {badge}
        </span>
      )}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
