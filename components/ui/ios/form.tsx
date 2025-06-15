"use client";

import React, { useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IOSSelect } from "@/components/ui/ios/select";
import { IOSTextarea } from "@/components/ui/ios/textarea";
import { IOSTextInput } from './text-input';
import { IOSButton } from './button';
import { Label as RadixLabel } from '@radix-ui/react-label';

export type FormFieldType = 'text' | 'email' | 'password' | 'select' | 'textarea' | 'number';

export interface FormField {
    name: string;
    label: string;
    type: FormFieldType;
    placeholder?: string;
    required?: boolean;
    validation?: z.ZodType<unknown>;
    options?: { value: string; label: string }[];
    defaultValue?: string | number | boolean;
    className?: string;
}

export type FormData = Record<string, string | number | boolean>;

export interface IOSFormProps {
    fields: FormField[];
    onSubmit: (data: FormData) => void | Promise<void>;
    submitLabel?: string;
    className?: string;
    colors?: {
        text?: string;
        focus?: string;
        button?: string;
    };
    isLoading?: boolean;
    initialData?: FormData;
}

export const IOSForm = ({
    fields,
    onSubmit,
    submitLabel = "Submit",
    className,
    colors = {
        text: "text-gray-900",
        focus: "focus:ring-blue-500/50",
        button: "bg-blue-600 hover:bg-blue-700"
    },
    isLoading = false,
    initialData = {}
}: IOSFormProps) => {
    const [formData, setFormData] = React.useState<FormData>({});
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [loading, setLoading] = React.useState(isLoading);

    // Initialize form data with default values and initial data
    useEffect(() => {
        const initialFormData: FormData = {};
        fields.forEach(field => {
            initialFormData[field.name] = initialData[field.name] ?? field.defaultValue ?? '';
        });
        setFormData(initialFormData);
    }, [fields, initialData]);

    // Create Zod schema from fields
    const schema = React.useMemo(() => {
        const shape: Record<string, z.ZodType<unknown>> = {};
        fields.forEach(field => {
            let fieldSchema: z.ZodType<unknown> = z.any();

            if (field.validation) {
                fieldSchema = field.validation;
            } else {
                switch (field.type) {
                    case 'email':
                        fieldSchema = z.string().email("Invalid email address");
                        if (field.required) {
                            fieldSchema = (fieldSchema as z.ZodString).min(1, "This field is required");
                        }
                        break;
                    case 'number':
                        fieldSchema = z.number();
                        if (field.required) {
                            fieldSchema = (fieldSchema as z.ZodNumber).min(1, "This field is required");
                        }
                        break;
                    case 'text':
                    case 'password':
                    case 'textarea':
                        fieldSchema = z.string();
                        if (field.required) {
                            fieldSchema = (fieldSchema as z.ZodString).min(1, "This field is required");
                        }
                        break;
                    case 'select':
                        fieldSchema = z.string();
                        if (field.required) {
                            fieldSchema = (fieldSchema as z.ZodString).min(1, "This field is required");
                        }
                        break;
                    default:
                        fieldSchema = z.any();
                }
            }

            shape[field.name] = fieldSchema;
        });

        return z.object(shape);
    }, [fields]);

    const handleChange = (name: string, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when field is modified
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        let valid = true;
        const newErrors: Record<string, string> = {};
        for (const field of fields) {
            if (field.validation) {
                const result = field.validation.safeParse(formData[field.name]);
                if (!result.success) {
                    valid = false;
                    newErrors[field.name] = result.error.errors[0]?.message || 'Invalid value';
                }
            } else if (field.required && !formData[field.name]) {
                valid = false;
                newErrors[field.name] = 'This field is required';
            }
        }
        setErrors(newErrors);
        if (!valid) return;
        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    const renderField = (field: FormField, value: string | number | boolean | undefined, onChange: (v: string | number | boolean) => void, error?: string) => {
        return (
            <div className="mb-2">
                {field.label && (
                    <label className="block text-sm font-semibold text-blue-900 mb-1 select-none" htmlFor={field.name}>
                        {field.label}
                    </label>
                )}
                {(() => {
                    switch (field.type) {
                        case 'text':
                        case 'email':
                            return (
                                <IOSTextInput
                                    id={field.name}
                                    type={field.type}
                                    name={field.name}
                                    value={value?.toString() ?? ''}
                                    onChange={e => onChange(e.target.value)}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    error={error}
                                />
                            );
                        case 'textarea':
                            return (
                                <IOSTextarea
                                    value={value?.toString() ?? ''}
                                    onChange={onChange}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    colors={{ focus: colors.focus }}
                                />
                            );
                        case 'select':
                            return (
                                <IOSSelect
                                    name={field.name}
                                    value={value?.toString() ?? ''}
                                    onChange={onChange}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    options={field.options || []}
                                    className="h-12"
                                />
                            );
                        default:
                            return null;
                    }
                })()}
                {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
            {fields.map(field =>
                <div key={field.name}>
                    {renderField(field, formData[field.name], value => handleChange(field.name, value), errors[field.name])}
                </div>
            )}
            <IOSButton
                type="submit"
                disabled={loading}
                className={cn(
                    "w-full h-12 text-white font-medium",
                    colors.button
                )}
            >
                {loading ? "Loading..." : submitLabel}
            </IOSButton>
        </form>
    );
}; 