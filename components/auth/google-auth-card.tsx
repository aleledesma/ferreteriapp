import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type GoogleAuthCardProps = {
  title: string
  description: string
  buttonLabel: string
  footerText: string
  footerLinkLabel: string
  footerLinkHref: string
  onSubmit: () => Promise<void>
}

export function GoogleAuthCard({
  title,
  description,
  buttonLabel,
  footerText,
  footerLinkLabel,
  footerLinkHref,
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
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <span>
          {footerText}{" "}
          <Link
            href={footerLinkHref}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {footerLinkLabel}
          </Link>
        </span>
      </CardFooter>
    </Card>
  )
}
