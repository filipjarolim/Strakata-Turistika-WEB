import React from 'react'
import { LoginForm } from "@/components/auth/login-form";
import { currentRole, currentUser } from "@/lib/auth";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import basicInfo from "@/lib/settings/basicInfo";
import Image from "next/image";

const LoginPage = async () => {
    const user = await currentUser()
    const role = await currentRole()

    return (
        <CommonPageTemplate currentUser={user} currentRole={role} className="min-h-screen bg-[#F2F1F6]">
            <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-6 md:p-8">
                {/* Background Decoration */}
                <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] mix-blend-multiply animate-blob" />
                    <div className="absolute top-[20%] right-[20%] w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000" />
                    <div className="absolute bottom-[20%] left-[40%] w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000" />
                </div>

                <div className="flex w-full max-w-5xl bg-white/70 backdrop-blur-2xl rounded-[32px] sm:rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden min-h-[600px]">
                    {/* Illustration Side */}
                    <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-12 relative overflow-hidden border-r border-white/50">
                        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,transparent)]" />

                        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                            <div className="relative w-full h-72 mb-8 transform transition-transform duration-700 hover:scale-105">
                                <Image
                                    src={basicInfo.img.loginImage}
                                    alt="Login Illustration"
                                    fill
                                    className="object-contain drop-shadow-xl"
                                    priority
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                            <div className="text-center space-y-3">
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Vítejte zpět!</h2>
                                <p className="text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed">
                                    Přihlašte se a pokračujte ve svém dobrodružství se Strakatou Turistikou.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="flex-1 p-6 sm:p-12 flex items-center justify-center bg-white/40">
                        <LoginForm />
                    </div>
                </div>
            </div>
        </CommonPageTemplate>
    )
}
export default LoginPage
