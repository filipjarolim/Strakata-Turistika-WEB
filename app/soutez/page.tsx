import React from 'react';
import { currentRole, currentUser } from "@/lib/auth";
import GPSTracker from "@/components/pwa/GPSTracker";
import { Toaster } from "@/components/ui/sonner";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import Link from 'next/link';
import SoutezCardGrid from '@/components/soutez/SoutezCardGrid';

// Make page static with long revalidation for offline access
export const revalidate = 2592000; // 30 days in seconds

const actions = [
  {
    title: "GPS Trasovač",
    description: "Sledujte svou trasu v reálném čase",
    href: "/soutez/gps",
    image: "/icons/soutez/1.png"
  },
  {
    title: "Zapsat trasu",
    description: "Vytvořte trasu ručně",
    href: "/soutez/vytvorit",
    image: "/icons/soutez/2.png"
  },
  {
    title: "Nahrát trasu",
    description: "Nahrajte svou trasu z GPS zařízení",
    href: "/soutez/nahrat",
    image: "/icons/soutez/3.png"
  }
];

const Page = async () => {
  const user = await currentUser();
  const role = await currentRole();

  return (
    <CommonPageTemplate 
      contents={{header:true}} 
      headerMode='auto-hide'
      currentUser={user} 
      currentRole={role} 
    >
      <div className="h-[calc(100vh-4rem)] p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Soutěž</h1>
        <SoutezCardGrid actions={actions} />
      </div>
    </CommonPageTemplate>
  );
};

export default Page;
