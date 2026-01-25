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
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Uživatelský profil</h1>
                    <p className="text-muted-foreground">Spravujte své osobní údaje a nastavení účtu.</p>
                </div>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-3">
                        <TabsTrigger value="overview">Přehled</TabsTrigger>
                        <TabsTrigger value="security">Zabezpečení</TabsTrigger>
                        <TabsTrigger value="settings">Nastavení</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <Card className="overflow-hidden">
                            <div className="bg-muted/50 h-32 relative"></div>
                            <div className="px-6 pb-6">
                                <div className="flex items-end -mt-12 mb-4">
                                    <Avatar className="h-24 w-24 border-4 border-background">
                                        <AvatarImage src={user.image || undefined} alt={user.name || 'Uživatel'} />
                                        <AvatarFallback className="text-2xl">{user.name?.[0] || '-'}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 pt-12">
                                        <h2 className="text-2xl font-bold">{user.name || 'Uživatel'}</h2>
                                        <Badge className="mt-1">{role}</Badge>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-primary" />
                                            <p>{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Role</p>
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="w-4 h-4 text-primary" />
                                            <p>{role}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Způsob přihlášení</p>
                                        <div className="flex items-center gap-2">
                                            <Key className="w-4 h-4 text-primary" />
                                            <p>{user.isOAuth ? 'OAuth (externí poskytovatel)' : 'Heslo'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Dvoufázové ověření</p>
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-primary" />
                                            <p>{user.isTwoFactorEnabled ? 'Povoleno' : 'Zakázáno'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bezpečnost účtu</CardTitle>
                                <CardDescription>
                                    Spravujte bezpečnostní nastavení vašeho účtu.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="space-y-0.5">
                                        <div className="font-medium">Dvoufázové ověření</div>
                                        <div className="text-sm text-muted-foreground">
                                            {user.isTwoFactorEnabled ? 'Aktivní' : 'Neaktivní'}
                                        </div>
                                    </div>
                                    <Link href="/nastaveni">
                                        <Button variant="outline" size="sm">
                                            {user.isTwoFactorEnabled ? 'Vypnout' : 'Zapnout'}
                                        </Button>
                                    </Link>
                                </div>

                                {!user.isOAuth && (
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <div className="font-medium">Změna hesla</div>
                                            <div className="text-sm text-muted-foreground">
                                                Aktualizujte své heslo pro zvýšení bezpečnosti
                                            </div>
                                        </div>
                                        <Link href="/nastaveni">
                                            <Button variant="outline" size="sm">Změnit heslo</Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Nastavení profilu</CardTitle>
                                <CardDescription>
                                    Upravte osobní informace a nastavení vašeho účtu.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <div className="font-medium">Osobní údaje</div>
                                            <div className="text-sm text-muted-foreground">Upravte své jméno a e-mail</div>
                                        </div>
                                        <Link href="/nastaveni">
                                            <Button variant="outline" size="sm">Upravit</Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col items-start gap-2">
                                <div className="text-sm text-muted-foreground">
                                    Pro úpravu všech nastavení přejděte na stránku nastavení.
                                </div>
                                <Link href="/nastaveni">
                                    <Button className="flex items-center gap-2">
                                        <Settings className="w-4 h-4" />
                                        Nastavení
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </CommonPageTemplate>
    )
}

export default Page