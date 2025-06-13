import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, User, Dog, Trophy, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ExtendedUser } from "@/next-auth";

interface FormData {
  visitDate: Date;
  points: number;
  visitedPlaces: string;
  dogNotAllowed: string;
  year: number;
  extraPoints: {
    description: string;
    distance?: number;
    totalAscent?: number;
    elapsedTime?: number;
    averageSpeed?: number;
    isApproved?: boolean;
  };
}

interface VisitDataFormProps {
  initialData: FormData;
  onSubmit: (data: FormData) => void | Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  user: ExtendedUser | null;
}

export function VisitDataForm({ initialData, onSubmit, submitLabel = "Save", isLoading = false, user }: VisitDataFormProps) {
  const [formData, setFormData] = useState({
    fullName: user?.name || initialData?.fullName || '',
    visitDate: initialData?.visitDate || new Date(),
    points: initialData?.points || 0,
    visitedPlaces: initialData?.visitedPlaces || '',
    dogNotAllowed: initialData?.dogNotAllowed || 'false',
    year: initialData?.year || new Date().getFullYear(),
    extraPoints: initialData?.extraPoints || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      visitDate: formData.visitDate,
      visitedPlaces: formData.visitedPlaces,
    });
  };

  const handleExtraPointsChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      extraPoints: {
        ...formData.extraPoints,
        [key]: value
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dogName" className="text-sm font-medium text-gray-700">Jméno psa</Label>
          <Input
            id="dogName"
            value={formData.extraPoints.dogName || ''}
            onChange={(e) => handleExtraPointsChange('dogName', e.target.value)}
            placeholder="Zadejte jméno psa"
            className="h-11 rounded-xl border-gray-200 bg-white/50 backdrop-blur-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitedPlaces" className="text-sm font-medium text-gray-700">Navštívená místa</Label>
          <Input
            id="visitedPlaces"
            value={formData.visitedPlaces}
            onChange={(e) => setFormData({ ...formData, visitedPlaces: e.target.value })}
            placeholder="Zadejte navštívená místa"
            className="h-11 rounded-xl border-gray-200 bg-white/50 backdrop-blur-sm"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200">
          <Label htmlFor="dogNotAllowed" className="text-sm font-medium text-gray-700">Pes není povolen</Label>
          <Switch
            id="dogNotAllowed"
            checked={formData.dogNotAllowed === 'true'}
            onCheckedChange={(checked) => setFormData({ ...formData, dogNotAllowed: checked ? 'true' : 'false' })}
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-lg shadow-blue-500/25" 
        disabled={isLoading}
      >
        {isLoading ? 'Ukládání...' : submitLabel}
      </Button>
    </form>
  );
} 