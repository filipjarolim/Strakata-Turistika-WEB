'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import Image from 'next/image';
import { Upload, ArrowLeft, LogIn, UserPlus, Map, Trophy, Smartphone, Globe, Zap, Navigation, Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import UploadStep from './steps/UploadStep';
import EditStep from './steps/EditStep';
import FinishStep from './steps/FinishStep';
import CompetitionBackground from "@/components/ui/competition/CompetitionBackground";

type Step = 'home' | 'upload' | 'gps' | 'edit' | 'finish';

const Page = () => {
  const user = useCurrentUser();
  const role = useCurrentRole();
  const [currentStep, setCurrentStep] = useState<Step>('home');
  const [uploadedRouteId, setUploadedRouteId] = useState<string | null>(null);
  const [initialUploadMode, setInitialUploadMode] = useState<'gpx' | 'manual' | 'gps' | null>(null);
  const [autoTest, setAutoTest] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('PEAK');

  useEffect(() => {
    // Check for Strakatá route creation
    const strataRouteData = sessionStorage.getItem('strataRoute');
    if (strataRouteData) {
      try {
        const route = JSON.parse(strataRouteData);
        // Clean up
        sessionStorage.removeItem('strataRoute');
        // Logic to pre-fill would go here, for now just cleaning up
      } catch (e) {
        console.error('Failed to parse strata route data', e);
      }
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleStartUpload = (mode?: 'gpx' | 'manual', isAutoTest: boolean = false) => {
    if (mode) setInitialUploadMode(mode);
    else setInitialUploadMode(null);
    setAutoTest(isAutoTest);
    setCurrentStep('upload');
  };

  const handleBackStep = () => {
    if (currentStep === 'finish') setCurrentStep('edit');
    else if (currentStep === 'edit') setCurrentStep('upload');
    else if (currentStep === 'upload') {
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

  const handleEditComplete = () => setCurrentStep('finish');
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
        <CompetitionBackground />

        <div className="absolute top-6 left-6 z-20">
          <Link href="/">
            <div className="flex items-center gap-2 group cursor-pointer bg-white/80 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full transition-all duration-300 border border-slate-200 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
              <div className="p-1 rounded-full bg-slate-100 dark:bg-white/10 group-hover:bg-slate-200 dark:group-hover:bg-white/20 transition-colors">
                <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-white/70 group-hover:text-slate-900 dark:group-hover:text-white" />
              </div>
              <span className="text-slate-600 dark:text-white/70 group-hover:text-slate-900 dark:group-hover:text-white text-sm font-medium">Zpět domů</span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col justify-start sm:justify-center px-4 sm:px-8 lg:px-16 py-24 sm:py-20 lg:items-start overflow-y-auto sm:overflow-visible">
          <AnimatePresence mode="wait">
            {currentStep === 'home' ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full space-y-12"
              >
                <div className="space-y-4 max-w-2xl">
                  <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Vaše cesta.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-400 dark:from-slate-200 dark:to-slate-500">
                      Váš příběh.
                    </span>
                  </h1>
                  <p className="text-lg text-slate-600 dark:text-white/70 max-w-lg leading-relaxed">
                    Zaznamenávejte své kroky, sbírejte body a budujte svou legendu.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  {user ? (
                    <>
                      <motion.div
                        whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.08)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStartUpload()}
                        className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 cursor-pointer transition-colors group flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-md"
                      >
                        <div className="space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-colors">
                            <Upload className="h-5 w-5 text-slate-600 dark:text-white/70 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nahrát trasu</h3>
                            <p className="text-slate-500 dark:text-white/60 text-xs mt-1">Zaznamenejte nový výkon</p>
                          </div>
                        </div>
                        <div className="flex justify-end"><Zap className="w-4 h-4 text-slate-300 dark:text-white/20 group-hover:text-blue-500/50" /></div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.08)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStartUpload('gpx')}
                        className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 cursor-pointer transition-colors group flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-md"
                      >
                        <div className="space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20 transition-colors">
                            <Map className="h-5 w-5 text-slate-600 dark:text-white/70 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Import GPX</h3>
                            <p className="text-slate-500 dark:text-white/60 text-xs mt-1">Nahrát soubor ze zařízení</p>
                          </div>
                        </div>
                        <div className="flex justify-end"><Globe className="w-4 h-4 text-slate-300 dark:text-white/20 group-hover:text-emerald-500/50" /></div>
                      </motion.div>

                      <Link href="/soutez/strakata-trasa" className="block h-full">
                        <motion.div
                          whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.08)' }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 cursor-pointer transition-colors group flex flex-col justify-between min-h-[160px] h-full shadow-sm hover:shadow-md"
                        >
                          <div className="space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-purple-500/10 dark:group-hover:bg-purple-500/20 transition-colors">
                              <Trophy className="h-5 w-5 text-slate-600 dark:text-white/70 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Strakatá trasa</h3>
                              <p className="text-slate-500 dark:text-white/60 text-xs mt-1">Měsíční výzvy a úkoly</p>
                            </div>
                          </div>
                          <div className="flex justify-end"><Sparkles className="w-4 h-4 text-slate-300 dark:text-white/20 group-hover:text-purple-500/50" /></div>
                        </motion.div>
                      </Link>

                      <Link href="/soutez/volna-kategorie" className="block h-full">
                        <motion.div
                          whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.08)' }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 cursor-pointer transition-colors group flex flex-col justify-between min-h-[160px] h-full shadow-sm hover:shadow-md"
                        >
                          <div className="space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-amber-500/10 dark:group-hover:bg-amber-500/20 transition-colors">
                              <Star className="h-5 w-5 text-slate-600 dark:text-white/70 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Volná kategorie</h3>
                              <p className="text-slate-500 dark:text-white/60 text-xs mt-1">Týdenní bonusové body</p>
                            </div>
                          </div>
                          <div className="flex justify-end"><Navigation className="w-4 h-4 text-slate-300 dark:text-white/20 group-hover:text-amber-500/50" /></div>
                        </motion.div>
                      </Link>
                    </>
                  ) : (
                    <div className="col-span-full bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 text-center space-y-8 shadow-sm">
                      <div className="space-y-3">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Přidejte se k nám</h3>
                        <p className="text-slate-600 dark:text-white/60 max-w-sm mx-auto">Pro účast v soutěži je nutné se přihlásit.</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/login" className="sm:w-48">
                          <motion.div whileTap={{ scale: 0.95 }} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black h-12 rounded-xl flex items-center justify-center font-bold text-sm">Přihlásit</motion.div>
                        </Link>
                        <Link href="/auth/register" className="sm:w-48">
                          <motion.div whileTap={{ scale: 0.95 }} className="w-full bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-12 rounded-xl flex items-center justify-center font-bold text-sm">Registrace</motion.div>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {role === 'ADMIN' && (
                  <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex gap-4">
                    <button onClick={() => handleStartUpload('gpx', true)} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors font-medium">[ADMIN] GPX</button>
                    <button onClick={() => handleStartUpload('manual', true)} className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors font-medium">[ADMIN] MANUAL</button>
                  </div>
                )}

                <div className="pt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-sm"
                  >
                    <div className="flex-1 space-y-4 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70">
                        <Smartphone className="w-4 h-4" />
                        <span className="text-xs font-semibold">Mobilní aplikace</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                        Strakatá turistika<br /><span className="text-slate-400 dark:text-white/50">přímo v kapse.</span>
                      </h3>
                      <p className="text-slate-600 dark:text-white/60 max-w-md">
                        Nahrávejte trasy přímo pomocí GPS a sledujte svůj postup jednodušeji než kdy dřív.
                      </p>
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                        <Link href="https://apps.apple.com" target="_blank">
                          <motion.div whileTap={{ scale: 0.95 }} className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-5 py-2.5 rounded-xl text-slate-900 dark:text-white font-semibold text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                            App Store
                          </motion.div>
                        </Link>
                        <Link href="https://play.google.com" target="_blank">
                          <motion.div whileTap={{ scale: 0.95 }} className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-5 py-2.5 rounded-xl text-slate-900 dark:text-white font-semibold text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                            Google Play
                          </motion.div>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-6xl mx-auto py-12"
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBackStep}
                  className="mb-8 ml-6 flex items-center gap-3 text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors group"
                >
                  <div className="p-2 rounded-full bg-slate-100 dark:bg-white/5 group-hover:bg-slate-200 dark:group-hover:bg-white/10 border border-slate-200 dark:border-white/10">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                  <span className="font-semibold text-sm">Zpět k výběru</span>
                </motion.button>

                <div className="w-full">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {currentStep === 'upload' && user && <UploadStep onComplete={handleUploadComplete} user={user as any} userRole={role} initialMode={initialUploadMode} autoTest={autoTest} />}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {currentStep === 'edit' && uploadedRouteId && user && <EditStep routeId={uploadedRouteId} onComplete={handleEditComplete} user={user as any} />}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {currentStep === 'finish' && uploadedRouteId && user && <FinishStep routeId={uploadedRouteId} onComplete={handleFinishComplete} user={user as any} />}
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