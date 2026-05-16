"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, UserPlus } from "lucide-react"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import type { CustomerListItem, CustomerListResult } from "@/lib/customers/types"

type CustomerSearchProps = {
  onSelectCustomer: (customer: CustomerListItem) => void
}

export function CustomerSearch({ onSelectCustomer }: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebouncedValue(searchTerm, 350)
  const [results, setResults] = useState<CustomerListItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function searchCustomers() {
      if (debouncedSearch.trim().length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsSearching(true)
      
      try {
        const searchParams = new URLSearchParams({
          page: "1",
          pageSize: "5",
          search: debouncedSearch.trim()
        })

        const response = await fetch(`/api/customers?${searchParams.toString()}`)
        
        if (response.ok) {
          const payload = (await response.json()) as CustomerListResult
          setResults(payload.items || [])
          setIsOpen(true)
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

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cliente (Ej: Juan)..."
          className="pl-9 bg-background h-10 text-sm"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-border/50 bg-background p-1 shadow-md">
          {results.map((customer) => (
            <div
              key={customer.id}
              className="flex items-center justify-between rounded-sm px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
              onClick={() => handleSelect(customer)}
            >
              <div className="flex flex-col">
                <span className="font-medium text-sm">{customer.lastName}, {customer.firstName}</span>
                <span className="text-xs text-muted-foreground">
                  {customer.email || customer.phone || "Sin contacto"}
                </span>
              </div>
              <Button size="icon" variant="secondary" className="size-6 rounded-full pointer-events-none">
                <UserPlus className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && !isSearching && debouncedSearch.length >= 2 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-border/50 bg-background p-3 text-center text-xs shadow-md text-muted-foreground">
          No registrado. Quedará como Consumidor Final.
        </div>
      )}
    </div>
  )
}