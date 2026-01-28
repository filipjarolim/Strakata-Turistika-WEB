"use client"

import React from 'react'
import { CardWrapper } from "@/components/auth/card-wrapper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation"
import * as z from "zod";
import { motion } from "framer-motion";

import { NewPasswordSchema } from "@/schemas"
import {
    Form,
    FormField,
} from "@/components/ui/form";
import { FormError } from "@/components/forms/form-error";
import { FormSuccess } from "@/components/forms/form-success";
import { newPassword } from '@/actions/auth/new-password';
import { IOSButton } from "@/components/ui/ios/button";
import { IOSTextInput } from "@/components/ui/ios/text-input";
import { ShieldCheck, KeyRound, ArrowRight } from "lucide-react";

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

export const NewPasswordForm = () => {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [error, setError] = React.useState<string | undefined>("")
    const [success, setSuccess] = React.useState<string | undefined>("")
    const [isPending, startTransition] = React.useTransition()

    const form = useForm<z.infer<typeof NewPasswordSchema>>({
        resolver: zodResolver(NewPasswordSchema),
        defaultValues: {
            password: ""
        }
    })

    const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
        setError("")
        setSuccess("")

        startTransition(() => {
            newPassword(values, token).then((data) => {
                setError(data?.error)
                setSuccess(data?.success)
            })
        })
    }

    return (
        <CardWrapper
            headerIcon={<ShieldCheck className="w-8 h-8 text-blue-600" />}
            title="Nové heslo"
            subtitle="Zadejte své nové heslo níže"
            backButtonLabel={{
                message: "Vzpomenuli jste si?",
                link: "Zpět na přihlášení"
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
                                name="password"
                                render={({ field }) => (
                                    <IOSTextInput
                                        label="Nové heslo"
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
                                Změnit heslo
                                {!isPending && <ArrowRight className="ml-2 w-5 h-5" />}
                            </IOSButton>
                        </motion.div>
                    </div>
                </form>
            </Form>
        </CardWrapper>
    )
}

