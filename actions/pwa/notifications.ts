'use server'

import webpush from 'web-push'

webpush.setVapidDetails(
    'mailto:jarolimfilip07@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
)

let subscription: webpush.PushSubscription | null = null

export async function subscribeUser(sub: PushSubscription) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    subscription = sub
    return { success: true }
}

export async function unsubscribeUser() {
    subscription = null
    return { success: true }
}

// actions/sendNotification.ts
export async function sendNotification(message: string) {
    if (!subscription) {
        throw new Error('No subscription available')
    }

    try {
        await webpush.sendNotification(
            subscription,
            JSON.stringify({
                title: 'Test Notification',
                body: message,
                icon: '/icons/icon-192x192.png',
            })
        )
        return { success: true }
    } catch (error) {
        console.error('Error sending push notification:', error)
        return { success: false, error: 'Failed to send notification' }
    }
}

