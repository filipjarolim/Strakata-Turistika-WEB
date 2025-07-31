"use client"
import React from 'react'
import {CardWrapper} from "@/components/auth/card-wrapper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import * as z from "zod";

import { ResetSchema } from "@/schemas"
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
import { reset } from '@/actions/auth/reset';

export const ResetForm = () => {


    const [error, setError] = React.useState<string | undefined>("")
    const [success, setSuccess] = React.useState<string | undefined>("")
    const [isPending, startTransition] = React.useTransition()

    const form = useForm<z.infer<typeof ResetSchema>>({
        resolver: zodResolver(ResetSchema),
        defaultValues: {
            email: ""
        }
    })

    const onSubmit = (values: z.infer<typeof ResetSchema>) => {

        setError("")
        setSuccess("")

        startTransition(() => {
            reset(values).then((data) => {
                setError(data?.error)
                setSuccess(data?.success)
            })
        })
    }

    return (
        <CardWrapper
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
                            name={"email"}
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            disabled={isPending}
                                            placeholder={"jan.novak@priklad.com"}
                                            type={"email"}
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
                        Poslat ověřovací email
                    </Button>
                </form>
            </Form>
        </CardWrapper>
    )
}

