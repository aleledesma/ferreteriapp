"use client"

import type { ReactNode } from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type ProductHoverHintProps = {
  content: ReactNode
  children: ReactNode
}

export function ProductHoverHint({ content, children }: ProductHoverHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        {content}
      </TooltipContent>
    </Tooltip>
  )
}
