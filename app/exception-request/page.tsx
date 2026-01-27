'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import CompetitionBackground from '@/components/ui/competition/CompetitionBackground';

export default function ExceptionRequestPage() {
    const { data: session } = useSession();
    const router = useRouter();

    const [reason, setReason] = useState('');
    const [requestedMinDistance, setRequestedMinDistance] = useState(1.5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/exception-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason,
                    requestedMinDistance,
                    userId: session.user.id
                })
            });

            if (!res.ok) throw new Error('Failed to submit request');

            setSuccess(true);
        } catch (err) {
            setError('Nepodařilo se odeslat žádost. Zkuste to prosím později.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 relative">
                <CompetitionBackground />
                <Card className="max-w-md w-full bg-white/10 backdrop-blur-md border-white/20 text-white">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <CardTitle className="text-center">Žádost odeslána</CardTitle>
                        <CardDescription className="text-center text-white/60">
                            Vaše žádost o výjimku byla úspěšně odeslána a bude posouzena administrátory.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full bg-white text-black hover:bg-white/90"
                            onClick={() => router.push('/soutez')}
                        >
                            Zpět do soutěže
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 relative">
            <CompetitionBackground />

            <div className="max-w-2xl mx-auto pt-10">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-8 text-white/60 hover:text-white pl-0 hover:bg-transparent"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zpět
                </Button>

                <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                    <CardHeader>
                        <CardTitle className="text-2xl">Žádost o výjimku z pravidel</CardTitle>
                        <CardDescription className="text-white/60">
                            Standardní minimální délka trasy je 3 km. Pokud máte zdravotní nebo jiné omezení, můžete požádat o snížení tohoto limitu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-200">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="reason" className="text-white">Důvod žádosti o výjimku</Label>
                                <Textarea
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Popište, proč potřebujete výjimku..."
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 min-h-[100px]"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="distance" className="text-white">Požadovaná minimální délka (km)</Label>
                                <Input
                                    id="distance"
                                    type="number"
                                    min={0.5}
                                    max={2.9}
                                    step={0.1}
                                    value={requestedMinDistance}
                                    onChange={(e) => setRequestedMinDistance(parseFloat(e.target.value))}
                                    className="bg-white/5 border-white/10 text-white"
                                    required
                                />
                                <p className="text-xs text-white/40">
                                    Standardní limit je 3.0 km.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
                            >
                                {isSubmitting ? 'Odesílání...' : 'Odeslat žádost'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
