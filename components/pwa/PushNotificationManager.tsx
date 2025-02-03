'use client'

import { useState, useEffect } from 'react'
import { subscribeUser, unsubscribeUser, sendNotification } from '@/actions/pwa/notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, BellOff, Send } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)))
}

export default function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [message, setMessage] = useState('')

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()
        }
    }, [])

    async function registerServiceWorker() {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        const sub = await registration.pushManager.getSubscription()
        setSubscription(sub)
    }

    async function subscribeToPush() {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
        })
        setSubscription(sub)
        await subscribeUser(JSON.parse(JSON.stringify(sub)))
    }

    async function unsubscribeFromPush() {
        await subscription?.unsubscribe()
        setSubscription(null)
        await unsubscribeUser()
    }

    async function sendTestNotification() {
        await sendNotification(message)
        setMessage('')
    }

    if (!isSupported) return <p>Push notifications are not supported in this browser.</p>

    return (
        <Card>
            <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
            </CardHeader>
            <CardContent>
                {subscription ? (
                    <>
                        <p>You are subscribed to push notifications.</p>
                        <Button variant="destructive" onClick={unsubscribeFromPush}>
                            <BellOff className="mr-2" /> Unsubscribe
                        </Button>
                        <Input
                            type="text"
                            placeholder="Enter notification message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <Button onClick={sendTestNotification}>
                            <Send className="mr-2" /> Send Test
                        </Button>
                    </>
                ) : (
                    <>
                        <p>You are not subscribed to push notifications.</p>
                        <Button onClick={subscribeToPush}>
                            <Bell className="mr-2" /> Subscribe
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
