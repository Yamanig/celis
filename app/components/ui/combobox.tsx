"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  value = "",
  onValueChange,
  options,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  className,
  disabled,
}: ComboboxProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = options.find((option) => option.value === value);
  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(term)
    );
  }, [options, query]);

  React.useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const selectOption = (next: string) => {
    onValueChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="h-11 w-full justify-between bg-celis-surface-inset px-3 font-normal"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={cn("truncate", !selected && "text-celis-ink-tertiary")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-celis-border bg-celis-surface-elevated text-celis-ink shadow-md">
          <div className="relative border-b border-celis-border p-2">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-celis-ink-tertiary" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
                if (event.key === "Enter" && filtered[0]) {
                  event.preventDefault();
                  selectOption(filtered[0].value);
                }
              }}
              placeholder={searchPlaceholder}
              className="h-9 bg-celis-surface-base pl-9"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-1" role="listbox">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-celis-ink-secondary">
                {emptyMessage}
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none transition hover:bg-celis-primary-subtle focus:bg-celis-primary-subtle",
                    option.value === value && "font-medium"
                  )}
                  onClick={() => selectOption(option.value)}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      option.value === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
