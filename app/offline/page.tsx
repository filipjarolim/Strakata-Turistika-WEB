import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export const metadata = {
  title: 'Offline | Strakatá turistika',
  description: 'You are currently offline',
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">You are offline</CardTitle>
          <CardDescription>
            Unable to connect to the internet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <p className="text-center text-muted-foreground">
              The page you requested requires an internet connection. Some content has been cached for offline use, but this page wasn&apos;t available.
            </p>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 mt-4">
              <Button asChild variant="outline">
                <Link href="/">Go to Homepage</Link>
              </Button>
              <Button>
                <Link href="javascript:window.location.reload()">
                  Try Again
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
