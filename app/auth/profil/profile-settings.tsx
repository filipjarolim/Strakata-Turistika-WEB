"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useTransition, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import { SettingsSchema } from "@/schemas";
import { settings } from "@/actions/auth/settings";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserRole } from "@prisma/client";

// iOS Components
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSTextInput } from "@/components/ui/ios/text-input";
import { IOSSelect } from "@/components/ui/ios/select";
import { IOSSection } from "@/components/ui/ios/section";
import { IOSBadge } from "@/components/ui/ios/badge";

// Icons
import {
    User,
    Info,
    AlertCircle,
    CheckCircle,
} from "lucide-react";

const ProfileSettings = () => {
    const user = useCurrentUser();
    const { update } = useSession();
    const [isPending, startTransition] = useTransition();

    const [error, setError] = useState<string | undefined>();
    const [success, setSuccess] = useState<string | undefined>();

    const form = useForm<z.infer<typeof SettingsSchema>>({
        resolver: zodResolver(SettingsSchema),
        defaultValues: {
            password: undefined,
            newPassword: undefined,
            name: user?.name || undefined,
            dogName: user?.dogName || undefined,
            email: user?.email || undefined,
            role: (user?.role === 'ADMIN' || user?.role === 'UZIVATEL') ? user.role : undefined,
        }
    });

    // Update form when user data changes
    useEffect(() => {
        if (user) {
            form.reset({
                password: undefined,
                newPassword: undefined,
                name: user.name || undefined,
                dogName: user.dogName || undefined,
                email: user.email || undefined,
                role: user.role || undefined,
            });
        }
    }, [user, form]);

    const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(() => {
            settings(values)
                .then((data) => {
                    if (data.error) {
                        setError(data.error);
                    }

                    if (data.success) {
                        // Update the session to reflect the changes
                        update();
                        setSuccess(data.success);

                        // Reset form with new values after a short delay to allow session update
                        setTimeout(() => {
                            form.reset({
                                password: undefined,
                                newPassword: undefined,
                                name: values.name || user?.name || undefined,
                                dogName: values.dogName || user?.dogName || undefined,
                                email: values.email || user?.email || undefined,
                                role: values.role || user?.role || undefined,
                            });
                        }, 100);
                    }
                })
                .catch((error) => {
                    console.error("Settings error:", error);
                    setError("Něco se pokazilo!");
                });
        });
    };

    // Only show role options if user is somehow authorized to see them, 
    // currently mimicking the logic from the original file which seemed to allow edits?
    // Actually original file had role options hardcoded. Keeping them.
    const roleOptions = [
        { value: UserRole.ADMIN, label: "Administrátor" },
        { value: UserRole.UZIVATEL, label: "Uživatel" },
        { value: UserRole.TESTER, label: "Tester" }
    ];

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            {/* Settings Form */}
            <IOSCard
                title="Osobní údaje"
                subtitle="Upravte své základní informace"
                icon={<User className="w-6 h-6" />}
                iconBackground="bg-blue-100 dark:bg-blue-500/20"
                iconColor="text-blue-600 dark:text-blue-400"
            >
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
                    {/* Personal Information */}
                    <IOSSection title="Osobní údaje">
                        <IOSTextInput
                            label="Jméno"
                            placeholder="Vaše jméno"
                            {...form.register("name")}
                        />

                        <IOSTextInput
                            label="Jméno psa"
                            placeholder="Jméno vašeho psa"
                            {...form.register("dogName")}
                        />

                        <IOSTextInput
                            label="Email"
                            type="email"
                            placeholder="vas@email.cz"
                            {...form.register("email")}
                            disabled={user?.isOAuth}
                        />
                    </IOSSection>

                    {/* Role Selection - Keeping this as it was in original, though usually role edits are restricted */}
                    <IOSSection title="Role">
                        <IOSSelect
                            label="Role v systému"
                            value={form.watch("role") || ""}
                            onChange={(value) => form.setValue("role", value as UserRole)}
                            options={roleOptions}
                            placeholder="Vyberte roli"
                        />
                    </IOSSection>

                    {/* Password Section - Only for non-OAuth users */}
                    {user?.isOAuth === false && (
                        <IOSSection title="Zabezpečení" subtitle="Změňte své heslo">
                            <IOSTextInput
                                label="Současné heslo"
                                type="password"
                                placeholder="••••••••"
                                {...form.register("password")}
                            />

                            <IOSTextInput
                                label="Nové heslo"
                                type="password"
                                placeholder="••••••••"
                                {...form.register("newPassword")}
                            />
                        </IOSSection>
                    )}


                    {/* Error and Success Messages */}
                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50/80 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-red-100/50 dark:bg-red-500/20">
                                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </div>
                                <span className="text-sm text-red-900 dark:text-red-200">{error}</span>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 rounded-2xl bg-green-50/80 dark:bg-green-500/10 border border-green-200/50 dark:border-green-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-green-100/50 dark:bg-green-500/20">
                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-sm text-green-900 dark:text-green-200">{success}</span>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        <IOSButton
                            type="submit"
                            disabled={isPending}
                            loading={isPending}
                            variant="primary"
                            size="md"
                            className="min-w-[120px] sm:min-w-[140px] h-10 sm:h-12 w-full sm:w-auto"
                        >
                            <span className="hidden sm:inline">{isPending ? "Ukládám..." : "Uložit změny"}</span>
                            <span className="sm:hidden">{isPending ? "Ukládám..." : "Uložit"}</span>
                        </IOSButton>
                    </div>
                </form>
            </IOSCard>

            {/* Account Info */}
            <IOSCard
                title="Informace o účtu"
                subtitle="Detaily vašeho účtu"
                icon={<Info className="w-6 h-6" />}
                iconBackground="bg-gray-100 dark:bg-white/10"
                iconColor="text-gray-600 dark:text-gray-400"
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">ID uživatele</span>
                        <span className="text-sm text-gray-900 dark:text-gray-200 font-mono bg-white/50 dark:bg-black/20 px-3 py-1 rounded-lg truncate max-w-[150px] sm:max-w-none">{user?.id}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Typ účtu</span>
                        <IOSBadge
                            label={user?.isOAuth ? "OAuth" : "Email"}
                            bgColor={user?.isOAuth ? "bg-blue-100 dark:bg-blue-500/20" : "bg-gray-100 dark:bg-white/10"}
                            textColor={user?.isOAuth ? "text-blue-900 dark:text-blue-200" : "text-gray-900 dark:text-gray-200"}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Role</span>
                        <IOSBadge
                            label={user?.role === 'ADMIN' ? 'Administrátor' : user?.role === 'TESTER' ? 'Tester' : 'Uživatel'}
                            bgColor={user?.role === 'ADMIN' ? "bg-red-100 dark:bg-red-500/20" : user?.role === 'TESTER' ? "bg-purple-100 dark:bg-purple-500/20" : "bg-blue-100 dark:bg-blue-500/20"}
                            textColor={user?.role === 'ADMIN' ? "text-red-900 dark:text-red-200" : user?.role === 'TESTER' ? "text-purple-900 dark:text-purple-200" : "text-blue-900 dark:text-blue-200"}
                        />
                    </div>
                </div>
            </IOSCard>
        </div>
    );
};

export default ProfileSettings;
