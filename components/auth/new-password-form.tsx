"use client"
import React from 'react'
import {CardWrapper} from "@/components/auth/card-wrapper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation"

import * as z from "zod";

import { NewPasswordSchema } from "@/schemas"
import {
    Form,
    FormControl,
    FormLabel,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {FormError} from "@/components/forms/form-error";
import {FormSuccess} from "@/components/forms/form-success";
import { newPassword } from '@/actions/auth/new-password';

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
            headerLabel={"Zadejte své nové heslo!"}
            backButtonLabel={{
                message: "Jít zpět?",
                link: "Přihlásit se"
            }}
            backButtonHref={"/auth/login"}

        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className={"space-y-6"}>
                    <div className={"space-y-4"}>
                        <FormField
                            control={form.control}
                            name={"password"}
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            disabled={isPending}
                                            placeholder={"******"}
                                            type={"password"}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormError message={error} />
                    <FormSuccess message={success} />
                    <Button type={"submit"} disabled={isPending} className={"w-full flex flex-row items-center justify-center"}>
                        Obnovit heslo
                    </Button>
                </form>
            </Form>
        </CardWrapper>
    )
}

