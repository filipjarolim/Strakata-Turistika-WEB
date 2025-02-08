import CommonPageTemplate from '@/components/structure/CommonPageTemplate'
import React from 'react'
import { currentRole, currentUser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Mail, User as UserIcon } from 'lucide-react'

const Page = async () => {
    const user = await currentUser()
    const role = await currentRole()

    // Handle when user is undefined
    if (!user) {
        return (
            <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role}>
                <p className="text-sm text-muted-foreground">Uživatelská data nejsou k dispozici.</p>
            </CommonPageTemplate>
        )
    }

    return (
        <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role}>
            <div className="space-y-4">
                {/* Card Component */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Avatar>
                                <AvatarImage src={user.image || undefined} alt={user.name || 'Uživatel'} />
                                <AvatarFallback>{user.name?.[0] || '-'}</AvatarFallback>
                            </Avatar>
                            {user.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span>E-mail: {user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-muted-foreground" />
                                <Badge>Role: {role}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                                <span>{user.isTwoFactorEnabled ? 'Dvoufázové ověření: Povolené' : 'Dvoufázové ověření: Zakázané'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">OAuth:</span>
                                <Badge variant="outline">
                                    {user.isOAuth ? 'Povoleno' : 'Zakázáno'}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </CommonPageTemplate>
    )
}

export default Page