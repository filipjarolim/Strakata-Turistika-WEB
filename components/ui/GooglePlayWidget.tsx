"use client";
import React from 'react';
import Image from 'next/image';
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";

interface GooglePlayWidgetProps {
  appName: string;
  packageName: string;
  developerName: string;
  appIcon: string;
  description?: string;
  className?: string;
}

const GooglePlayWidget: React.FC<GooglePlayWidgetProps> = ({
  appName,
  packageName,
  developerName,
  appIcon,
  description = "Stáhněte si naši mobilní aplikaci",
  className = ""
}) => {
  const playStoreUrl = `https://play.google.com/store/apps/details?id=${packageName}`;

  return (
    <IOSCard className={`p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        {/* App Icon */}
        <div className="flex-shrink-0">
          <Image
            src={appIcon}
            alt={`${appName} ikona`}
            width={64}
            height={64}
            className="rounded-xl"
          />
        </div>
        
        {/* App Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {appName}
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            {description}
          </p>
          
          {/* Google Play Button */}
          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <IOSButton className="bg-green-600 hover:bg-green-700 text-white">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <span>Stáhnout z Google Play</span>
              </div>
            </IOSButton>
          </a>
        </div>
      </div>
    </IOSCard>
  );
};

export default GooglePlayWidget;
