"use client";

import React, { useState } from 'react';
import {
    Send,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    Loader2,
    MessageSquare,
    HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// iOS Components
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSTextInput } from "@/components/ui/ios/text-input";
import { IOSTextarea } from "@/components/ui/ios/textarea";
import { IOSSection } from "@/components/ui/ios/section";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";

// Form validation schema
const formSchema = z.object({
    name: z.string().min(2, { message: "Jméno musí obsahovat alespoň 2 znaky" }),
    email: z.string().email({ message: "Neplatný formát emailu" }),
    subject: z.string().min(3, { message: "Předmět musí obsahovat alespoň 3 znaky" }),
    message: z.string().min(10, { message: "Zpráva musí obsahovat alespoň 10 znaků" }),
});

type FormValues = z.infer<typeof formSchema>;

// Frequently asked questions
const FAQ_ITEMS = [
    {
        question: "Jak se mohu zapojit do aktivit spolku?",
        answer: "Pro zapojení do našich aktivit stačí sledovat náš kalendář akcí na webu nebo sociálních sítích. Většina akcí je otevřená i pro nečleny spolku. Pro členství vyplňte přihlášku na našem webu nebo nás kontaktujte."
    },
    {
        question: "Mohu se zúčastnit akce, i když nemám českého strakatého psa?",
        answer: "Většina našich akcí je otevřená i pro majitele jiných plemen nebo kříženců. Vždy je to upřesněno v popisu konkrétní akce."
    },
    {
        question: "Pořádáte výcvikové kurzy nebo školení?",
        answer: "Ano, pravidelně organizujeme výcvikové víkendy, semináře a kurzy zaměřené na různé psí sporty a aktivity. Termíny naleznete v kalendáři akcí."
    },
    {
        question: "Kde mohu najít více informací o plemeni český strakatý pes?",
        answer: "Základní informace o plemeni najdete na našem webu v sekci O plemeni. Pro podrobnější informace nás neváhejte kontaktovat."
    }
];

const ContactForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            subject: "",
            message: ""
        }
    });

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setSubmitStatus('success');
                form.reset();
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <IOSCard
            title="Kontaktní formulář"
            subtitle="Napište nám zprávu a my vám odpovíme co nejdříve"
            icon={<MessageSquare className="h-6 w-6" />}
            iconBackground="bg-blue-100"
            iconColor="text-blue-600"
        >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <IOSTextInput
                            label="Jméno"
                            placeholder="Vaše jméno"
                            value={form.watch("name")}
                            onChange={(e) => form.setValue("name", e.target.value)}
                            required
                            error={form.formState.errors.name?.message}
                        />
                    </div>
                    <div>
                        <IOSTextInput
                            label="Email"
                            type="email"
                            placeholder="vas@email.cz"
                            value={form.watch("email")}
                            onChange={(e) => form.setValue("email", e.target.value)}
                            required
                            error={form.formState.errors.email?.message}
                        />
                    </div>
                </div>

                <div>
                    <IOSTextInput
                        label="Předmět"
                        placeholder="O čem nám píšete?"
                        value={form.watch("subject")}
                        onChange={(e) => form.setValue("subject", e.target.value)}
                        required
                        error={form.formState.errors.subject?.message}
                    />
                </div>

                <div>
                    <IOSTextarea
                        value={form.watch("message")}
                        onChange={(value) => form.setValue("message", value)}
                        placeholder="Napište nám svou zprávu..."
                        required
                    />
                    {form.formState.errors.message?.message && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.message.message}</p>
                    )}
                </div>

                <AnimatePresence>
                    {submitStatus === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-2xl"
                        >
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-800 font-medium">Zpráva byla úspěšně odeslána!</span>
                        </motion.div>
                    )}

                    {submitStatus === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl"
                        >
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="text-red-800 font-medium">Nastala chyba při odesílání zprávy.</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <IOSButton
                    type="submit"
                    className="w-full h-12"
                    loading={isSubmitting}
                    icon={!isSubmitting ? <Send className="h-4 w-4" /> : undefined}
                >
                    {isSubmitting ? 'Odesílání...' : 'Odeslat zprávu'}
                </IOSButton>
            </form>
        </IOSCard>
    );
};

const FaqSection = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <IOSSection title="Často kladené otázky">
            <div className="space-y-4">
                {FAQ_ITEMS.map((faq, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <IOSCard
                            variant="outlined"
                            className="cursor-pointer hover:shadow-lg transition-all duration-200"
                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <IOSCircleIcon variant="amber" size="sm">
                                        <HelpCircle className="h-4 w-4" />
                                    </IOSCircleIcon>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                                        <AnimatePresence>
                                            {openFaq === index && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="text-gray-600 text-sm leading-relaxed"
                                                >
                                                    {faq.answer}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <ChevronRight
                                    className={cn(
                                        "h-5 w-5 text-gray-400 transition-transform duration-200 mt-1",
                                        openFaq === index && "rotate-90"
                                    )}
                                />
                            </div>
                        </IOSCard>
                    </motion.div>
                ))}
            </div>
        </IOSSection>
    );
};

export const ContactClient = () => {
    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <motion.div
                className="text-center space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex items-center justify-center gap-3">
                    <IOSCircleIcon variant="blue" size="lg">
                        <MessageSquare className="h-8 w-8" />
                    </IOSCircleIcon>
                </div>
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Kontaktujte nás</h1>
                    <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
                        Máte dotaz nebo zájem o naše aktivity? Neváhejte nás kontaktovat!
                    </p>
                </div>
            </motion.div>

            {/* Main Content - Contact Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="max-w-2xl mx-auto"
            >
                <ContactForm />
            </motion.div>

            {/* FAQ Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
            >
                <FaqSection />
            </motion.div>
        </div>
    );
}; 