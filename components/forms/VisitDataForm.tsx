import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ExtendedUser } from "@/next-auth";

interface FormData {
  routeLink?: string;
  visitedPlaces: string;
  dogNotAllowed: string;
  routeTitle?: string;
  routeDescription?: string;
}

interface VisitDataFormProps {
  initialData: FormData;
  onSubmit: (data: FormData) => void | Promise<void>;
  user: ExtendedUser | null;
  isLoading?: boolean;
  submitLabel?: string;
}

export function VisitDataForm({ 
  initialData, 
  onSubmit, 
  user,
  isLoading = false,
  submitLabel = "Uložit"
}: VisitDataFormProps) {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [error, setError] = useState<string | null>(null);

  // Call onSubmit whenever form data changes
  useEffect(() => {
    onSubmit(formData);
  }, [formData, onSubmit]);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chyba</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="routeTitle">Název trasy</Label>
          <Input
            id="routeTitle"
            value={formData.routeTitle || ''}
            onChange={(e) => setFormData({ ...formData, routeTitle: e.target.value })}
            placeholder="Zadejte název trasy"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="routeDescription">Popis trasy</Label>
          <Input
            id="routeDescription"
            value={formData.routeDescription || ''}
            onChange={(e) => setFormData({ ...formData, routeDescription: e.target.value })}
            placeholder="Zadejte popis trasy"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="routeLink">Odkaz na trasu</Label>
          <Input
            id="routeLink"
            value={formData.routeLink || ''}
            onChange={(e) => setFormData({ ...formData, routeLink: e.target.value })}
            placeholder="Zadejte odkaz na trasu"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitedPlaces">Navštívená místa</Label>
          <Input
            id="visitedPlaces"
            value={formData.visitedPlaces}
            onChange={(e) => setFormData({ ...formData, visitedPlaces: e.target.value })}
            placeholder="Zadejte navštívená místa"
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="dogNotAllowed" className="flex-1">Psi zakázáni</Label>
          <Switch
            id="dogNotAllowed"
            checked={formData.dogNotAllowed === "true"}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, dogNotAllowed: checked ? "true" : "false" })
            }
          />
        </div>
      </div>
    </div>
  );
} 