'use client';

import React from 'react';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Upload, Play, Star, ArrowRight, MapPin, Trophy, Users, Calendar } from 'lucide-react';

const Page = () => {
  const user = useCurrentUser();
  const role = useCurrentRole();

  return (
    <CommonPageTemplate 
      contents={{header: true}} 
      headerMode='auto-hide'
      currentUser={user} 
      currentRole={role} 
    >
      <div className="h-screen overflow-hidden p-3 sm:p-4 md:p-6">
        <div className="h-full flex flex-col max-w-7xl mx-auto">
          {/* Main Content Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-full"
          >
            {/* Nahrát trasu karta */}
            <Link href="/soutez/nahrat" className="block h-full">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-full"
              >
                <Card className="h-full flex flex-col group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/30 bg-gradient-to-br from-blue-50/50 to-white">
                  <CardContent className="flex flex-col items-center justify-center flex-1 p-4 sm:p-6 lg:p-8">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="flex items-center justify-center w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 mb-4 relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                      <div className="absolute inset-2 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                      <Image
                        src="/icons/soutez/3.png"
                        alt="Nahrát trasu"
                        width={160}
                        height={160}
                        className="object-contain relative z-10 group-hover:scale-110 transition-transform duration-300"
                      />
                    </motion.div>
                    
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 text-center group-hover:text-primary transition-colors">
                      Nahrát trasu
                    </h2>
                    <p className="text-gray-600 mb-4 text-center text-sm sm:text-base max-w-sm">
                      Nahrajte svou trasu z GPS zařízení a získejte body za své návštěvy
                    </p>
                    
                    <Button 
                      size="lg" 
                      className="w-full max-w-sm text-base py-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-lg group-hover:shadow-xl mb-4"
                    >
                      Pokračovat
                      <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    {/* Informační kontejnery */}
                    <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
                      <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg group-hover:bg-blue-100/50 transition-colors">
                        <Upload className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">GPS soubory</div>
                          <div className="text-gray-600">GPX, KML, FIT formáty</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg group-hover:bg-blue-100/50 transition-colors">
                        <Trophy className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">Automatické body</div>
                          <div className="text-gray-600">Za délku a zajímavost</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg group-hover:bg-blue-100/50 transition-colors">
                        <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">Okamžité zobrazení</div>
                          <div className="text-gray-600">Trasa na mapě ihned</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>

            {/* Google Play Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="h-full"
            >
              <Card className="h-full group hover:shadow-2xl transition-all duration-300 border-2 hover:border-green-300 bg-gradient-to-br from-green-50/50 to-white">
                <CardContent className="h-full flex flex-col justify-center p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col items-center text-center">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="relative mb-4"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                      <div className="absolute inset-2 bg-gradient-to-br from-green-200 to-green-300 rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                      <Image
                        src="/icons/icon-512x512.png"
                        alt="Strakatá Turistika"
                        width={100}
                        height={100}
                        className="rounded-3xl relative z-10 group-hover:scale-110 transition-transform duration-300"
                      />
                    </motion.div>
                    
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      Strakatá Turistika
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm sm:text-base max-w-sm">
                      Stáhněte si naši mobilní aplikaci pro lepší zážitek z turistiky
                    </p>
                    
                    <a
                      href="https://play.google.com/store/apps/details?id=cz.strakata.turistika.strakataturistikaandroidapp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full max-w-sm"
                    >
                      <Button 
                        size="lg" 
                        className="w-full bg-green-600 hover:bg-green-700 text-white group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-xl text-base py-4 mb-4"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Stáhnout z Google Play
                      </Button>
                    </a>

                    {/* Informační kontejnery */}
                    <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
                      <div className="flex items-center gap-3 p-3 bg-green-50/50 rounded-lg group-hover:bg-green-100/50 transition-colors">
                        <Play className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">Offline režim</div>
                          <div className="text-gray-600">Funguje bez internetu</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50/50 rounded-lg group-hover:bg-green-100/50 transition-colors">
                        <Calendar className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">Synchronizace</div>
                          <div className="text-gray-600">Data se ukládají do cloudu</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50/50 rounded-lg group-hover:bg-green-100/50 transition-colors">
                        <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">Komunita</div>
                          <div className="text-gray-600">Sdílejte s ostatními</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </CommonPageTemplate>
  );
};

export default Page;