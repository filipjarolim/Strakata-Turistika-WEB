import { CardWrapper } from "@/components/auth/card-wrapper";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export const ErrorCard = () => {
    return (
        <CardWrapper
            headerIcon={<AlertTriangle className="w-8 h-8 text-red-600" />}
            title="Něco se pokazilo"
            subtitle="Při zpracování vašeho požadavku došlo k chybě"
            backButtonLabel={{
                message: "Chcete se zkusit přihlásit znovu?",
                link: "Zpět na přihlášení"
            }}
            backButtonHref="/auth/login"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20"
            >
                <p className="text-sm text-red-600 dark:text-red-400 font-medium text-center">
                    Tato akce nemohla být dokončena. Zkuste to prosím později nebo kontaktujte podporu.
                </p>
            </motion.div>
        </CardWrapper>
    )
}