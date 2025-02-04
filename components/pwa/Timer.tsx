"use client"

import React, { useState, useEffect } from "react";

const Timer = () => {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;

        if (isActive) {
            interval = setInterval(() => {
                setSeconds((prevSeconds) => prevSeconds + 1);
            }, 1000);
        }

        // Cleanup the interval when component unmounts or when `isActive` changes
        return () => clearInterval(interval);
    }, [isActive]);

    const startTimer = () => {
        setIsActive(true);
    };

    return (
        <div>
            <h1>Time Count: {seconds} seconds</h1>
            <button onClick={startTimer} disabled={isActive}>
                Start Counting
            </button>
        </div>
    );
};

export default Timer;