"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, Plus } from "lucide-react"
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
  const [searchTerm, setSearchTerm] = useState("") // Texto que escribe el usuario
  const debouncedSearch = useDebouncedValue(searchTerm, 350) // Espera 350ms para no saturar el servidor
  const [results, setResults] = useState<ProductSearchResult[]>([]) // Resultados de la búsqueda
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function searchProducts() {
      if (debouncedSearch.trim().length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsSearching(true)
      
try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(debouncedSearch)}&pageSize=10&saleStatus=for_sale`)
        if (response.ok) {
          const payload = await response.json()
          
          const productosMapeados = ((payload.items || []) as ProductCatalogListItem[]).map((item) => ({
            id: item.id,
            name: item.name,
            code: item.supplierProductCode || item.barcode || "N/A",
            price: Number(item.pricing?.salePrice || 0), 
            stock: Number(item.inventory?.stock || 0)    
          }))

          setResults(productosMapeados)
          setIsOpen(true)
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
    setSearchTerm("")// Limpia el buscador
    setIsOpen(false) // Cierra el menú desplegable
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Escanear código o buscar producto (Ej: Clavos)..."
          className="pl-9 bg-background h-12 text-lg"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-border/50 bg-background p-1 shadow-md">
          {results.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-sm px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
              onClick={() => handleSelect(product)}
            >
              <div className="flex flex-col">
                <span className="font-medium">{product.name}</span>
                <span className="text-xs text-muted-foreground">
                  {/* 2. CORRECCIÓN: Mostramos el código y stock real */}
                  Stock: {product.stock} | Código: {product.supplierProductCode || product.barcode || product.code || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-green-600">
                  {/* 3. CORRECCIÓN: Mostramos el precio de venta real de Prisma */}
                  ${Number(product.salePrice || product.price || 0).toLocaleString("es-AR")}
                </span>
                <Button size="icon" variant="secondary" className="size-8 rounded-full pointer-events-none">
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && !isSearching && debouncedSearch.length >= 2 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-border/50 bg-background p-4 text-center text-sm shadow-md text-muted-foreground">
          No se encontraron productos para &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  )
}
