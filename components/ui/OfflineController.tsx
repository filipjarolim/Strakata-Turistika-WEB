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
import { Loader2, Wifi, WifiOff, RefreshCw, Trash2, Download, X, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// List of critical pages that should always be cached for offline use
const CRITICAL_PAGES = [
  '/',
  '/vysledky',
  '/pravidla',
  '/offline'
];

export const OfflineController: React.FC = () => {
  const { isOnline, isOfflineCapable, cachedEndpoints } = useOfflineStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [cachedPages, setCachedPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
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
    
    try {
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
      toast({
        title: "Chyba při ukládání stránek",
        description: "Nastala chyba při ukládání stránek offline",
        variant: "destructive"
      });
    } finally {
      setIsCaching(false);
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
    
    try {
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
      toast({
        title: "Chyba při mazání cache",
        description: "Nastala chyba při mazání cache",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
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
    return (
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => {
          toast({
            title: "Offline mód není dostupný",
            description: "Váš prohlížeč nepodporuje service worker nebo není inicializován",
            variant: "destructive"
          });
        }}
        className="gap-2"
      >
        <WifiOff className="h-4 w-4" />
        <span>Offline nedostupné</span>
      </Button>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          className={`gap-2 ${!isOnline ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : ''}`}
        >
          {isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-green-600" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-amber-600" />
                <span>Offline mód</span>
              </>
            )}
          </SheetTitle>
          <SheetDescription>
            {isOnline 
              ? "Jste připojeni k síti. Můžete spravovat obsah pro offline použití."
              : "Pracujete v režimu offline. Některé funkce mohou být omezené."}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div className="flex justify-between">
            <div className="text-sm font-medium">Offline správa</div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshCachedPages}
              disabled={isLoading}
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
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={cacheAllPages} 
              variant="outline"
              disabled={isCaching}
              className="gap-2"
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
              disabled={isClearing}
              className="gap-2"
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
              <span>Vymazat cache</span>
            </Button>
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
                <ScrollArea className="h-40 rounded-md border p-2">
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
                <ScrollArea className="h-40 rounded-md border p-2">
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
        
        <SheetFooter className="pt-4">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">Zavřít</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}; 