'use client';
import { useEffect } from 'react';
import { registerServiceWorker } from '@/utils/serviceWorker';

const ServiceWorkerRegister = () => {
    useEffect(() => {
        registerServiceWorker();
    }, []);

    return null;
};

export default ServiceWorkerRegister;