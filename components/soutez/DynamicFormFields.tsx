'use client';

import React, { useState, useEffect } from 'react';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { IOSSelect } from '@/components/ui/ios/select';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: string; // 'text' | 'textarea' | 'number' | 'email' | 'select' | 'checkbox' | 'date'
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>; // For select fields
  order: number;
  active: boolean;
}

interface DynamicFormFieldsProps {
  values?: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  dark?: boolean;
}

export default function DynamicFormFields({ values = {}, onChange, dark = false }: DynamicFormFieldsProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formValues, setFormValues] = useState<Record<string, unknown>>(values);

  // Load form fields from API
  useEffect(() => {
    const loadFields = async () => {
      try {
        const response = await fetch('/api/form-fields');
        if (response.ok) {
          const data = await response.json();
          setFields(data);
        }
      } catch (error) {
        console.error('Error loading form fields:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFields();
  }, []);

  // Sync external values
  useEffect(() => {
    if (values) {
      setFormValues(values);
    }
  }, [values]);

  const handleChange = (name: string, value: unknown) => {
    const newValues = { ...formValues, [name]: value };
    setFormValues(newValues);
    onChange(newValues);
  };

  const renderField = (field: FormField) => {
    const value = formValues[field.name] || '';

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <IOSTextInput
            key={field.id}
            label={field.label}
            placeholder={field.placeholder || ''}
            value={String(value ?? '')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.name, e.target.value)}
            type={field.type}
            required={field.required}
            dark={dark}
          />
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-white">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <IOSTextarea
              placeholder={field.placeholder || ''}
              value={String(value ?? '')}
              onChange={(newValue: string) => handleChange(field.name, newValue)}
              colors={{
                background: dark ? 'bg-black/40' : 'bg-white',
                text: dark ? 'text-white' : 'text-gray-900',
                placeholder: dark ? 'text-white/40' : 'text-gray-500',
                border: dark ? 'border-white/30' : 'border-gray-300',
                focus: 'border-blue-500'
              }}
            />
          </div>
        );

      case 'number':
        return (
          <IOSTextInput
            key={field.id}
            label={field.label}
            placeholder={field.placeholder || ''}
            value={String(value ?? '')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.name, parseFloat(e.target.value) || 0)}
            type="number"
            required={field.required}
            dark={dark}
          />
        );

      case 'select':
        if (!field.options || !Array.isArray(field.options)) return null;
        
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-white">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={String(value ?? '')}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border transition-colors ${
                dark 
                  ? 'bg-black/40 border-white/30 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Vyberte...</option>
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id={field.id}
              checked={value === true || value === 'true' || value === 'yes'}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={field.id} className="text-sm font-medium text-white">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );

      case 'date':
        return (
          <IOSTextInput
            key={field.id}
            label={field.label}
            placeholder={field.placeholder || ''}
            value={String(value ?? '')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.name, e.target.value)}
            type="date"
            required={field.required}
            dark={dark}
          />
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="text-white text-center py-4">Načítání formuláře...</div>;
  }

  if (fields.length === 0) {
    return null; // No fields configured
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => renderField(field))}
    </div>
  );
}
