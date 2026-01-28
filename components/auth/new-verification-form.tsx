"use client";

import { useCallback, useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import { newVerification } from "@/actions/auth/new-verification";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { FormError } from "@/components/forms/form-error";
import { FormSuccess } from "@/components/forms/form-success";
import { MailCheck } from "lucide-react";

export const NewVerificationForm = () => {
    const [error, setError] = useState<string | undefined>();
    const [success, setSuccess] = useState<string | undefined>();

    const searchParams = useSearchParams();

    const token = searchParams.get("token");

    const onSubmit = useCallback(() => {
        if (success || error) return;

        if (!token) {
            setError("Chybějící token!");
            return;
        }

        newVerification(token)
            .then((data) => {
                setSuccess(data.success);
                setError(data.error);
            })
            .catch(() => {
                setError("Něco se pokazilo!");
            })
    }, [token, success, error]);

    useEffect(() => {
        onSubmit();
    }, [onSubmit]);

    return (
        <CardWrapper
            headerIcon={<MailCheck className="w-8 h-8 text-blue-600" />}
            title="Ověření emailu"
            subtitle="Pracujeme na ověření vaší emailové adresy"
            backButtonLabel={{
                message: "Hotovo?",
                link: "Zpět na přihlášení"
            }}
            backButtonHref="/auth/login"
        >
            <div className="flex flex-col items-center w-full justify-center space-y-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center w-full min-h-[100px]"
                >
                    {!success && !error && (
                        <div className="flex flex-col items-center space-y-4">
                            <BeatLoader color="#3B82F6" />
                            <p className="text-sm text-gray-500 font-medium animate-pulse">Ověřování...</p>
                        </div>
                    )}
                    <FormSuccess message={success} />
                    {!success &&
                        <FormError message={error} />
                    }
                </motion.div>
            </div>
        </CardWrapper>
    )
}