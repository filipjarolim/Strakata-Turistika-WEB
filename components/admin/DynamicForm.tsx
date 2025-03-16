"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

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
        const { name, value, type, checked } = e.target;
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
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg space-y-6">
            {Object.entries(formData).map(([key, value]) => {
                // Do not allow editing of the primary key.
                if (key === "id") {
                    return (
                        <div key={key} className="flex flex-col">
                            <label className="mb-1 font-semibold text-gray-700">{key}</label>
                            <input
                                type="text"
                                name={key}
                                value={value}
                                readOnly
                                className="border p-2 bg-gray-100 cursor-not-allowed rounded"
                            />
                        </div>
                    );
                }

                // Determine input type based on the value.
                let inputType = "text";
                if (typeof value === "number") {
                    inputType = "number";
                } else if (typeof value === "boolean") {
                    inputType = "checkbox";
                } else if (key.toLowerCase().includes("email")) {
                    inputType = "email";
                } else if (isISODate(value)) {
                    inputType = "date";
                    // Format the date for the input element (yyyy-MM-dd).
                    value = new Date(value).toISOString().substring(0, 10);
                } else if (typeof value === "object" && value !== null) {
                    // For JSON objects, use a textarea.
                    return (
                        <div key={key} className="flex flex-col">
                            <label className="mb-1 font-semibold text-gray-700">{key} (JSON)</label>
                            <textarea
                                name={key}
                                defaultValue={JSON.stringify(value, null, 2)}
                                onChange={(e) => handleJSONChange(e, key)}
                                className="border p-2 font-mono h-32 rounded"
                            />
                        </div>
                    );
                }

                return (
                    <div key={key} className="flex flex-col">
                        <label className="mb-1 font-semibold text-gray-700">{key}</label>
                        {inputType === "checkbox" ? (
                            <input
                                type={inputType}
                                name={key}
                                checked={value}
                                onChange={handleChange}
                                className="h-5 w-5"
                            />
                        ) : (
                            <input
                                type={inputType}
                                name={key}
                                value={value}
                                onChange={handleChange}
                                className="border p-2 rounded"
                            />
                        )}
                    </div>
                );
            })}
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            >
                {loading ? "Updating..." : "Update Record"}
            </button>
        </form>
    );
};

export default DynamicForm;
