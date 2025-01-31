'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function NotificationButton() {
    const [permission, setPermission] = useState(Notification.permission);

    const requestPermission = async () => {
        if (permission === 'default') {
            const result = await Notification.requestPermission();
            setPermission(result);
        }
    };

    const sendNotification = () => {
        if (permission === 'granted') {
            new Notification('Strakatá Turistika', {
                body: 'This is a test notification!',
                icon: '/icons/icon-192x192.png',
            });
        } else {
            alert('Please allow notifications first.');
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            {permission === 'default' && (
                <Button onClick={requestPermission}>
                    Allow Notifications
                </Button>
            )}
            <Button onClick={sendNotification} disabled={permission !== 'granted'}>
                Send Notification
            </Button>
        </div>
    );
}
