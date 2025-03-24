import React from 'react';
import Header from "@/components/structure/Header";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { currentRole, currentUser } from "@/lib/auth";
import GPSTracker from "@/components/pwa/GPSTracker";
import { Toaster } from "@/components/ui/sonner";
import { MapPin } from 'lucide-react';
import ShareButton from "@/components/pwa/ShareButton";

const Page = async () => {
  const user = await currentUser();
  const role = await currentRole();

  return (
    <CommonPageTemplate contents={{ header: true }} currentUser={user} currentRole={role}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <div className="md:flex md:items-center md:justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <MapPin className="text-green-600 h-6 w-6" /> GPS Trail Tracker
            </h1>
            <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
              Track your hiking or walking routes with high precision GPS tracking.
            </p>
          </div>
          
          <div className="mt-3 md:mt-0 flex gap-2">
            {/* Desktop share button */}
            <ShareButton variant="desktop" />
            
            {/* Mobile share button */}
            <ShareButton variant="mobile" />
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-gray-100 mb-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">Tips for Better Tracking</h2>
          <ul className="text-sm text-gray-600 space-y-1 pl-4 list-disc">
            <li>Keep your device with a clear view of the sky for best GPS signal</li>
            <li>Allow location permissions when prompted</li>
            <li>Battery saver mode may affect location accuracy</li>
            <li>Your tracks can be saved and shared when completed</li>
          </ul>
        </div>
        
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg">
          <GPSTracker username={user?.name || "Unknown hiker"} />
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>All location data is processed locally on your device for privacy.</p>
        </div>
        
        <Toaster position="bottom-center" richColors closeButton />
      </div>
    </CommonPageTemplate>
  );
};

export default Page;
