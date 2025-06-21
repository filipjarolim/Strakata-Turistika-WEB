"use client";

import React, { useState } from 'react';
import { 
    MapPin, 
    Mail, 
    Phone, 
    Clock, 
    ExternalLink, 
    Send, 
    Facebook, 
    Instagram, 
    Twitter, 
    ChevronRight,
    CheckCircle,
    AlertCircle,
    Loader2,
    MessageSquare,
    Map,
    Users,
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
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";

// Form validation schema
const formSchema = z.object({
    name: z.string().min(2, { message: "Jméno musí obsahovat alespoň 2 znaky" }),
    email: z.string().email({ message: "Neplatný formát emailu" }),
    subject: z.string().min(3, { message: "Předmět musí obsahovat alespoň 3 znaky" }),
    message: z.string().min(10, { message: "Zpráva musí obsahovat alespoň 10 znaků" }),
});

type FormValues = z.infer<typeof formSchema>;

// Social media links
const SOCIAL_LINKS = [
    { 
        name: "Facebook", 
        url: "https://facebook.com/", 
        icon: <Facebook className="h-5 w-5" />,
        color: "bg-blue-100 text-blue-600 hover:bg-blue-200"
    },
    { 
        name: "Instagram", 
        url: "https://instagram.com/", 
        icon: <Instagram className="h-5 w-5" />,
        color: "bg-pink-100 text-pink-600 hover:bg-pink-200" 
    },
    { 
        name: "Twitter", 
        url: "https://twitter.com/", 
        icon: <Twitter className="h-5 w-5" />,
        color: "bg-sky-100 text-sky-600 hover:bg-sky-200" 
    }
];

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

const ContactInfo = () => {
    return (
        <div className="space-y-6">
            <motion.div 
                className="flex items-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <IOSCircleIcon variant="blue" size="md">
                    <MapPin className="h-5 w-5" />
                </IOSCircleIcon>
                <div>
                    <h3 className="font-semibold text-lg text-gray-900">Adresa</h3>
                    <p className="text-gray-600 mt-1">
                        Spolek českého strakatého psa<br />
                        Patočkova 16/976<br />
                        169 00 Praha 6
                    </p>
                </div>
            </motion.div>
            
            <motion.div 
                className="flex items-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <IOSCircleIcon variant="blue" size="md">
                    <Mail className="h-5 w-5" />
                </IOSCircleIcon>
                <div>
                    <h3 className="font-semibold text-lg text-gray-900">Email</h3>
                    <a href="mailto:info@strakatypesklub.cz" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 group mt-1">
                        info@strakatypesklub.cz
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>
            </motion.div>
            
            <motion.div 
                className="flex items-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <IOSCircleIcon variant="blue" size="md">
                    <Phone className="h-5 w-5" />
                </IOSCircleIcon>
                <div>
                    <h3 className="font-semibold text-lg text-gray-900">Telefon</h3>
                    <a href="tel:+420777123456" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 group mt-1">
                        +420 777 123 456
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>
            </motion.div>
            
            <motion.div 
                className="flex items-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <IOSCircleIcon variant="blue" size="md">
                    <Clock className="h-5 w-5" />
                </IOSCircleIcon>
                <div>
                    <h3 className="font-semibold text-lg text-gray-900">Úřední hodiny</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600 mt-1">
                        <span>Pondělí - Pátek:</span><span className="font-medium">9:00 - 17:00</span>
                        <span>Sobota - Neděle:</span><span className="font-medium">Zavřeno</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const MapComponent = () => {
    return (
        <div className="w-full h-[300px] sm:h-[400px] bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl overflow-hidden relative group border border-blue-200/50">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-100/0 to-blue-100/40 group-hover:opacity-0 transition-opacity duration-300"></div>
            <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-300">
                <div className="text-center text-gray-600">
                    <IOSCircleIcon variant="blue" size="lg" className="mx-auto mb-4">
                        <Map className="h-8 w-8" />
                    </IOSCircleIcon>
                    <p className="font-semibold text-lg">Mapa bude zobrazena zde</p>
                    <p className="text-sm mt-1">(Google Maps embed)</p>
                </div>
            </div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/90 backdrop-blur-xl py-3 px-6 rounded-2xl shadow-lg border border-gray-200/50"
                >
                    <IOSButton variant="outline" className="gap-2">
                        Otevřít v Google Maps
                        <ExternalLink className="h-4 w-4" />
                    </IOSButton>
                </motion.div>
            </div>
        </div>
    );
};

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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Contact Info & Map */}
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <IOSCard
                            title="Kontaktní informace"
                            subtitle="Kde nás najdete a jak nás kontaktovat"
                            icon={<Users className="h-6 w-6" />}
                            iconBackground="bg-blue-100"
                            iconColor="text-blue-600"
                        >
                            <ContactInfo />
                        </IOSCard>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        <IOSCard
                            title="Lokalita"
                            subtitle="Kde se nacházíme"
                            icon={<Map className="h-6 w-6" />}
                            iconBackground="bg-green-100"
                            iconColor="text-green-600"
                        >
                            <MapComponent />
                        </IOSCard>
                    </motion.div>
                </div>

                {/* Right Column - Contact Form */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    <ContactForm />
                </motion.div>
            </div>

            {/* Social Media */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
            >
                <IOSCard
                    title="Sledujte nás"
                    subtitle="Buďte v kontaktu na sociálních sítích"
                    icon={<Users className="h-6 w-6" />}
                    iconBackground="bg-purple-100"
                    iconColor="text-purple-600"
                >
                    <div className="flex flex-wrap gap-4">
                        {SOCIAL_LINKS.map((social, index) => (
                            <motion.a
                                key={social.name}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/50 hover:bg-white/90 transition-all duration-200 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                            >
                                <IOSCircleIcon variant="blue" size="sm">
                                    {social.icon}
                                </IOSCircleIcon>
                                <span className="font-medium text-gray-900">{social.name}</span>
                            </motion.a>
                        ))}
                    </div>
                </IOSCard>
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