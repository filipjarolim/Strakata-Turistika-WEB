'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const CompetitionBackground = () => {
    return (
        <div className="fixed inset-0 w-full h-full -z-10 bg-slate-950 overflow-hidden">
            {/* Animated Nature Image */}
            <motion.div
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{
                    scale: 1,
                    opacity: 0.5,
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
                    <Image
                        src="/images/soutezBackground_nature.png"
                        alt="Soutěž pozadí"
                        fill
                        className="object-cover select-none pointer-events-none"
                        priority
                        draggable={false}
                    />
                </motion.div>
            </motion.div>

            {/* Cinematic Overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent" />

            {/* Grain/Texture Overlay for a "painted" feel */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Subtle bottom fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        </div>
    );
};

export default CompetitionBackground;
