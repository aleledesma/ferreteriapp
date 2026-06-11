import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type GoogleAuthCardProps = {
  title: string
  description: string
  buttonLabel: string
  onSubmit: () => Promise<void>
}

export function GoogleAuthCard({
  title,
  description,
  buttonLabel,
  onSubmit,
}: GoogleAuthCardProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={onSubmit}>
          <Button className="w-full" type="submit">
            {buttonLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
