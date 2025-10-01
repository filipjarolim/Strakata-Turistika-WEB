'use client';

import React, { useState } from 'react';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Upload, Play, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import UploadStep from './steps/UploadStep';
import EditStep from './steps/EditStep';
import FinishStep from './steps/FinishStep';

type Step = 'home' | 'upload' | 'edit' | 'finish';

const Page = () => {
  const user = useCurrentUser();
  const role = useCurrentRole();
  const [currentStep, setCurrentStep] = useState<Step>('home');
  const [uploadedRouteId, setUploadedRouteId] = useState<string | null>(null);

  const handleStartUpload = () => {
    setCurrentStep('upload');
  };

  const handleBackToHome = () => {
    setCurrentStep('home');
    setUploadedRouteId(null);
  };

  const handleUploadComplete = (routeId: string) => {
    setUploadedRouteId(routeId);
    setCurrentStep('edit');
  };

  const handleEditComplete = () => {
    setCurrentStep('finish');
  };

  const handleFinishComplete = () => {
    // Navigate to results or home
    setCurrentStep('home');
    setUploadedRouteId(null);
  };

  return (
    <CommonPageTemplate 
      contents={{header: false, bugreport: false}} 
      currentUser={user} 
      currentRole={role}
      className="!px-0"
    >
      <div className="relative min-h-screen flex items-center p-6 lg:p-12">
        {/* Background Image - non-copyable */}
        <div className="absolute inset-0 w-full h-full -z-10 select-none pointer-events-none">
          <Image
            src="/images/soutezBackground.png"
            alt="Soutěž pozadí"
            fill
            className="object-cover select-none pointer-events-none"
            priority
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {currentStep === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 w-full max-w-[60%] space-y-6"
            >
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Soutěžte ve Strakaté Turistice</h1>
                <p className="text-lg text-white/90 drop-shadow-md">Vyberte si, jak chcete pokračovat</p>
              </div>

              <div className="space-y-6">
                {/* Nahrát trasu button */}
                <div 
                  onClick={handleStartUpload} 
                  className="block w-full text-left cursor-pointer"
                >
                  <div className="p-8 bg-black/60 backdrop-blur-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 border border-white/20 hover:border-white/40 hover:bg-black/70">
                    <div className="flex items-center gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
                          <Upload className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-2">Nahrát trasu</h2>
                        <p className="text-gray-300">Nahrajte svou GPS trasu a získejte body za své návštěvy</p>
                      </div>
                      <div className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                        Pokračovat
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 py-4">
                  <div className="flex-1 h-px bg-white/20"></div>
                  <span className="text-white/70 text-sm font-medium px-4">nebo vyzkoušejte naši aplikaci</span>
                  <div className="flex-1 h-px bg-white/20"></div>
                </div>

                {/* Google Play Badge */}
                <a 
                  href="https://play.google.com/store/apps/details?id=cz.strakata.turistika.strakataturistikaandroidapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Image 
                    src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                    alt="Get it on Google Play"
                    width={155}
                    height={60}
                    className="h-20 w-auto"
                  />
                </a>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 w-full max-w-[90%] space-y-6"
            >
              {/* Back button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToHome}
                className="text-white hover:bg-white/10 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět
              </Button>

              {/* Step content */}
              {currentStep === 'upload' && user && (
                <UploadStep onComplete={handleUploadComplete} user={user} />
              )}
              {currentStep === 'edit' && uploadedRouteId && user && (
                <EditStep routeId={uploadedRouteId} onComplete={handleEditComplete} user={user} />
              )}
              {currentStep === 'finish' && uploadedRouteId && user && (
                <FinishStep routeId={uploadedRouteId} onComplete={handleFinishComplete} user={user} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CommonPageTemplate>
  );
};

export default Page;