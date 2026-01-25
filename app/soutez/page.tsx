'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft, LogIn, UserPlus, Map, Trophy, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import UploadStep from './steps/UploadStep';
import EditStep from './steps/EditStep';
import FinishStep from './steps/FinishStep';
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";

type Step = 'home' | 'upload' | 'edit' | 'finish';

const Page = () => {
  const user = useCurrentUser();
  const role = useCurrentRole();
  const [currentStep, setCurrentStep] = useState<Step>('home');
  const [uploadedRouteId, setUploadedRouteId] = useState<string | null>(null);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleStartUpload = () => {
    setCurrentStep('upload');
  };

  const handleBackToHome = () => {
    setCurrentStep('home');
    setUploadedRouteId(null);
  };

  const handleBackStep = () => {
    if (currentStep === 'finish') {
      setCurrentStep('edit');
    } else if (currentStep === 'edit') {
      setCurrentStep('upload');
    } else if (currentStep === 'upload') {
      setCurrentStep('home');
      setUploadedRouteId(null);
    }
  };

  const handleUploadComplete = (routeId: string) => {
    setUploadedRouteId(routeId);
    setCurrentStep('edit');
  };

  const handleEditComplete = () => {
    setCurrentStep('finish');
  };

  const handleFinishComplete = () => {
    setCurrentStep('home');
    setUploadedRouteId(null);
  };

  return (
    <CommonPageTemplate
      contents={{ header: false, bugreport: false }}
      currentUser={user}
      currentRole={role}
      className="!px-0"
    >
      <div className="relative min-h-screen">
        {/* Modern Background with Overlay */}
        <div className="fixed inset-0 w-full h-full -z-10">
          <Image
            src="/images/soutezBackground_new.png"
            alt="Soutěž pozadí"
            fill
            className="object-cover select-none pointer-events-none"
            priority
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent/20 sm:from-black/85 sm:via-black/60" />
        </div>

        {/* Floating Navigation */}
        <div className="absolute top-6 left-6 z-20">
          <Link href="/">
            <div className="flex items-center gap-2 group cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full transition-all duration-300 border border-white/10">
              <div className="p-1 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                <ArrowLeft className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-medium text-sm">Zpět na hlavní</span>
            </div>
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 min-h-screen flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-20 lg:items-start">
          <AnimatePresence mode="wait">
            {currentStep === 'home' ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -50, filter: "blur(10px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-2xl space-y-12"
              >
                {/* Hero Text */}
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 backdrop-blur-sm"
                  >
                    <Trophy className="w-4 h-4 text-blue-300" />
                    <span className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Soutěžní portál</span>
                  </motion.div>

                  <h1 className="text-5xl sm:text-7xl font-black text-white leading-tight drop-shadow-2xl tracking-tight">
                    Vaše cesta,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                      Váš příběh.
                    </span>
                  </h1>

                  <p className="text-lg sm:text-xl text-gray-200 max-w-lg leading-relaxed font-light drop-shadow-md">
                    Nahrajte své zážitky, sbírejte body a soutěžte s ostatními strakáči. Každý krok se počítá.
                  </p>
                </div>

                {/* Authentication / Action Block */}
                <div className="relative">
                  {/* Decorative Elements */}
                  <div className="absolute -left-8 -top-8 w-24 h-24 bg-blue-500/30 rounded-full blur-2xl animate-pulse" />
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />

                  <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-1 overflow-hidden">
                    <div className="bg-black/40 rounded-[1.3rem] p-6 sm:p-8 space-y-6">
                      {user ? (
                        <>
                          <div className="flex items-center gap-6">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/20">
                              <Upload className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-white">Nahrát novou trasu</h3>
                              <p className="text-gray-300 text-sm mt-1">Máte novou fotku nebo GPX soubor?</p>
                            </div>
                          </div>

                          <IOSButton
                            variant="primary"
                            size="lg"
                            onClick={handleStartUpload}
                            className="w-full h-14 text-lg font-semibold bg-white text-black hover:bg-gray-100 border-none shadow-lg shadow-white/10"
                          >
                            Začít nahrávat
                          </IOSButton>

                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                              <Map className="h-6 w-6 text-green-400 mx-auto mb-2" />
                              <span className="text-xs text-gray-300 font-medium uppercase tracking-wide">GPX Záznam</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                              <Camera className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                              <span className="text-xs text-gray-300 font-medium uppercase tracking-wide">Fotka z místa</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-6">
                          <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white">Přidejte se k nám</h3>
                            <p className="text-gray-300 text-sm max-w-sm mx-auto">Pro účast v soutěži a nahrávání tras je potřeba se přihlásit.</p>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/auth/login" className="flex-1">
                              <IOSButton variant="primary" className="w-full h-12 bg-blue-600 border-blue-500 hover:bg-blue-500 text-white">
                                <LogIn className="w-4 h-4 mr-2" />
                                Přihlásit
                              </IOSButton>
                            </Link>
                            <Link href="/auth/register" className="flex-1">
                              <IOSButton variant="outline" className="w-full h-12 border-white/30 text-white hover:bg-white/10">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Registrovat
                              </IOSButton>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step-content"
                initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 50, filter: "blur(10px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-5xl mx-auto"
              >
                {/* Step Header Navigation */}
                <div className="flex items-center gap-4 mb-8">
                  <button
                    onClick={handleBackStep}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all text-white"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    {currentStep === 'upload' && <h2 className="text-2xl font-bold text-white">Nahrávání trasy</h2>}
                    {currentStep === 'edit' && <h2 className="text-2xl font-bold text-white">Úprava a Detaily</h2>}
                    {currentStep === 'finish' && <h2 className="text-2xl font-bold text-white">Hotovo!</h2>}
                  </div>
                </div>

                {/* Step Content Container */}
                <div className="bg-black/20 backdrop-blur-md rounded-[2rem] p-6 sm:p-10 shadow-2xl min-h-[500px] border border-white/5">
                  {currentStep === 'upload' && user && (
                    <UploadStep onComplete={handleUploadComplete} user={user} />
                  )}
                  {currentStep === 'edit' && uploadedRouteId && user && (
                    <EditStep routeId={uploadedRouteId} onComplete={handleEditComplete} user={user} />
                  )}
                  {currentStep === 'finish' && uploadedRouteId && user && (
                    <FinishStep routeId={uploadedRouteId} onComplete={handleFinishComplete} user={user} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </CommonPageTemplate>
  );
};

export default Page;