"use client"

import Barcode from "react-barcode"

type ProductBarcodeCardProps = {
  value: string
}

export function ProductBarcodeCard({ value }: ProductBarcodeCardProps) {
  return (
    <div className="inline-flex w-fit flex-col items-center gap-2 rounded-xl border border-border/60 bg-white px-3 py-3 shadow-sm">
      <Barcode
        value={value}
        format="CODE128"
        displayValue={false}
        background="transparent"
        lineColor="#0f172a"
        height={42}
        margin={0}
        width={1.4}
      />
      <span className="font-mono text-[11px] tracking-[0.12em] text-slate-700">
        {value}
      </span>
    </div>
  )
}
