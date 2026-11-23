import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface SearchableMultiSelectProps {
  options: { label: string; value: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  className,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  )

  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => value.includes(o.value))

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])

  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      const drop = new Set(filtered.map((o) => o.value))
      onChange(value.filter((v) => !drop.has(v)))
    } else {
      onChange([...new Set([...value, ...filtered.map((o) => o.value)])])
    }
  }

  const label =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? options.find((o) => o.value === value[0])?.label
        : `${value.length} selected`

  return (
    <Popover open={open} onOpenChange={(o) => { if (!disabled) { setOpen(o); if (!o) setSearch("") } }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", value.length === 0 && "text-muted-foreground", className)}
        >
          <span className="min-w-0 flex-1 truncate text-left">{label}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* stopPropagation: a parent Dialog locks wheel/touch scrolling outside its own content */}
        <div
          className="max-h-[260px] overflow-y-auto p-1"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-sm">No option found.</div>
          ) : (
            <>
              <div
                className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                onClick={toggleAllFiltered}
              >
                <Check className={cn("mr-2 h-4 w-4", allFilteredSelected ? "opacity-100" : "opacity-0")} />
                {search ? "Select all results" : "Select all"}
              </div>
              {filtered.map((o) => {
                const selected = value.includes(o.value)
                return (
                  <div
                    key={o.value}
                    className={cn(
                      "flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                      selected && "bg-accent/50",
                    )}
                    onClick={() => toggle(o.value)}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                    {o.label}
                  </div>
                )
              })}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
