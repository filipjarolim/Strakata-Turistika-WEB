'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, DownloadCloud, Image as ImageIcon, X, Map, BarChart2, Camera, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { ResultsModalProps } from './types';

const ResultsModal: React.FC<ResultsModalProps> = ({
  showResults,
  mapImage,
  distance,
  elapsedTime,
  avgSpeed,
  maxSpeed,
  isSaving,
  saveSuccess,
  onClose,
  onFinish,
  onReset,
  className = ''
}) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setPhotos(prev => [...prev, ...files]);
      const newPreviewUrls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      photos.forEach((photo, index) => {
        formData.append(`photos`, photo);
      });
      formData.append('comment', comment);
      formData.append('trackData', JSON.stringify({
        distance,
        elapsedTime,
        avgSpeed,
        maxSpeed,
        mapImage
      }));

      await onFinish(formData);
    } catch (error) {
      console.error('Error saving track:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!showResults) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col ${className}`}>
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Výsledky trasy</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="map" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start px-6 border-b">
            <TabsTrigger value="map" className="gap-2">
              <Map className="h-4 w-4" />
              Mapa
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart2 className="h-4 w-4" />
              Statistiky
            </TabsTrigger>
            <TabsTrigger value="photos" className="gap-2">
              <Camera className="h-4 w-4" />
              Fotky
            </TabsTrigger>
            <TabsTrigger value="comment" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Komentář
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="map" className="mt-0">
                {mapImage && (
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={mapImage} 
                      alt="Mapa trasy" 
                      className="w-full h-auto max-h-[400px] object-contain"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stats" className="mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Vzdálenost</p>
                    <p className="text-xl font-bold">{distance} km</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Čas</p>
                    <p className="text-xl font-bold">{formatTime(elapsedTime)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Průměrná rychlost</p>
                    <p className="text-xl font-bold">{avgSpeed} km/h</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Maximální rychlost</p>
                    <p className="text-xl font-bold">{maxSpeed.toFixed(1)} km/h</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="photos" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Fotky z trasy</h3>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" className="gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Přidat fotky
                      </Button>
                    </label>
                  </div>

                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePhoto(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="comment" className="mt-0">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Komentář</h3>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Přidejte komentář k trase..."
                    className="min-h-[200px]"
                  />
                </div>
              </TabsContent>
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="p-6 border-t space-y-4">
            {saveSuccess !== null && (
              <div className={`p-3 rounded-lg text-center ${
                saveSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {saveSuccess ? 'Trasa byla úspěšně uložena' : 'Nepodařilo se uložit trasu'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={onReset}
                className="flex-1"
              >
                Začít novou trasu
              </Button>
              <Button
                onClick={handleFinish}
                disabled={isSaving || isUploading}
                className="flex-1 gap-2"
              >
                {isSaving || isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ukládání...
                  </>
                ) : (
                  <>
                    <DownloadCloud className="h-4 w-4" />
                    Uložit trasu
                  </>
                )}
              </Button>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : n);
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`
    : `${pad(minutes)}:${pad(remainingSeconds)}`;
};

export default ResultsModal; 