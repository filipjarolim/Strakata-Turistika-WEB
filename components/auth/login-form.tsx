"use client"
import React from 'react'
import { CardWrapper } from "@/components/auth/card-wrapper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation"

import * as z from "zod";

import { LoginSchema } from "@/schemas"
import {
    Form,
    FormControl,
    FormLabel,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/forms/form-error";
import { FormSuccess } from "@/components/forms/form-success";
import { login } from '@/actions/auth/login';
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSTextInput } from "@/components/ui/ios/text-input";
import { LogIn, KeyRound, Mail, ArrowRight } from "lucide-react";

export const LoginForm = () => {

    const searchParams = useSearchParams()
    const urlError = searchParams.get("error") === "OAuthAccountNotLinked" ? "Email je již používán s jiným poskytovatelem!" : ""

    const [showTwoFactor, setShowTwoFactor] = React.useState(false)
    const [error, setError] = React.useState<string | undefined>("")
    const [success, setSuccess] = React.useState<string | undefined>("")
    const [isPending, startTransition] = React.useTransition()

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    })

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {

        setError("")
        setSuccess("")

        startTransition(() => {
            login(values).then((data) => {
                if (data?.error) {
                    form.reset()
                    setError(data.error)
                }

                if (data?.success) {
                    form.reset()
                    setSuccess(data.success)
                }

                if (data?.twoFactor) {
                    setShowTwoFactor(true)
                }
            })
                .catch(() => setError("Něco se pokazilo!"))
        })
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <IOSCard
                title="Přihlášení"
                subtitle="Vítejte zpět"
                icon={<LogIn className="w-6 h-6" />}
                iconBackground="bg-blue-100"
                iconColor="text-blue-600"
            >
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            {showTwoFactor && (
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <IOSTextInput
                                            label="Dvoufaktorový kód"
                                            placeholder="123456"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    )}
                                />
                            )}
                            {!showTwoFactor && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <IOSTextInput
                                                label="Email"
                                                placeholder="jan.novak@priklad.com"
                                                type="email"
                                                disabled={isPending}
                                                icon={<Mail className="w-4 h-4 text-gray-500" />}
                                                {...field}
                                            />
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <div className="space-y-1">
                                                <IOSTextInput
                                                    label="Heslo"
                                                    placeholder="******"
                                                    type="password"
                                                    disabled={isPending}
                                                    icon={<KeyRound className="w-4 h-4 text-gray-500" />}
                                                    {...field}
                                                />
                                                <div className="flex justify-end">
                                                    <Button size="sm" variant="link" asChild className="px-0 font-normal text-xs text-blue-600 h-auto">
                                                        <Link href="/auth/reset">
                                                            Zapomněli jste heslo?
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    />
                                </>
                            )}
                        </div>

                        <FormError message={error || urlError} />
                        <FormSuccess message={success} />

                        <IOSButton
                            type="submit"
                            disabled={isPending}
                            loading={isPending}
                            variant="primary"
                            className="w-full h-12 text-base font-semibold shadow-lg shadow-blue-500/20"
                        >
                            {showTwoFactor ? "Potvrdit" : "Pokračovat"}
                            {!isPending && <ArrowRight className="ml-2 w-4 h-4" />}
                        </IOSButton>
                    </form>
                </Form>

                <div className="mt-8 space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-100" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-400 font-medium tracking-wider">nebo pokračujte přes</span>
                        </div>
                    </div>

                    <GoogleLoginButton disabled={isPending} className="h-12 rounded-xl text-md font-medium border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200" >
                        Pokračovat s Google
                    </GoogleLoginButton>
                </div>
            </IOSCard>

            <div className="mt-6 text-center">
                <Link
                    href="/auth/register"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium flex items-center justify-center gap-1 group"
                >
                    Nemáte ještě účet?
                    <span className="text-blue-600 group-hover:underline">Vytvořte si jej</span>
                </Link>
            </div>
        </div>
    )
}

