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
            <div className="flex items-center gap-2 group cursor-pointer bg-white/5 hover:bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full transition-all duration-300 border border-white/10 shadow-lg shadow-black/20">
              <div className="p-1 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <ArrowLeft className="h-4 w-4 text-white/70 group-hover:text-white" />
              </div>
              <span className="text-white/70 group-hover:text-white font-medium text-sm font-bold uppercase tracking-widest text-[10px]">Zpět domů</span>
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
                className="w-full space-y-16"
              >
                <div className="space-y-6 max-w-2xl">
                  <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
                    VAŠE CESTA.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-500">
                      VÁŠ PŘÍBĚH.
                    </span>
                  </h1>
                  <p className="text-lg sm:text-xl text-white/50 max-w-lg leading-relaxed font-bold tracking-widest uppercase text-xs">
                    Zaznamenávejte své kroky, sbírejte body a budujte svou legendu.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  {user ? (
                    <>
                      <motion.div
                        whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStartUpload()}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer transition-colors group flex flex-col justify-between min-h-[180px]"
                      >
                        <div className="space-y-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                            <Upload className="h-6 w-6 text-white/50 group-hover:text-blue-400 transition-colors" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Nahrát trasu</h3>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-tight mt-1">Zaznamenejte výkon.</p>
                          </div>
                        </div>
                        <div className="flex justify-end"><Zap className="w-5 h-5 text-white/10 group-hover:text-blue-500/50" /></div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStartUpload('gpx')}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer transition-colors group flex flex-col justify-between min-h-[180px]"
                      >
                        <div className="space-y-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                            <Map className="h-6 w-6 text-white/50 group-hover:text-emerald-400 transition-colors" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Import GPX</h3>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-tight mt-1">Nahrajte záznam.</p>
                          </div>
                        </div>
                        <div className="flex justify-end"><Globe className="w-5 h-5 text-white/10 group-hover:text-emerald-500/50" /></div>
                      </motion.div>

                      <Link href="/soutez/strakata-trasa" className="block h-full">
                        <motion.div
                          whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer transition-colors group flex flex-col justify-between min-h-[180px] h-full"
                        >
                          <div className="space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                              <Trophy className="h-6 w-6 text-white/50 group-hover:text-purple-400 transition-colors" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Strakatá trasa</h3>
                              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-tight mt-1">Měsíční výzvy.</p>
                            </div>
                          </div>
                          <div className="flex justify-end"><Sparkles className="w-5 h-5 text-white/10 group-hover:text-purple-500/50" /></div>
                        </motion.div>
                      </Link>

                      <Link href="/soutez/volna-kategorie" className="block h-full">
                        <motion.div
                          whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer transition-colors group flex flex-col justify-between min-h-[180px] h-full"
                        >
                          <div className="space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                              <Star className="h-6 w-6 text-white/50 group-hover:text-amber-400 transition-colors" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Volná</h3>
                              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-tight mt-1">Týdenní bonus.</p>
                            </div>
                          </div>
                          <div className="flex justify-end"><Navigation className="w-5 h-5 text-white/10 group-hover:text-amber-500/50" /></div>
                        </motion.div>
                      </Link>
                    </>
                  ) : (
                    <div className="col-span-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 text-center space-y-8">
                      <div className="space-y-3">
                        <h3 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tighter">PŘIDEJTE SE K NÁM.</h3>
                        <p className="text-white/40 text-sm font-bold uppercase tracking-widest max-w-sm mx-auto">Pro účast v soutěži je nutné se přihlásit.</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/login" className="sm:w-48">
                          <motion.div whileTap={{ scale: 0.95 }} className="w-full bg-white text-black h-14 rounded-2xl flex items-center justify-center font-bold text-sm uppercase tracking-widest">Přihlásit</motion.div>
                        </Link>
                        <Link href="/auth/register" className="sm:w-48">
                          <motion.div whileTap={{ scale: 0.95 }} className="w-full bg-white/5 border border-white/10 text-white h-14 rounded-2xl flex items-center justify-center font-bold text-sm uppercase tracking-widest">Registrace</motion.div>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {role === 'ADMIN' && (
                  <div className="pt-6 border-t border-white/10 flex gap-4">
                    <button onClick={() => handleStartUpload('gpx', true)} className="text-[10px] text-blue-400/50 hover:text-blue-400 transition-colors uppercase font-bold tracking-widest">[ADMIN] GPX</button>
                    <button onClick={() => handleStartUpload('manual', true)} className="text-[10px] text-purple-400/50 hover:text-purple-400 transition-colors uppercase font-bold tracking-widest">[ADMIN] MANUAL</button>
                  </div>
                )}

                <div className="pt-12">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl p-8 sm:p-12 flex flex-col md:flex-row items-center gap-10"
                  >
                    <div className="flex-1 space-y-6 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/50">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Aplikace</span>
                      </div>
                      <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tighter italic">STRAKATÁ TURISTIKA<br /><span className="text-white/30">V KAPSE.</span></h3>
                      <p className="text-white/50 leading-relaxed font-bold uppercase tracking-widest text-[10px] max-w-md">Nahrávejte trasy přímo pomocí GPS a sledujte svůj postup.</p>
                      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        <Link href="https://apps.apple.com" target="_blank"><motion.div whileTap={{ scale: 0.95 }} className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-widest">App Store</motion.div></Link>
                        <Link href="https://play.google.com" target="_blank"><motion.div whileTap={{ scale: 0.95 }} className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-widest">Play Store</motion.div></Link>
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
                  className="mb-8 ml-6 flex items-center gap-3 text-white/50 hover:text-white transition-colors group"
                >
                  <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 border border-white/10">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                  <span className="font-bold uppercase tracking-widest text-[10px]">Zpět k výběru</span>
                </motion.button>

                <div className="w-full">
                  {currentStep === 'upload' && user && <UploadStep onComplete={handleUploadComplete} user={user} userRole={role} initialMode={initialUploadMode} autoTest={autoTest} />}
                  {currentStep === 'edit' && uploadedRouteId && user && <EditStep routeId={uploadedRouteId} onComplete={handleEditComplete} user={user} />}
                  {currentStep === 'finish' && uploadedRouteId && user && <FinishStep routeId={uploadedRouteId} onComplete={handleFinishComplete} user={user} />}
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