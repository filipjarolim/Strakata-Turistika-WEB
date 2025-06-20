import { UserRole } from "@prisma/client";
import * as z from "zod";

export const SettingsSchema = z.object({
    name: z.optional(z.string()),
    dogName: z.optional(z.string()),
    isTwoFactorEnabled: z.optional(z.boolean()),
    role: z.enum([UserRole.ADMIN, UserRole.UZIVATEL, UserRole.TESTER]),
    email: z.optional(z.string().email()),
    password: z.optional(z.string().min(6)),
    newPassword: z.optional(z.string().min(6)),
})
    .refine((data) => {
        return !(data.password && !data.newPassword);

    }, {
        message: "Nové heslo je vyžadováno!",
        path: ["newPassword"]
    })
    .refine((data) => {
        return !(data.newPassword && !data.password);

    }, {
        message: "Heslo je vyžadováno!",
        path: ["password"]
    });

export const LoginSchema = z.object({
    email: z.string().email({
        message: "E-mail je povinný a musí být platná e-mailová adresa"
    }),
    password: z.string().min(1, {
        message: "Heslo je povinné"
    }),
    code: z.optional(z.string())
});

export const ResetSchema = z.object({
    email: z.string().email({
        message: "E-mail je povinný a musí být platná e-mailová adresa"
    })
});

export const NewPasswordSchema = z.object({
    password: z.string().min(6, {
        message: "Minimálně 6 znaků je požadováno"
    })
});

export const RegisterSchema = z.object({
    email: z.string().email({
        message: "E-mail je povinný a musí být platná e-mailová adresa"
    }),
    password: z.string().min(6, {
        message: "Minimálně 6 znaků je požadováno"
    }),
    name: z.string().min(1, {
        message: "Jméno je povinné"
    })
});