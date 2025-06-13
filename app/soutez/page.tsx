import React from 'react';
import { currentRole, currentUser } from "@/lib/auth";
import GPSTracker from "@/components/pwa/GPSTracker";
import { Toaster } from "@/components/ui/sonner";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import Link from 'next/link';
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DirectoryImage from "@/assets/img/directory.png";

// Make page static with long revalidation for offline access
export const revalidate = 2592000; // 30 days in seconds

const Page = async () => {
  const user = await currentUser();
  const role = await currentRole();

  return (
    <CommonPageTemplate contents={{header:true}} currentUser={user} currentRole={role} className="p-0 w-full overflow-hidden h-screen" style={
      {
        backgroundColor: 'white',
        backgroundImage: `url(${DirectoryImage.src})`,
        backgroundPosition: 'center ;0%', // This will move the image up, showing more of the top
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      }
    }>
      <div className="min-h-screen w-full relative pt-8">
        <Card className="m-4 flex flex-row items-center justify-center w-full p-8 bg-transparent border-none shadow-none" style={
          {
            zIndex: 20,
          }
        }>
          <CardContent className='flex flex-row items-center justify-center w-full gap-4 bg-transparent'>
            <Button asChild variant="outline">
              <Link href="/soutez/gps">GPS Trasovač</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/soutez/nahrat">Nahrát trasu</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/soutez/vytvorit">Zapsat trasu </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </CommonPageTemplate>
  );
};

export default Page;
