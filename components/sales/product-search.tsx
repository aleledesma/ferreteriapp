"use client"

import { useState, useEffect, useRef } from "react"
import { Boxes, Loader2, Plus, Search } from "lucide-react"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// 1. CORRECCIÓN: Ampliamos el molde para que acepte los nombres reales que manda la Base de Datos (Prisma)
export type ProductSearchResult = {
  id: string
  name: string
  supplierProductCode?: string | null
  barcode?: string | null
  code?: string | null
  salePrice?: number | string
  price?: number
  stock: number
}

type ProductCatalogListItem = {
  id: string
  name: string
  supplierProductCode?: string | null
  barcode?: string | null
  pricing?: {
    salePrice?: number | string | null
  }
  inventory?: {
    stock?: number | null
  }
}

type ProductSearchProps = {
  onSelectProduct: (product: ProductSearchResult) => void
}

export function ProductSearch({ onSelectProduct }: ProductSearchProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [searchTerm, setSearchTerm] = useState("") // Texto que escribe el usuario
  const debouncedSearch = useDebouncedValue(searchTerm, 350) // Espera 350ms para no saturar el servidor
  const [results, setResults] = useState<ProductSearchResult[]>([]) // Resultados de la búsqueda
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
    async function searchProducts() {
      setIsSearching(true)

      try {
        const search = debouncedSearch.trim()
        const params = new URLSearchParams({
          pageSize: "10",
          saleStatus: "for_sale",
        })

        if (search.length > 0) {
          params.set("search", search)
        }

        const response = await fetch(`/api/products?${params.toString()}`)
        if (response.ok) {
          const payload = await response.json()

          const productosMapeados = (
            (payload.items || []) as ProductCatalogListItem[]
          ).map((item) => ({
            id: item.id,
            name: item.name,
            code: item.supplierProductCode || item.barcode || "N/A",
            price: Number(item.pricing?.salePrice || 0),
            stock: Number(item.inventory?.stock || 0),
          }))

          setResults(productosMapeados)
          setIsOpen((current) => current || search.length > 0)
        }
      } catch (error) {
        console.error("Error buscando productos", error)
      } finally {
        setIsSearching(false)
      }
    }

    void searchProducts()
  }, [debouncedSearch])

  function handleSelect(product: ProductSearchResult) {
    onSelectProduct(product) // Envía el producto al carrito principal
    setSearchTerm("") // Limpia el buscador
    setIsOpen(false) // Cierra el menú desplegable
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar por nombre, código de producto o código de barras..."
          className="h-13 rounded-xl border-border/70 bg-background pl-10 pr-10 text-base shadow-sm"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-border/60 bg-background p-1.5 shadow-2xl shadow-black/10">
          <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <Boxes className="size-3.5" />
            {searchTerm.trim() ? "Resultados" : "Productos disponibles"}
          </div>
          {results.map((product) => (
            <div
              key={product.id}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted"
              onClick={() => handleSelect(product)}
            >
              <div className="min-w-0 flex flex-col">
                <span className="truncate font-medium text-foreground">
                  {product.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Stock: {product.stock} | Código:{" "}
                  {product.supplierProductCode ||
                    product.barcode ||
                    product.code ||
                    "N/A"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-bold tabular-nums text-green-600">
                  $
                  {Number(
                    product.salePrice || product.price || 0,
                  ).toLocaleString("es-AR")}
                </span>
                <Button
                  size="icon"
                  variant="secondary"
                  className="pointer-events-none size-8 rounded-full"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && !isSearching && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-xl border border-border/60 bg-background p-4 text-center text-sm text-muted-foreground shadow-2xl shadow-black/10">
          {searchTerm.trim()
            ? `No se encontraron productos para "${searchTerm}"`
            : "No hay productos disponibles para vender."}
        </div>
      )}
    </div>
  )
}
