"use client"

import { useEffect } from 'react';
import { LoginButton } from '@/components/auth/login-button';
import { LogoutButton } from '@/components/auth/logout-button';
import Header from '@/components/structure/Header';
import Image from 'next/image';

import { useCurrentUser } from "@/hooks/use-current-user";

import BackgrounImage from "@/assets/img/strakataturistikabackground.png"

const Home = () => {

    const user = useCurrentUser();

    return (
        <main className="min-h-screen p-8">
            <Header />

            <div className={"grid grid-cols-2 w-full"}>
                <div>
                    <h1 className="text-6xl font-bold mb-4">
                        Strakatá turistika
                    </h1>
                </div>
                <div>
                    <Image src={
                        BackgrounImage
                    } alt="Strakatá turistika" width={600} height={600} />

                </div>
            </div>

        </main>
    );
}

export default Home;