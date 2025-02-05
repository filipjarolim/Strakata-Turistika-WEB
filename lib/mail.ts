import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// Helper function to get the appropriate base URL
const getBaseUrl = () => {
    return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
}

export const sendTwoFactorTokenEmail = async (
    email: string,
    token: string
) => {
    await resend.emails.send({
        from: "strakataturistika@resend.dev",
        to: email,
        subject: "2FA Kód",
        html: `<p>Váš 2FA kód: ${token}</p>`
    })
}

export const sendPasswordResetEmail = async (
    email: string,
    token: string
) => {
    const resetLink = `${getBaseUrl()}/auth/new-password?token=${token}`

    await resend.emails.send({
        from: "strakataturistika@resend.dev",
        to: email,
        subject: "Obnovte své heslo",
        html: `<p>Klikněte <a href="${resetLink}" >zde</a> pro obnovení hesla.</p>`
    })
}

export const sendVerificationEmail = async (
    email: string,
    token: string
) => {
    const confirmLink = `${getBaseUrl()}/auth/new-verification?token=${token}`

    await resend.emails.send({
        from: "strakataturistika@resend.dev",
        to: email,
        subject: "Potvrďte svůj email",
        html: `<p>Klikněte <a href="${confirmLink}" >zde</a> pro potvrzení emailu.</p>`
    })
}