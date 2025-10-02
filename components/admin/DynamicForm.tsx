"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

type DynamicFormProps = {
    initialData: { [key: string]: string | number | boolean | object | null };
    collection: string;
    recordId: string;
};


// Utility function: check if a value is a valid ISO date string.
const isISODate = (value: string | number | boolean | object | null): boolean => {
    if (typeof value !== "string") return false;
    const d = Date.parse(value);
    return !isNaN(d);
};

const DynamicForm: React.FC<DynamicFormProps> = ({ initialData, collection, recordId }) => {
    const [formData, setFormData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : false;
        
        let newValue: string | number | boolean | object | null = value;
        if (type === "checkbox") {
            newValue = checked;
        } else if (type === "date") {
            newValue = value;
        }
        setFormData((prev) => ({ ...prev, [name]: newValue }));
    };

    const handleJSONChange = (e: React.ChangeEvent<HTMLTextAreaElement>, key: string) => {
        // Update JSON field – ideally admin inputs valid JSON.
        try {
            const parsed = JSON.parse(e.target.value);
            setFormData((prev) => ({ ...prev, [key]: parsed }));
        } catch (err) {
            // If invalid JSON, store the string for now.
            setFormData((prev) => ({ ...prev, [key]: e.target.value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/admin/${collection}/${recordId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast({
                    title: "Success",
                    description: "Record updated successfully!",
                    variant: "default",
                });
                router.back();
            } else {
                toast({
                    title: "Error",
                    description: "Error updating record",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Network error",
                variant: "destructive",
            });
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">
                                Editovat {collection} záznam
                            </CardTitle>
                            <div className="text-muted-foreground mt-1">
                                ID: <Badge variant="outline" className="font-mono text-xs">{recordId}</Badge>
                            </div>
                        </div>
                        <Link href={`/admin/${collection}`}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Zpět na seznam
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
            </Card>

            {/* Form */}
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {Object.entries(formData).map(([key, value]) => {
                            // Do not allow editing of the primary key.
                            if (key === "id") {
                                return (
                                    <div key={key} className="space-y-2">
                                        <Label className="text-sm font-medium">{key}</Label>
                                        <Input
                                            type="text"
                                            name={key}
                                            value={String(value)}
                                            readOnly
                                            className="bg-muted cursor-not-allowed"
                                        />
                                    </div>
                                );
                            }

                            // Special handling for News collection
                            if (collection === 'News') {
                                if (key === 'title') {
                                    return (
                                        <div key={key} className="space-y-2">
                                            <Label className="text-sm font-medium">Název aktuality</Label>
                                            <Input
                                                name={key}
                                                value={String(value ?? '')}
                                                onChange={handleChange}
                                                placeholder="Zadejte název aktuality"
                                                className="text-lg font-medium"
                                            />
                                        </div>
                                    );
                                }
                                
                                if (key === 'content') {
                                    return (
                                        <div key={key} className="space-y-2">
                                            <Label className="text-sm font-medium">Obsah aktuality</Label>
                                            <Textarea
                                                name={key}
                                                value={String(value ?? '')}
                                                onChange={handleChange}
                                                placeholder="Zadejte obsah aktuality..."
                                                className="min-h-[200px] resize-y"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Podporuje HTML značky pro formátování
                                            </p>
                                        </div>
                                    );
                                }
                                
                                if (key === 'images') {
                                    return (
                                        <div key={key} className="space-y-2">
                                            <Label className="text-sm font-medium">Obrázky</Label>
                                            <Textarea
                                                name={key}
                                                defaultValue={JSON.stringify(value, null, 2)}
                                                onChange={(e) => handleJSONChange(e, key)}
                                                placeholder="JSON pole s obrázky..."
                                                className="min-h-[100px] font-mono text-xs"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                JSON pole s obrázky - upravte pouze pokud víte, co děláte
                                            </p>
                                        </div>
                                    );
                                }
                            }

                            // Determine input type based on the value.
                            let inputType = "text";
                            if (typeof value === "number") {
                                inputType = "number";
                            } else if (typeof value === "boolean") {
                                inputType = "checkbox";
                            } else if (isISODate(value)) {
                                inputType = "date";
                                // Format the date for the input element (yyyy-MM-dd).
                                value = typeof value === 'string' ? new Date(value).toISOString().substring(0, 10) : '';
                            } else if (key.toLowerCase().includes("email") && !key.toLowerCase().includes("verified")) {
                                inputType = "email";
                            } else if (typeof value === "object" && value !== null) {
                                // For JSON objects, use a textarea.
                                return (
                                    <div key={key} className="space-y-2">
                                        <Label className="text-sm font-medium">{key} (JSON)</Label>
                                        <Textarea
                                            name={key}
                                            defaultValue={JSON.stringify(value, null, 2)}
                                            onChange={(e) => handleJSONChange(e, key)}
                                            className="min-h-[120px] font-mono text-xs"
                                        />
                                    </div>
                                );
                            }

                            return (
                                <div key={key} className="space-y-2">
                                    <Label className="text-sm font-medium">{key}</Label>
                                    {inputType === "checkbox" ? (
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type={inputType}
                                                name={key}
                                                checked={Boolean(value)}
                                                onChange={handleChange}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {Boolean(value) ? "Ano" : "Ne"}
                                            </span>
                                        </div>
                                    ) : (
                                        <Input
                                            type={inputType}
                                            name={key}
                                            value={typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value ?? '')}
                                            onChange={handleChange}
                                        />
                                    )}
                                </div>
                            );
                        })}
                        
                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <Link href={`/admin/${collection}`}>
                                <Button type="button" variant="outline">
                                    Zrušit
                                </Button>
                            </Link>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Ukládám...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Uložit změny
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default DynamicForm;
