"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Search, UserCheck, UserPlus, Users } from "lucide-react"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import type { CustomerListItem, CustomerListResult } from "@/lib/customers/types"

type CustomerSearchProps = {
  onSelectCustomer: (customer: CustomerListItem) => void
  onCreateCustomer: () => void
  onUseFinalConsumer: () => void
}

export function CustomerSearch({ onSelectCustomer, onCreateCustomer, onUseFinalConsumer }: CustomerSearchProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebouncedValue(searchTerm, 350)
  const [results, setResults] = useState<CustomerListItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  useEffect(() => {
    async function searchCustomers() {
      setIsSearching(true)
       
      try {
        const search = debouncedSearch.trim()
        const searchParams = new URLSearchParams({
          page: "1",
          pageSize: "10",
          activeOnly: "true",
        })

        if (search.length > 0) {
          searchParams.set("search", search)
        }

        const response = await fetch(`/api/customers?${searchParams.toString()}`)
        
        if (response.ok) {
          const payload = (await response.json()) as CustomerListResult
          setResults(payload.items || [])
          setIsOpen((current) => current || search.length > 0)
        }
      } catch (error) {
        console.error("Error buscando clientes", error)
      } finally {
        setIsSearching(false)
      }
    }

    void searchCustomers()
  }, [debouncedSearch])

  function handleSelect(customer: CustomerListItem) {
    onSelectCustomer(customer)
    setSearchTerm("")
    setIsOpen(false)
  }

  function handleUseFinalConsumer() {
    onUseFinalConsumer()
    setSearchTerm("")
    setIsOpen(false)
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar cliente o elegir uno reciente..."
          className="h-11 rounded-xl bg-background pl-9 text-sm"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-border/60 bg-background p-1.5 shadow-2xl shadow-black/10">
          <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <Users className="size-3.5" />
            {searchTerm.trim() ? "Clientes encontrados" : "Clientes activos"}
          </div>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
            onClick={handleUseFinalConsumer}
          >
            <div className="min-w-0 flex flex-col">
              <span className="font-medium text-sm text-foreground">Consumidor Final</span>
              <span className="truncate text-xs text-muted-foreground">Emitir sin asociar cliente</span>
            </div>
            <UserCheck className="size-4 text-primary" />
          </button>
          {results.map((customer) => (
            <div
              key={customer.id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
              onClick={() => handleSelect(customer)}
            >
              <div className="min-w-0 flex flex-col">
                <span className="font-medium text-sm">{customer.lastName}, {customer.firstName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {customer.email || customer.phone || "Sin contacto"}
                </span>
              </div>
              <Button size="icon" variant="secondary" className="pointer-events-none size-6 rounded-full">
                <UserPlus className="size-3" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="ghost" className="mt-1 w-full justify-start rounded-lg text-primary" onClick={onCreateCustomer}>
            <UserPlus className="size-4" />
            Crear cliente nuevo
          </Button>
        </div>
      )}

      {isOpen && results.length === 0 && !isSearching && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-xl border border-border/60 bg-background p-3 text-center text-xs text-muted-foreground shadow-2xl shadow-black/10">
          <p>{searchTerm.trim() ? "No encontramos ese cliente." : "No hay clientes activos para mostrar."}</p>
          <Button type="button" variant="ghost" className="mt-2 h-8 w-full text-xs text-foreground" onClick={handleUseFinalConsumer}>
            <UserCheck className="size-3.5" />
            Usar Consumidor Final
          </Button>
          <Button type="button" variant="link" className="mt-1 h-auto p-0 text-xs" onClick={onCreateCustomer}>
            Crear cliente ahora
          </Button>
        </div>
      )}
    </div>
  )
}
