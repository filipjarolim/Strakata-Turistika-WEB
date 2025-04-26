import React from 'react';
import { currentRole, currentUser } from "@/lib/auth";
import GPSTracker from "@/components/pwa/GPSTracker";
import { Toaster } from "@/components/ui/sonner";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";

// Make page static with long revalidation for offline access
export const revalidate = 2592000; // 30 days in seconds

const Page = async () => {
  const user = await currentUser();
  const role = await currentRole();

  return (
    <CommonPageTemplate contents={{}} currentUser={user} currentRole={role} className="p-0">
      <GPSTracker username={user?.name || "Unknown hiker"} />
    </CommonPageTemplate>
  );
};

export default Page;
