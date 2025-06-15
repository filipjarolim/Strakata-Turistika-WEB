"use client";
import React from 'react';
import Link from 'next/link';
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";
import Image from 'next/image';

interface Action {
  title: string;
  description: string;
  href: string;
  image: string;
}

const SoutezCardGrid = ({ actions }: { actions: Action[] }) => (
  <div className="grid grid-cols-3 gap-6 h-[calc(100%-4rem)]">
    {actions.map((action) => (
      <Link key={action.href} href={action.href} className="block h-full">
        <IOSCard className="h-full flex flex-col">
          <div className="flex flex-col items-center justify-center flex-1 pt-8 pb-4">
            <div className="flex items-center justify-center w-56 h-56 mb-6">
              <Image
                src={action.image}
                alt={action.title}
                width={224}
                height={224}
                className="object-contain"
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              {action.title}
            </h2>
            <p className="text-gray-600 mb-4 text-center">
              {action.description}
            </p>
            <IOSButton className="w-full mt-auto">
              Pokračovat
            </IOSButton>
          </div>
        </IOSCard>
      </Link>
    ))}
  </div>
);

export default SoutezCardGrid; 