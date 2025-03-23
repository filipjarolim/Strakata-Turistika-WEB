"use client";

import React, { useState } from 'react';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    CardDescription,
    CardFooter 
} from "@/components/ui/card";
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
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
    Form, 
    FormControl, 
    FormDescription, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
                className="flex items-start space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-medium text-lg">Adresa</h3>
                    <p className="text-muted-foreground">
                        Spolek českého strakatého psa<br />
                        Patočkova 16/976<br />
                        169 00 Praha 6
                    </p>
                </div>
            </motion.div>
            
            <motion.div 
                className="flex items-start space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-medium text-lg">Email</h3>
                    <a href="mailto:info@strakatypesklub.cz" className="text-primary hover:underline flex items-center gap-1 group">
                        info@strakatypesklub.cz
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>
            </motion.div>
            
            <motion.div 
                className="flex items-start space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-medium text-lg">Telefon</h3>
                    <a href="tel:+420777123456" className="text-primary hover:underline flex items-center gap-1 group">
                        +420 777 123 456
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>
            </motion.div>
            
            <motion.div 
                className="flex items-start space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-medium text-lg">Úřední hodiny</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
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
        <div className="w-full h-[300px] sm:h-[400px] bg-gray-100 rounded-lg overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-100/0 to-gray-100/40 group-hover:opacity-0 transition-opacity duration-300"></div>
            <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-300">
                <div className="text-center text-muted-foreground">
                    <MapPin className="h-10 w-10 mx-auto mb-2 text-primary/70" />
                    <p className="font-medium text-lg">Mapa bude zobrazena zde</p>
                    <p className="text-sm mt-1">(Google Maps embed)</p>
                </div>
            </div>
            {/* Google Maps iframe would go here in production */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/90 backdrop-blur-sm py-2 px-4 rounded-full shadow-md"
                >
                    <Button variant="link" className="gap-1">
                        Otevřít v Google Maps
                        <ExternalLink className="h-3 w-3" />
                    </Button>
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
        
        try {
            // In a real app, this would use Resend API
            const response = await fetch('/api/contact', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Simulate success for demo
            // await new Promise(r => setTimeout(r, 1500));
            // const response = { ok: true };
            
            if (response.ok) {
                setSubmitStatus('success');
                form.reset();
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            setSubmitStatus('error');
            console.error('Error sending email:', error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (submitStatus === 'success') {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-100 rounded-lg p-6 text-center"
            >
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-medium mb-2">Zpráva byla odeslána</h3>
                <p className="text-muted-foreground mb-4">
                    Děkujeme za váš kontakt. Brzy se vám ozveme.
                </p>
                <Button variant="outline" onClick={() => setSubmitStatus('idle')}>
                    Odeslat další zprávu
                </Button>
            </motion.div>
        );
    }
    
    if (submitStatus === 'error') {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-100 rounded-lg p-6 text-center"
            >
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h3 className="text-xl font-medium mb-2">Chyba při odesílání</h3>
                <p className="text-muted-foreground mb-4">
                    Omlouváme se, ale zprávu se nepodařilo odeslat. Zkuste to prosím znovu nebo nás kontaktujte jiným způsobem.
                </p>
                <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setSubmitStatus('idle')}>
                        Zkusit znovu
                    </Button>
                    <Button variant="default">
                        <a href="mailto:info@strakatypesklub.cz" className="flex items-center gap-1">
                            Poslat email <ExternalLink className="h-3 w-3" />
                        </a>
                    </Button>
                </div>
            </motion.div>
        );
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Jméno</FormLabel>
                                <FormControl>
                                    <Input placeholder="Vaše jméno" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="vas@email.cz" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Předmět</FormLabel>
                            <FormControl>
                                <Input placeholder="Předmět zprávy" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Zpráva</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Vaše zpráva..." 
                                    className="min-h-[120px]" 
                                    {...field} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Odesílání...
                        </>
                    ) : (
                        <>
                            Odeslat zprávu
                            <Send className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
};

const FaqSection = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Často kladené otázky</h3>
            
            <div className="space-y-3">
                {FAQ_ITEMS.map((faq, index) => (
                    <Card key={index} className={cn(
                        "overflow-hidden transition-all duration-200",
                        openFaq === index ? "shadow-md" : "hover:shadow-sm"
                    )}>
                        <button 
                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                            className="w-full text-left py-4 px-5 flex justify-between items-center"
                        >
                            <h4 className="font-medium">{faq.question}</h4>
                            <ChevronRight className={cn(
                                "h-5 w-5 text-muted-foreground transition-transform duration-200",
                                openFaq === index && "rotate-90"
                            )} />
                        </button>
                        
                        {openFaq === index && (
                            <CardContent className="pt-0 pb-4 px-5 border-t">
                                <motion.p 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="text-muted-foreground"
                                >
                                    {faq.answer}
                                </motion.p>
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};

export const ContactClient = () => {
    // Animated variants for staggered animations
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };
    
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="w-full">
            {/* Hero section */}
            <motion.div 
                className="relative overflow-hidden rounded-xl mb-8 bg-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="relative max-w-4xl mx-auto px-4 py-10 md:py-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Kontakty</h1>
                    <p className="text-lg md:text-xl max-w-2xl text-gray-600">
                        Máte otázky nebo návrhy? Neváhejte nás kontaktovat. Jsme tu pro vás a rádi vám pomůžeme.
                    </p>
                </div>
            </motion.div>
            
            <Tabs defaultValue="contact" className="space-y-8 w-full">
                <TabsList className="w-full md:w-auto mx-auto flex justify-center mb-2 bg-gray-50/50 rounded-full p-1">
                    <TabsTrigger value="contact" className="rounded-full px-4">Kontaktní informace</TabsTrigger>
                    <TabsTrigger value="faq" className="rounded-full px-4">Časté otázky</TabsTrigger>
                </TabsList>
                
                <TabsContent value="contact" className="space-y-8 w-full">
                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div variants={itemVariants}>
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle>Kontaktní informace</CardTitle>
                                    <CardDescription>
                                        Jak nás můžete kontaktovat?
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ContactInfo />
                                </CardContent>
                                <CardFooter className="flex-col items-start gap-4">
                                    <h4 className="text-sm font-medium">Sledujte nás na sociálních sítích</h4>
                                    <div className="flex gap-2">
                                        {SOCIAL_LINKS.map((link) => (
                                            <motion.a 
                                                key={link.name} 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={cn(
                                                    "p-2 rounded-full transition-colors",
                                                    link.color
                                                )}
                                                title={link.name}
                                            >
                                                {link.icon}
                                            </motion.a>
                                        ))}
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                        
                        <motion.div variants={itemVariants}>
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle>Napište nám</CardTitle>
                                    <CardDescription>
                                        Využijte náš kontaktní formulář pro rychlé spojení
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ContactForm />
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                    
                    <motion.div 
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.6 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Kde nás najdete</CardTitle>
                                <CardDescription>
                                    Sídlo spolku českého strakatého psa
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <MapComponent />
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>
                
                <TabsContent value="faq" className="w-full">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Často kladené otázky</CardTitle>
                                <CardDescription>
                                    Odpovědi na nejčastější dotazy
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FaqSection />
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-6">
                                <p className="text-sm text-muted-foreground">
                                    Nenašli jste odpověď na svůj dotaz?
                                </p>
                                <Button variant="outline" className="gap-1">
                                    Kontaktujte nás
                                    <Mail className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </TabsContent>
            </Tabs>
        </div>
    );
}; 