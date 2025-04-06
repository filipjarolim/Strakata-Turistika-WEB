'use client';

import React, { useState, useEffect } from 'react';
import { useOfflineStatus } from '@/lib/hooks/useOfflineStatus';
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
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

// List of critical pages that should always be cached for offline use
const CRITICAL_PAGES = [
  '/',
  '/vysledky',
  '/pravidla',
  '/offline',
  '/fotogalerie',
  '/kontakty'
];

export const OfflineController: React.FC = () => {
  const { isOnline, isOfflineCapable, cachedEndpoints } = useOfflineStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [cachedPages, setCachedPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Get list of cached pages from service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'UPDATE_CACHED_PAGES') {
          setCachedPages(event.data.pages || []);
        }
      };
      
      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      // Request cached pages on component mount
      navigator.serviceWorker.controller.postMessage({ 
        type: 'REQUEST_CACHED_PAGES' 
      });
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  // Group cached endpoints by type
  const apiEndpoints = cachedEndpoints.filter(url => url.includes('/api/'));
  const cachedPageUrls = cachedPages.filter(url => !url.includes('/api/') && !url.includes('/static/') && !url.includes('/assets/'));
  
  // Request service worker to cache all pages
  const cacheAllPages = async () => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      toast({
        title: "Offline mód není dostupný",
        description: "Váš prohlížeč nepodporuje service worker nebo není inicializován",
        variant: "destructive"
      });
      return;
    }
    
    setIsCaching(true);
    setProgress(10);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_ALL_PAGES',
        pages: CRITICAL_PAGES
      });
      
      // Wait for response or timeout after 5 seconds
      const result = await Promise.race([
        new Promise(resolve => {
          const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'CACHE_COMPLETE') {
              navigator.serviceWorker.removeEventListener('message', handleMessage);
              resolve(event.data);
            }
          };
          
          navigator.serviceWorker.addEventListener('message', handleMessage);
        }),
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 5000))
      ]);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setProgress(0);
        setIsCaching(false);
      }, 500);
      
      toast({
        title: "Stránky uloženy offline",
        description: "Důležité stránky byly uloženy pro offline použití",
        variant: "default"
      });
      
      // Request updated page list
      navigator.serviceWorker.controller.postMessage({ 
        type: 'REQUEST_CACHED_PAGES' 
      });
    } catch (error) {
      console.error('Error caching pages:', error);
      setProgress(0);
      setIsCaching(false);
      
      toast({
        title: "Chyba při ukládání stránek",
        description: "Nastala chyba při ukládání stránek offline",
        variant: "destructive"
      });
    }
  };
  
  // Request service worker to clear all cache
  const clearAllCache = async () => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      toast({
        title: "Offline mód není dostupný",
        description: "Váš prohlížeč nepodporuje service worker nebo není inicializován",
        variant: "destructive"
      });
      return;
    }
    
    setIsClearing(true);
    setProgress(10);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 200);
      
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_ALL_CACHE'
      });
      
      // Wait for response or timeout after 3 seconds
      await Promise.race([
        new Promise(resolve => {
          const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'CACHE_CLEARED') {
              navigator.serviceWorker.removeEventListener('message', handleMessage);
              resolve(event.data);
            }
          };
          
          navigator.serviceWorker.addEventListener('message', handleMessage);
        }),
        new Promise(resolve => setTimeout(() => resolve(null), 3000))
      ]);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setProgress(0);
        setIsClearing(false);
      }, 500);
      
      toast({
        title: "Cache byla vymazána",
        description: "Všechna offline data byla smazána",
        variant: "default"
      });
      
      // Request updated page list
      navigator.serviceWorker.controller.postMessage({ 
        type: 'REQUEST_CACHED_PAGES' 
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      setProgress(0);
      setIsClearing(false);
      
      toast({
        title: "Chyba při mazání cache",
        description: "Nastala chyba při mazání cache",
        variant: "destructive"
      });
    }
  };
  
  // Update cached pages list
  const refreshCachedPages = () => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
    
    setIsLoading(true);
    navigator.serviceWorker.controller.postMessage({ 
      type: 'REQUEST_CACHED_PAGES' 
    });
    
    // Set a timeout to stop loading state after 2 seconds
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  if (!isOfflineCapable) {
    return null;
  }
  
  // Calculate cache stats
  const totalItems = cachedPages.length;
  const apiItems = apiEndpoints.length;
  const pageItems = cachedPageUrls.length;
  const staticItems = totalItems - apiItems - pageItems;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          size="icon" 
          variant="outline" 
          className={`rounded-full w-10 h-10 shadow-md ${!isOnline ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : ''}`}
        >
          <Settings className="h-5 w-5" />
          <span className="sr-only">Offline nastavení</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="sm:max-w-lg mx-auto rounded-t-xl h-[80vh] sm:h-[70vh]">
        <SheetHeader className="text-left space-y-1">
          <SheetTitle className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-green-600" />
                <span>Online režim</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-amber-600" />
                <span>Offline režim</span>
              </>
            )}
            <Badge variant={isOnline ? "outline" : "secondary"} className="ml-2">
              {totalItems} položek v cache
            </Badge>
          </SheetTitle>
          <SheetDescription>
            {isOnline 
              ? "Jste připojeni k síti. Můžete spravovat obsah pro offline použití."
              : "Pracujete v režimu offline. Některé funkce mohou být omezené."}
          </SheetDescription>
        </SheetHeader>
        
        {progress > 0 && (
          <div className="my-4">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {progress < 100 ? 'Zpracovávám...' : 'Dokončeno!'}
            </p>
          </div>
        )}
        
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">Offline správa</div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshCachedPages}
              disabled={isLoading || isCaching || isClearing}
              className="h-8"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="sr-only">Aktualizovat</span>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={cacheAllPages} 
              variant="default"
              disabled={isCaching || isClearing}
              className="gap-2 flex-1"
            >
              {isCaching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Uložit důležité stránky</span>
            </Button>
            
            <Button 
              onClick={clearAllCache} 
              variant="outline"
              disabled={isCaching || isClearing}
              className="gap-2 flex-1"
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
              <span>Vymazat cache</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 my-6">
            <div className="bg-green-50 p-3 rounded-md text-center">
              <p className="text-xl font-bold text-green-600">{pageItems}</p>
              <p className="text-xs text-muted-foreground">Stránky</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md text-center">
              <p className="text-xl font-bold text-blue-600">{apiItems}</p>
              <p className="text-xs text-muted-foreground">API data</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-md text-center">
              <p className="text-xl font-bold text-purple-600">{staticItems}</p>
              <p className="text-xs text-muted-foreground">Soubory</p>
            </div>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="pages">
              <AccordionTrigger className="text-sm font-medium">
                Uložené stránky
                <Badge variant="outline" className="ml-2">
                  {cachedPageUrls.length}
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-28 rounded-md border p-2">
                  {cachedPageUrls.length > 0 ? (
                    <ul className="space-y-2">
                      {cachedPageUrls.map((url, index) => (
                        <li key={index} className="text-xs flex justify-between items-center">
                          <span>{url.split('?')[0]}</span>
                          <Check className="h-3 w-3 text-green-500" />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-muted-foreground p-2 text-center">
                      Žádné stránky uložené offline
                    </div>
                  )}
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="api">
              <AccordionTrigger className="text-sm font-medium">
                Uložené API data
                <Badge variant="outline" className="ml-2">
                  {apiEndpoints.length}
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-28 rounded-md border p-2">
                  {apiEndpoints.length > 0 ? (
                    <ul className="space-y-2">
                      {apiEndpoints.map((url, index) => (
                        <li key={index} className="text-xs flex justify-between items-center">
                          <span>{url.split('?')[0]}</span>
                          <Check className="h-3 w-3 text-green-500" />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-muted-foreground p-2 text-center">
                      Žádná API data uložená offline
                    </div>
                  )}
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="flex items-center space-x-2 pt-4">
            <Switch id="auto-cache" />
            <Label htmlFor="auto-cache">Automaticky ukládat navštívené stránky</Label>
          </div>
        </div>
        
        <SheetFooter className="pt-4 sm:justify-center">
          <SheetClose asChild>
            <Button className="w-full sm:w-auto">Zavřít</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}; 