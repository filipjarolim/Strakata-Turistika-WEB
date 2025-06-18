import Image from 'next/image'
import Link from 'next/link'
import { IOSButton } from '@/components/ui/ios/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-6">
        <Image
          src="/img/404.png"
          alt="Stránka nenalezena"
          width={400}
          height={400}
          className="mx-auto"
        />
        <h1 className="text-4xl font-bold text-foreground">Stránka nenalezena</h1>
        <p className="text-muted-foreground">
          Omlouváme se, ale požadovanou stránku jsme nemohli najít.
        </p>
        <Link href="/" className="flex justify-center">
          <IOSButton variant="default" size="md">
            Zpět na hlavní stránku
          </IOSButton>
        </Link>
      </div>
    </div>
  )
} 