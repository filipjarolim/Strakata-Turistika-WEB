'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const CompetitionBackground = () => {
    return (
        <div className="fixed inset-0 w-full h-full -z-10 bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-1000">
            {/* Animated Nature Image Container */}
            <motion.div
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{
                    scale: 1,
                    opacity: 1,
                    transition: { duration: 2, ease: "easeOut" }
                }}
                className="relative w-full h-full"
            >
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        x: [0, 10, 0],
                        y: [0, 5, 0],
                    }}
                    transition={{
                        duration: 60,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="relative w-full h-full"
                >
                    {/* Dark Mode Background */}
                    <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-1000 ease-in-out">
                        <Image
                            src="/images/whimsical_landscape_night.png"
                            alt="Soutěž pozadí noc - Whimsical Landscape"
                            fill
                            className="object-cover select-none pointer-events-none"
                            priority
                            draggable={false}
                        />
                    </div>

                    {/* Light Mode Background */}
                    <div className="absolute inset-0 opacity-100 dark:opacity-0 transition-opacity duration-1000 ease-in-out">
                        <Image
                            src="/images/whimsical_landscape_day.png"
                            alt="Soutěž pozadí den - Whimsical Landscape"
                            fill
                            className="object-cover select-none pointer-events-none"
                            priority
                            draggable={false}
                        />
                    </div>
                </motion.div>
            </motion.div>

            {/* Cinematic Overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-black/80 dark:via-black/40 dark:to-transparent transition-colors duration-1000" />

            {/* Grain/Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Subtle bottom fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent dark:from-slate-950 dark:via-transparent dark:to-transparent opacity-80" />
        </div>
    );
};

export default CompetitionBackground;
