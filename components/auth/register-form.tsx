"use client"

import React from 'react'
import { CardWrapper } from "@/components/auth/card-wrapper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";

import { RegisterSchema } from "@/schemas"
import {
    Form,
    FormField,
} from "@/components/ui/form";
import { FormError } from "@/components/forms/form-error";
import { FormSuccess } from "@/components/forms/form-success";
import { register } from "@/actions/auth/register";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSTextInput } from "@/components/ui/ios/text-input";
import { UserPlus, Mail, KeyRound, User, ArrowRight } from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export const RegisterForm = () => {
    const [error, setError] = React.useState<string | undefined>("")
    const [success, setSuccess] = React.useState<string | undefined>("")
    const [isPending, startTransition] = React.useTransition()

    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            email: "",
            password: "",
            name: ""
        }
    })

    const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
        setError("")
        setSuccess("")

        startTransition(() => {
            register(values).then((data) => {
                setError(data.error)
                setSuccess(data.success)
            })
        })
    }

    return (
        <CardWrapper
            headerIcon={<UserPlus className="w-8 h-8 text-blue-600" />}
            title="Nový účet"
            subtitle="Připojte se k dobrodružství se Strakatou Turistikou"
            backButtonLabel={{
                message: "Již máte účet?",
                link: "Přihlásit se",
            }}
            backButtonHref="/auth/login"
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                    >
                        <motion.div variants={itemVariants}>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <IOSTextInput
                                        label="Celé jméno"
                                        placeholder="Jan Novák"
                                        disabled={isPending}
                                        icon={<User className="w-4 h-4 text-gray-500" />}
                                        {...field}
                                    />
                                )}
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
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
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <IOSTextInput
                                        label="Heslo"
                                        placeholder="******"
                                        type="password"
                                        disabled={isPending}
                                        icon={<KeyRound className="w-4 h-4 text-gray-500" />}
                                        {...field}
                                    />
                                )}
                            />
                        </motion.div>
                    </motion.div>

                    <div className="space-y-4">
                        <FormError message={error} />
                        <FormSuccess message={success} />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <IOSButton
                                type="submit"
                                disabled={isPending}
                                loading={isPending}
                                variant="primary"
                                className="w-full h-14 text-base font-bold shadow-xl shadow-blue-500/20 rounded-2xl"
                            >
                                Vytvořit účet
                                {!isPending && <ArrowRight className="ml-2 w-5 h-5" />}
                            </IOSButton>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-6"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-100 dark:border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-transparent px-4 text-gray-600 dark:text-gray-400 font-bold tracking-[0.2em]">nebo pokračujte přes</span>
                            </div>
                        </div>

                        <GoogleLoginButton
                            disabled={isPending}
                            className="h-14 rounded-2xl text-sm font-bold border-gray-100 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all duration-300"
                        >
                            Pokračovat s Google
                        </GoogleLoginButton>
                    </motion.div>
                </form>
            </Form>
        </CardWrapper>
    )
}

