"use client"

import React, {useState} from 'react'

import {AnimatePresence, motion} from "framer-motion";
import {Card, CardContent} from "@/components/ui/card";
import {Heart, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {GithubIcon} from "@/assets/img/icons"

const SupportMePopup = () => {
    const [isPopupVisible, setPopupVisible] = useState(true);

    return (
        <AnimatePresence>
            {isPopupVisible && (
                <motion.div
                    className="fixed bottom-4 right-4 w-80 z-50"
                    initial={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    exit={{ opacity: 0, translateY: 20 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="shadow-xl border border-gray-200 bg-gray-50">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-3">
                                <GithubIcon className="text-gray-700 h-6 w-6" />
                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        Support us on{" "}
                                        <a
                                            href="https://github.com/Fiilipes"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 underline hover:text-blue-800"
                                        >
                                            GitHub
                                        </a>
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        Your contribution helps us grow! <Heart className="inline " size={12} />
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPopupVisible(false)}
                                className="p-0"
                            >
                                <X size={18} className="text-gray-500 hover:text-gray-700" />
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
export default SupportMePopup
