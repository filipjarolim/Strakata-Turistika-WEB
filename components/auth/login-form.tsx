"use client"
import React from 'react'
import {CardWrapper} from "@/components/auth/card-wrapper";
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
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {FormError} from "@/components/forms/form-error";
import {FormSuccess} from "@/components/forms/form-success";
import { login } from '@/actions/auth/login';
import Link from "next/link";

export const LoginForm = () => {

    const searchParams = useSearchParams()
    const urlError = searchParams.get("error") === "OAuthAccountNotLinked" ? "Email already in use with different provider!" : ""

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
                .catch(() => setError("Something went wrong!"))
        })
    }

    return (
        <CardWrapper
            headerLabel={"Login to **serviceName**"}
            backButtonLabel={{
                message: "Don't have an account?",
                link: "Sign up"
            }}
            backButtonHref={"/auth/register"}
            showSocial
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className={"space-y-6"}>
                    <div className={"space-y-4"}>
                        {
                            showTwoFactor &&
                            <FormField
                                control={form.control}
                                name={"code"}
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Two Factor Code</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isPending}
                                                placeholder={"123456"}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        }
                        {
                            !showTwoFactor &&
                            <>
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
                                                    placeholder={"john.doe@example.com"}
                                                    type={"email"}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={"password"}
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel className={"flex flex-row items-center justify-between"}>
                                                <div>
                                                    Password
                                                </div>
                                                <Button size={"sm"} variant={"link"} asChild className={"px-0 font-normal"}>
                                                    <Link href={"/auth/reset"}>
                                                        Forgot Password?
                                                    </Link>
                                                </Button>
                                            </FormLabel>
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
                            </>
                        }
                    </div>
                    <FormError message={error || urlError} />
                    <FormSuccess message={success} />
                    <Button type={"submit"} disabled={isPending} className={"w-full flex flex-row items-center justify-center"}>
                        Continue
                    </Button>
                </form>
            </Form>
        </CardWrapper>
    )
}

