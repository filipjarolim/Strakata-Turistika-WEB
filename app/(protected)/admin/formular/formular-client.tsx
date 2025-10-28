'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Edit,
  Trash2,
  Save,
  Loader2,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Check,
  X,
  ArrowLeft
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Material Icons list
const MATERIAL_ICONS = [
  'terrain', 'attractions', 'park', 'castle', 'church', 'place', 
  'museum', 'theater_comedy', 'forest', 'water', 'beach_access',
  'hiking', 'landscape', 'photo_camera', 'visibility', 'star'
];

interface ScoringConfig {
  id: string;
  pointsPerKm: number;
  minDistanceKm: number;
  requireAtLeastOnePlace: boolean;
}

interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string | null;
  options: string[] | null;
  order: number;
  active: boolean;
}

interface PlaceTypeConfig {
  id: string;
  name: string;
  label: string;
  icon: string;
  points: number;
  color: string;
  isActive: boolean;
  order: number;
}

export default function FormularClient() {
  // State for sections
  const [scoringExpanded, setScoringExpanded] = useState(true);
  const [fieldsExpanded, setFieldsExpanded] = useState(true);
  const [placesExpanded, setPlacesExpanded] = useState(true);

  // Data state
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [placeTypes, setPlaceTypes] = useState<PlaceTypeConfig[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [fieldDialog, setFieldDialog] = useState<{ open: boolean; field: FormField | null }>({
    open: false,
    field: null
  });
  const [placeDialog, setPlaceDialog] = useState<{ open: boolean; placeType: PlaceTypeConfig | null }>({
    open: false,
    placeType: null
  });

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [scoringRes, fieldsRes, placesRes] = await Promise.all([
        fetch('/api/scoring-config'),
        fetch('/api/form-fields'),
        fetch('/api/place-type-configs')
      ]);

      if (scoringRes.ok) setScoringConfig(await scoringRes.json());
      if (fieldsRes.ok) setFormFields(await fieldsRes.json());
      if (placesRes.ok) setPlaceTypes(await placesRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Chyba při načítání dat', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ===== SCORING CONFIG =====
  const saveScoringConfig = async () => {
    if (!scoringConfig) return;
    
    setSaving(true);
    try {
      // Get current place type points from placeTypes
      const placeTypePoints: Record<string, number> = {};
      placeTypes.forEach(type => {
        placeTypePoints[type.name] = type.points;
      });
      
      const payload = {
        ...scoringConfig,
        placeTypePoints
      };
      
      const response = await fetch('/api/scoring-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast('Bodování uloženo');
        await loadAllData(); // Reload to get updated config
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      showToast('Chyba při ukládání', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ===== FORM FIELDS =====
  const moveField = async (index: number, direction: 'up' | 'down') => {
    const newFields = [...formFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFormFields(newFields);
    
    // Save new order
    try {
      await fetch('/api/form-fields/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldNames: newFields.map(f => f.name) })
      });
    } catch (error) {
      showToast('Chyba při změně pořadí', 'error');
      loadAllData();
    }
  };

  const saveField = async (field: Partial<FormField>) => {
    try {
      const isEdit = fieldDialog.field !== null;
      const url = isEdit ? `/api/form-fields/${field.name}` : '/api/form-fields';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(field)
      });

      if (response.ok) {
        showToast(isEdit ? 'Pole aktualizováno' : 'Pole přidáno');
        await loadAllData();
        setFieldDialog({ open: false, field: null });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save field');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Chyba při ukládání pole';
      showToast(message, 'error');
    }
  };

  const deleteField = async (name: string) => {
    if (!confirm('Opravdu chcete smazat toto pole?')) return;
    
    try {
      const response = await fetch(`/api/form-fields/${name}`, { method: 'DELETE' });
      
      if (response.ok) {
        showToast('Pole smazáno');
        await loadAllData();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      showToast('Chyba při mazání', 'error');
    }
  };

  // ===== PLACE TYPES =====
  const movePlaceType = async (index: number, direction: 'up' | 'down') => {
    const newPlaceTypes = [...placeTypes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newPlaceTypes.length) return;
    
    [newPlaceTypes[index], newPlaceTypes[targetIndex]] = [newPlaceTypes[targetIndex], newPlaceTypes[index]];
    setPlaceTypes(newPlaceTypes);
    
    // Save new order
    try {
      await fetch('/api/place-type-configs/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeTypeIds: newPlaceTypes.map(p => p.id) })
      });
    } catch (error) {
      showToast('Chyba při změně pořadí', 'error');
      loadAllData();
    }
  };

  const togglePlaceTypeStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/place-type-configs/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        setPlaceTypes(prev => prev.map(p => p.id === id ? { ...p, isActive } : p));
        showToast(isActive ? 'Typ aktivován' : 'Typ deaktivován');
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      showToast('Chyba při změně stavu', 'error');
    }
  };

  const savePlaceType = async (placeType: Partial<PlaceTypeConfig>) => {
    try {
      const isEdit = placeDialog.placeType !== null;
      const url = isEdit ? `/api/place-type-configs/${placeType.id}` : '/api/place-type-configs';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placeType)
      });

      if (response.ok) {
        showToast(isEdit ? 'Typ místa aktualizován' : 'Typ místa přidán');
        await loadAllData();
        setPlaceDialog({ open: false, placeType: null });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save place type');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Chyba při ukládání typu místa';
      showToast(message, 'error');
    }
  };

  const deletePlaceType = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tento typ místa?')) return;
    
    try {
      const response = await fetch(`/api/place-type-configs/${id}`, { method: 'DELETE' });
      
      if (response.ok) {
        showToast('Typ místa smazán');
        await loadAllData();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      showToast('Chyba při mazání', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg shadow-lg p-4 flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          {toast.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/admin" 
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Zpět na admin dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">Správa formuláře</h1>
          <p className="text-muted-foreground mt-1">Konfigurace bodování, polí formuláře a typů míst</p>
        </div>
      </div>

      {/* Scoring Config Section */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <button
          onClick={() => setScoringExpanded(!scoringExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronRight className={`h-5 w-5 transition-transform ${scoringExpanded ? 'rotate-90' : ''}`} />
            <h2 className="text-xl font-semibold">Konfigurace bodování</h2>
          </div>
        </button>

        {scoringExpanded && scoringConfig && (
          <div className="p-4 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Body za kilometr</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={scoringConfig.pointsPerKm}
                  onChange={(e) => setScoringConfig({ ...scoringConfig, pointsPerKm: parseFloat(e.target.value) || 0 })}
                  placeholder="Např. 2.5"
                />
              </div>

              <div className="space-y-2">
                <Label>Minimální vzdálenost (km)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={scoringConfig.minDistanceKm}
                  onChange={(e) => setScoringConfig({ ...scoringConfig, minDistanceKm: parseFloat(e.target.value) || 0 })}
                  placeholder="Např. 3.0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="require-place"
                checked={scoringConfig.requireAtLeastOnePlace}
                onCheckedChange={(checked) => setScoringConfig({ ...scoringConfig, requireAtLeastOnePlace: checked as boolean })}
              />
              <Label htmlFor="require-place" className="cursor-pointer">
                Vyžadovat alespoň jedno místo pro získání bodů
              </Label>
            </div>

            <Button onClick={saveScoringConfig} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Uložit bodování
            </Button>
          </div>
        )}
      </div>

      {/* Form Fields Section */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="w-full flex items-center justify-between p-4 bg-gray-50/50">
          <button
            onClick={() => setFieldsExpanded(!fieldsExpanded)}
            className="flex items-center gap-2 flex-1 hover:opacity-80 transition-opacity"
          >
            <ChevronRight className={`h-5 w-5 transition-transform ${fieldsExpanded ? 'rotate-90' : ''}`} />
            <h2 className="text-xl font-semibold">Dynamická pole formuláře</h2>
            <Badge variant="outline">{formFields.length}</Badge>
          </button>
          <Button
            size="sm"
            onClick={() => setFieldDialog({ open: true, field: null })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Přidat pole
          </Button>
        </div>

        {fieldsExpanded && (
          <div className="p-4 border-t space-y-2">
            {formFields.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Žádná pole zatím nebyla přidána</p>
            ) : (
              formFields.map((field, index) => (
                <div key={field.name} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveField(index, 'down')}
                      disabled={index === formFields.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{field.label}</span>
                      <Badge variant="outline" className="text-xs">{field.type}</Badge>
                      {field.required && <Badge variant="destructive" className="text-xs">*</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">Name: {field.name}</div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setFieldDialog({ open: true, field })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteField(field.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Place Types Section */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="w-full flex items-center justify-between p-4 bg-gray-50/50">
          <button
            onClick={() => setPlacesExpanded(!placesExpanded)}
            className="flex items-center gap-2 flex-1 hover:opacity-80 transition-opacity"
          >
            <ChevronRight className={`h-5 w-5 transition-transform ${placesExpanded ? 'rotate-90' : ''}`} />
            <h2 className="text-xl font-semibold">Typy bodovaných míst</h2>
            <Badge variant="outline">{placeTypes.length}</Badge>
          </button>
          <Button
            size="sm"
            onClick={() => setPlaceDialog({ open: true, placeType: null })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Přidat typ
          </Button>
        </div>

        {placesExpanded && (
          <div className="p-4 border-t space-y-2">
            {placeTypes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Žádné typy míst zatím nebyly přidány</p>
            ) : (
              placeTypes.map((placeType, index) => (
                <div key={placeType.id} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => movePlaceType(index, 'up')}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => movePlaceType(index, 'down')}
                      disabled={index === placeTypes.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl"
                    style={{ backgroundColor: placeType.color }}
                  >
                    <span className="material-icons text-xl">{placeType.icon}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{placeType.label}</span>
                      <Badge variant="outline" className="text-xs">+{placeType.points} bodů</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">ID: {placeType.id}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm text-muted-foreground">Aktivní</span>
                      <Checkbox
                        checked={placeType.isActive}
                        onCheckedChange={(checked) => togglePlaceTypeStatus(placeType.id, checked as boolean)}
                      />
                    </label>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPlaceDialog({ open: true, placeType })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePlaceType(placeType.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Form Field Dialog */}
      <FormFieldDialog
        open={fieldDialog.open}
        field={fieldDialog.field}
        onClose={() => setFieldDialog({ open: false, field: null })}
        onSave={saveField}
      />

      {/* Place Type Dialog */}
      <PlaceTypeDialog
        open={placeDialog.open}
        placeType={placeDialog.placeType}
        onClose={() => setPlaceDialog({ open: false, placeType: null })}
        onSave={savePlaceType}
      />
    </div>
  );
}

// Form Field Dialog Component
function FormFieldDialog({
  open,
  field,
  onClose,
  onSave
}: {
  open: boolean;
  field: FormField | null;
  onClose: () => void;
  onSave: (field: Partial<FormField>) => void;
}) {
  const [formData, setFormData] = useState<Partial<FormField>>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: []
  });

  useEffect(() => {
    if (field) {
      setFormData(field);
    } else {
      setFormData({
        name: '',
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        options: []
      });
    }
  }, [field, open]);

  const handleSave = () => {
    if (!formData.name || !formData.label || !formData.type) {
      alert('Name, název a typ jsou povinné');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{field ? 'Upravit pole' : 'Přidat pole'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name (slug)</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              placeholder="např. dog_name"
              disabled={field !== null}
            />
          </div>

          <div className="space-y-2">
            <Label>Název pole</Label>
            <Input
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="např. Jméno psa"
            />
          </div>

          <div className="space-y-2">
            <Label>Typ pole</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Víceřádkový text</SelectItem>
                <SelectItem value="number">Číslo</SelectItem>
                <SelectItem value="select">Výběr (dropdown)</SelectItem>
                <SelectItem value="checkbox">Zaškrtávací pole</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={formData.required}
              onCheckedChange={(checked) => setFormData({ ...formData, required: checked as boolean })}
            />
            <Label htmlFor="required" className="cursor-pointer">Povinné pole</Label>
          </div>

          <div className="space-y-2">
            <Label>Placeholder</Label>
            <Input
              value={formData.placeholder || ''}
              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              placeholder="např. Např. Rex"
            />
          </div>

          {formData.type === 'select' && (
            <div className="space-y-2">
              <Label>Možnosti (každá na nový řádek)</Label>
              <Textarea
                value={Array.isArray(formData.options) ? formData.options.join('\n') : ''}
                onChange={(e) => setFormData({ ...formData, options: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Možnost 1&#10;Možnost 2&#10;Možnost 3"
                rows={5}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Zrušit</Button>
          <Button onClick={handleSave}>Uložit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Place Type Dialog Component
function PlaceTypeDialog({
  open,
  placeType,
  onClose,
  onSave
}: {
  open: boolean;
  placeType: PlaceTypeConfig | null;
  onClose: () => void;
  onSave: (placeType: Partial<PlaceTypeConfig>) => void;
}) {
  const [formData, setFormData] = useState<Partial<PlaceTypeConfig>>({
    id: '',
    name: '',
    label: '',
    icon: 'place',
    points: 1,
    color: '#9E9E9E'
  });

  useEffect(() => {
    if (placeType) {
      setFormData(placeType);
    } else {
      setFormData({
        id: '',
        name: '',
        label: '',
        icon: 'place',
        points: 1,
        color: '#9E9E9E'
      });
    }
  }, [placeType, open]);

  const handleSave = () => {
    if (!formData.id || !formData.label) {
      alert('ID a název jsou povinné');
      return;
    }
    // Ensure name matches id
    onSave({ ...formData, name: formData.id });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{placeType ? 'Upravit typ místa' : 'Přidat typ místa'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ID (UPPERCASE)</Label>
            <Input
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
              placeholder="např. CASTLE"
              disabled={placeType !== null}
            />
          </div>

          <div className="space-y-2">
            <Label>Název</Label>
            <Input
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="např. Hrad"
            />
          </div>

          <div className="space-y-2">
            <Label>Ikona (Material Icon)</Label>
            <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_ICONS.map(icon => (
                  <SelectItem key={icon} value={icon}>
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-sm">{icon}</span>
                      <span>{icon}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Body</Label>
            <Input
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              placeholder="např. 5"
            />
          </div>

          <div className="space-y-2">
            <Label>Barva</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#9E9E9E"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <Label className="mb-2 block">Náhled</Label>
            <div className="flex items-center gap-2">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl"
                style={{ backgroundColor: formData.color }}
              >
                <span className="material-icons text-2xl">{formData.icon}</span>
              </div>
              <div>
                <div className="font-medium">{formData.label || 'Název'}</div>
                <div className="text-sm text-muted-foreground">+{formData.points} bodů</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Zrušit</Button>
          <Button onClick={handleSave}>Uložit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

