import CommonPageTemplate from '@/components/structure/CommonPageTemplate'
import React from 'react'
import { currentRole, currentUser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Mail, User as UserIcon, Settings, Key, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import DashboardClient from './dashboard-client'
import ProfileSettings from './profile-settings'

const Page = async () => {
    const user = await currentUser()
    const role = await currentRole()

    // Handle when user is undefined
    if (!user) {
        return (
            <CommonPageTemplate contents={{ header: true }} currentUser={user} currentRole={role}>
                <p className="text-sm text-muted-foreground">Uživatelská data nejsou k dispozici.</p>
            </CommonPageTemplate>
        )
    }

    return (
        <CommonPageTemplate contents={{ header: true }} currentUser={user} currentRole={role}>
            <div className="max-w-[90%] mx-auto">
                <div className="mb-8 space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Uživatelský profil</h1>
                    <p className="text-muted-foreground">Spravujte své osobní údaje a nastavení účtu.</p>
                </div>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="w-full sm:w-auto grid grid-cols-2">
                        <TabsTrigger value="overview">Přehled</TabsTrigger>
                        <TabsTrigger value="settings">Nastavení</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-6">
                        <DashboardClient user={user} />
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-6">
                        <ProfileSettings />
                    </TabsContent>
                </Tabs>
            </div>
        </CommonPageTemplate>
    )
}

export default Page