'use client';

import React, { useState, useEffect } from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, WifiOff, RefreshCw, Trash2, Download, X, Check, Settings } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { NetworkStatus } from './NetworkStatus';

// List of critical pages that should always be cached for offline use
const DEFAULT_CRITICAL_PAGES = [
  '/',
  '/vysledky',
  '/pravidla',
  '/offline',
  '/fotogalerie',
  '/kontakty'
];

// All available pages that can be selected for caching
const AVAILABLE_PAGES = [
  { id: 'home', name: 'Domovská stránka', path: '/' },
  { id: 'results', name: 'Výsledky', path: '/vysledky' },
  { id: 'rules', name: 'Pravidla', path: '/pravidla' },
  { id: 'offline', name: 'Offline stránka', path: '/offline' },
  { id: 'gallery', name: 'Fotogalerie', path: '/fotogalerie' },
  { id: 'contacts', name: 'Kontakty', path: '/kontakty' },
  { id: 'settings', name: 'Nastavení', path: '/nastaveni' },
  { id: 'profile', name: 'Profil', path: '/auth/profil' }
];

export const OfflineController: React.FC = () => {
  const isOffline = useOfflineStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPages, setSelectedPages] = useState<string[]>(DEFAULT_CRITICAL_PAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPageSelector, setShowPageSelector] = useState(false);
  
  // Check if service worker is available
  const isServiceWorkerAvailable = typeof navigator !== 'undefined' && 
                                 'serviceWorker' in navigator;
  
  // Toggle a page selection
  const togglePageSelection = (path: string) => {
    setSelectedPages(prev => 
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };
  
  // Check if a page is selected
  const isPageSelected = (path: string) => {
    return selectedPages.includes(path);
  };

  // Select all pages
  const selectAllPages = () => {
    setSelectedPages(AVAILABLE_PAGES.map(page => page.path));
  };

  // Clear page selection
  const clearPageSelection = () => {
    setSelectedPages([]);
  };
  
  // Reset to default pages
  const resetToDefaultPages = () => {
    setSelectedPages(DEFAULT_CRITICAL_PAGES);
  };
  
  // Cache selected pages for offline use
  const cacheSelectedPages = async () => {
    if (!isServiceWorkerAvailable) {
      toast.error("Offline mód není dostupný", {
        description: "Váš prohlížeč nepodporuje service worker nebo není inicializován"
      });
      return;
    }
    
    if (selectedPages.length === 0) {
      toast.warning("Vyberte alespoň jednu stránku", {
        description: "Pro uložení offline je potřeba vybrat alespoň jednu stránku"
      });
      return;
    }
    
    setIsCaching(true);
    setProgress(10);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 300);
      
      // Pre-cache the critical pages by fetching them - using the same method as before
      await Promise.all(
        selectedPages.map(async (page) => {
          try {
            const response = await fetch(page, { 
              method: 'GET',
              cache: 'force-cache',
              headers: {
                'Service-Worker-Cache': 'true'
              }
            });
            return response.ok;
          } catch (error) {
            console.error(`Failed to cache ${page}:`, error);
            return false;
          }
        })
      );
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setProgress(0);
        setIsCaching(false);
      }, 500);
      
      toast.success("Stránky uloženy offline", {
        description: `${selectedPages.length} stránek bylo uloženo pro offline použití`
      });
    } catch (error) {
      console.error('Error caching pages:', error);
      setProgress(0);
      setIsCaching(false);
      
      toast.error("Chyba při ukládání stránek", {
        description: "Nastala chyba při ukládání stránek offline"
      });
    }
  };
  
  // Clear the cache - using the same method as before
  const clearAllCache = async () => {
    if (!isServiceWorkerAvailable) {
      toast.error("Offline mód není dostupný", {
        description: "Váš prohlížeč nepodporuje service worker nebo není inicializován"
      });
      return;
    }
    
    setIsClearing(true);
    setProgress(10);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 200);
      
      // Use the Cache API to clear all caches
      if ('caches' in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => window.caches.delete(cacheName))
        );
      }
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setProgress(0);
        setIsClearing(false);
      }, 500);
      
      toast.success("Cache byla vymazána", {
        description: "Všechna offline data byla smazána"
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      setProgress(0);
      setIsClearing(false);
      
      toast.error("Chyba při mazání cache", {
        description: "Nastala chyba při mazání cache"
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setIsOpen(true)}
          className="bg-white shadow-sm"
          aria-label="Offline nastavení"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="z-100">
        <SheetHeader>
          <SheetTitle>Offline nastavení</SheetTitle>
          <SheetDescription>
            Správa offline funkcionality aplikace
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Stav sítě:</span>
            <NetworkStatus />
          </div>
          
          <div className="space-y-4 mt-6">
            <h4 className="font-medium mb-2">Akce</h4>
            
            {/* Conditional progress indicator */}
            {(isCaching || isClearing) && (
              <div className="mb-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-500 mt-1">
                  {isCaching ? 'Ukládání stránek...' : 'Mazání cache...'}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="w-full"
                disabled={isCaching || isClearing || isOffline}
                onClick={showPageSelector ? cacheSelectedPages : () => setShowPageSelector(true)}
              >
                {isCaching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {showPageSelector ? "Uložit vybrané" : "Uložit offline"}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                disabled={isCaching || isClearing}
                onClick={clearAllCache}
              >
                {isClearing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Vymazat cache
              </Button>
            </div>
          </div>

          {/* Page selector section */}
          {showPageSelector && (
            <div className="mt-6 border rounded-md p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Vyberte stránky k uložení</h4>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={selectAllPages}
                    className="text-xs h-7 px-2"
                  >
                    Vše
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearPageSelection}
                    className="text-xs h-7 px-2"
                  >
                    Žádné
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetToDefaultPages}
                    className="text-xs h-7 px-2"
                  >
                    Výchozí
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowPageSelector(false)}
                    className="text-xs h-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-40">
                <div className="space-y-2">
                  {AVAILABLE_PAGES.map((page) => (
                    <div key={page.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`page-${page.id}`} 
                        checked={isPageSelected(page.path)}
                        onCheckedChange={() => togglePageSelection(page.path)}
                      />
                      <Label 
                        htmlFor={`page-${page.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {page.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="mt-3 text-right">
                <Badge variant="outline">
                  {selectedPages.length} stránek vybráno
                </Badge>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <h4 className="font-medium mb-2">Offline dostupnost</h4>
            <p className="text-sm text-gray-500 mb-2">
              Při použití offline máte přístup k základním stránkám a předem načteným datům.
            </p>
            
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm mt-4">
              <p className="flex items-start">
                <WifiOff className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  Pro nejlepší offline zkušenost doporučujeme nejprve načíst všechny důležité stránky pomocí tlačítka &quot;Uložit offline&quot;.
                </span>
              </p>
            </div>
          </div>
        </div>
        
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" className="w-full">
              Zavřít
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}; 