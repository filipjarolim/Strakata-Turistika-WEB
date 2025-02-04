"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

const Timer = () => {
    const [seconds, setSeconds] = useState(0)
    const [isActive, setIsActive] = useState(false)

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;

        if (isActive) {
            interval = setInterval(() => {
                setSeconds((prevSeconds) => prevSeconds + 1)
            }, 1000)
        }

        return () => clearInterval(interval)
    }, [isActive])

    const startTimer = () => setIsActive(true)

    const stopTimer = () => setIsActive(false)

    const resetTimer = () => {
        setSeconds(0)
        setIsActive(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Timer</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-2">
                        <Clock className="w-6 h-6 text-blue-500" />
                        <h1 className="text-xl">Time Count: {seconds} seconds</h1>
                    </div>
                    <div className="mt-4 flex space-x-2">
                        <Button onClick={startTimer} variant="default" disabled={isActive}>
                            Start
                        </Button>
                        <Button onClick={stopTimer} variant="secondary" disabled={!isActive}>
                            Stop
                        </Button>
                        <Button onClick={resetTimer} variant="destructive">
                            Reset
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default Timer