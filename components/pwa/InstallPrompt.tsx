'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Smartphone } from 'lucide-react'

export default function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream)
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    }, [])

    if (isStandalone) return null

    return (
        <div className="flex flex-col items-center gap-2 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold">Install App</h3>
            <Button>
                <Smartphone className="mr-2" /> Add to Home Screen
            </Button>
            {isIOS && (
                <p className="text-sm text-gray-600">
                    To install this app on your iOS device, tap the share button and then "Add to Home Screen".
                </p>
            )}
        </div>
    )
}
