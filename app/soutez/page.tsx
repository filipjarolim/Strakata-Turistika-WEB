'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft, LogIn, UserPlus, Map, Trophy, Camera, Smartphone, Globe, Zap, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import UploadStep from './steps/UploadStep';
import EditStep from './steps/EditStep';
import FinishStep from './steps/FinishStep';
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";

type Step = 'home' | 'upload' | 'gps' | 'edit' | 'finish';

const Page = () => {
  const user = useCurrentUser();
  const role = useCurrentRole();
  const [currentStep, setCurrentStep] = useState<Step>('home');
  const [uploadedRouteId, setUploadedRouteId] = useState<string | null>(null);
  const [initialUploadMode, setInitialUploadMode] = useState<'gpx' | 'manual' | 'gps' | null>(null);
  const [autoTest, setAutoTest] = useState(false);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleStartUpload = (mode?: 'gpx' | 'manual', isAutoTest: boolean = false) => {
    if (mode) setInitialUploadMode(mode);
    else setInitialUploadMode(null);
    setAutoTest(isAutoTest);
    setCurrentStep('upload');
  };

  const handleBackToHome = () => {
    setCurrentStep('home');
    setUploadedRouteId(null);
    setInitialUploadMode(null);
  };

  const handleBackStep = () => {
    if (currentStep === 'finish') {
      setCurrentStep('edit');
    } else if (currentStep === 'edit') {
      setCurrentStep('upload');
    } else if (currentStep === 'upload') {
      setCurrentStep('home');
      setUploadedRouteId(null);
      setInitialUploadMode(null);
      setAutoTest(false);
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
    setInitialUploadMode(null);
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
              <span className="text-white font-medium text-sm">Zpět na hlavní stránku</span>
            </div>
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 min-h-screen flex flex-col justify-start sm:justify-center px-4 sm:px-8 lg:px-16 py-24 sm:py-20 lg:items-start overflow-y-auto sm:overflow-visible">
          <AnimatePresence mode="wait">
            {currentStep === 'home' ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -50, filter: "blur(10px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full space-y-12"
              >
                {/* Hero Text */}
                <div className="space-y-6 max-w-2xl">


                  <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight drop-shadow-2xl tracking-tight">
                    Vaše cesta,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                      Váš příběh.
                    </span>
                  </h1>

                  <p className="text-lg sm:text-xl text-gray-200 max-w-lg leading-relaxed font-light drop-shadow-md">
                    Nahrajte své zážitky, sbírejte body a soutěžte s ostatními strakáči. Každý krok se počítá.
                  </p>
                </div>

                {/* Content Grid - optimized for spacing */}
                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-12 items-stretch w-full max-w-[95%] mx-auto">
                  {/* Authentication / Action Block */}
                  <div className="relative h-full">
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
                              onClick={() => handleStartUpload()}
                              className="w-full h-14 text-lg font-semibold bg-white text-black hover:bg-gray-100 border-none shadow-lg shadow-white/10"
                            >
                              Začít nahrávat
                            </IOSButton>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div
                                onClick={() => handleStartUpload('gpx')}
                                className="bg-white/5 rounded-xl p-4 border border-white/10 text-center cursor-pointer hover:bg-white/10 transition-colors"
                              >
                                <Map className="h-6 w-6 text-green-400 mx-auto mb-2" />
                                <span className="text-xs text-gray-300 font-medium uppercase tracking-wide">GPX Záznam</span>
                              </div>
                              <div
                                onClick={() => handleStartUpload('manual')}
                                className="bg-white/5 rounded-xl p-4 border border-white/10 text-center cursor-pointer hover:bg-white/10 transition-colors"
                              >
                                <Camera className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                                <span className="text-xs text-gray-300 font-medium uppercase tracking-wide">Screenshot aktivity</span>
                              </div>
                            </div>

                            {role === 'ADMIN' && (
                              <div className="pt-6 mt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                                <button
                                  onClick={() => handleStartUpload('gpx', true)}
                                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors uppercase font-semibold tracking-wider hover:underline py-2"
                                >
                                  [ADMIN] Test GPX
                                </button>
                                <button
                                  onClick={() => handleStartUpload('manual', true)}
                                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors uppercase font-semibold tracking-wider hover:underline py-2"
                                >
                                  [ADMIN] Test Foto
                                </button>
                              </div>
                            )}
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

                  {/* Mobile App Promo Section */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-900/40 via-black/40 to-purple-900/40 backdrop-blur-md p-8 sm:p-10 h-full flex flex-col justify-center"
                  >
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10 grid gap-8 md:grid-cols-2 items-center">
                      <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                          <Smartphone className="w-4 h-4 text-white" />
                          <span className="text-xs font-semibold text-white uppercase tracking-wider">Mobilní aplikace</span>
                        </div>

                        <h3 className="text-3xl font-bold text-white leading-tight">
                          Strakatá turistika<br />
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            přímo ve vaší kapse
                          </span>
                        </h3>

                        <p className="text-gray-300 leading-relaxed">
                          Nahrávejte trasy přímo pomocí GPS v telefonu, sledujte statistiky v reálném čase a mějte přehled o všech kontrolních bodech. Funguje i offline!
                        </p>

                        <div className="flex flex-wrap gap-4 pt-2">
                          <Link href="https://apps.apple.com" target="_blank" className="transition-transform hover:scale-105">
                            <div className="flex items-center gap-3 bg-black/50 hover:bg-black/70 border border-white/10 px-6 py-3 rounded-xl transition-all">
                              <div className="w-8 h-8 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74s2.57-.99 3.87-.74c.76.15 1.74.52 2.36 1.1-2.9 1.76-2.34 5.76.51 6.84-.52 1.62-1.25 3.23-1.82 5.03zm-2.22-14.73c.71-.86.99-2.04.86-3.28-1.25.13-2.52 1.05-3 2.1-.53 1.15-.05 2.19.85 3.19.08-1.24 1.25-2.01 1.29-2.01z" /></svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 leading-none">Stáhnout na</span>
                                <span className="text-sm font-bold text-white">App Store</span>
                              </div>
                            </div>
                          </Link>

                          <Link href="https://play.google.com" target="_blank" className="transition-transform hover:scale-105">
                            <div className="flex items-center gap-3 bg-black/50 hover:bg-black/70 border border-white/10 px-6 py-3 rounded-xl transition-all">
                              <div className="w-8 h-8 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M3,20.5V3.5C3,2.91,3.34,2.39,3.84,2.15L13.69,12L3.84,21.85C3.34,21.6,3,21.09,3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.3,12.5L17.38,15.69L15.13,12L17.38,8.31L20.3,11.5C20.58,11.77,20.58,12.23,20.3,12.5M16.81,8.88L14.54,11.15L6.05,2.66L16.81,8.88M4.77,2.38L13.26,10.87L3.42,3.38L4.77,2.38Z" /></svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 leading-none">NYNÍ NA</span>
                                <span className="text-sm font-bold text-white">Google Play</span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>

                      <div className="relative hidden md:block">
                        <div className="relative z-10 grid grid-cols-2 gap-4">
                          <div className="space-y-4 pt-8">
                            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                              <div className="p-2 bg-blue-500/20 rounded-xl w-fit mb-3"><Navigation className="w-5 h-5 text-blue-400" /></div>
                              <h4 className="text-white font-bold text-sm">GPS Tracking</h4>
                              <p className="text-xs text-gray-400 mt-1">Přesný záznam trasy i bez signálu</p>
                            </div>
                            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                              <div className="p-2 bg-green-500/20 rounded-xl w-fit mb-3"><Map className="w-5 h-5 text-green-400" /></div>
                              <h4 className="text-white font-bold text-sm">Offline mapy</h4>
                              <p className="text-xs text-gray-400 mt-1">Celá ČR vždy po ruce</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                              <div className="p-2 bg-purple-500/20 rounded-xl w-fit mb-3"><Zap className="w-5 h-5 text-purple-400" /></div>
                              <h4 className="text-white font-bold text-sm">Rychlý upload</h4>
                              <p className="text-xs text-gray-400 mt-1">Nahrání aktivity na jedno kliknutí</p>
                            </div>
                            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                              <div className="p-2 bg-yellow-500/20 rounded-xl w-fit mb-3"><Trophy className="w-5 h-5 text-yellow-400" /></div>
                              <h4 className="text-white font-bold text-sm">Statistiky</h4>
                              <p className="text-xs text-gray-400 mt-1">Porovnání s ostatními</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
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
                    <UploadStep onComplete={handleUploadComplete} user={user} userRole={role} initialMode={initialUploadMode} autoTest={autoTest} />
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