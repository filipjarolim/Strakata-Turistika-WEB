'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';
import { AlertTriangle, Trash2, ArrowLeft, Shield, UserX, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSCard } from '@/components/ui/ios/card';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSCircleIcon } from '@/components/ui/ios/circle-icon';

export function DeleteAccountClient() {
  const router = useRouter();
  const user = useCurrentUser();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteAccount = async () => {
    if (!user) return;

    if (confirmEmail !== user.email) {
      setError('Email se neshoduje s vaším účtem');
      return;
    }

    if (confirmText !== 'SMAZAT MŮJ ÚČET') {
      setError('Potvrzovací text se neshoduje');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      // TODO: Implement actual account deletion logic
      // const response = await fetch('/api/user/delete', {
      //   method: 'DELETE',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: user.email, confirmation: confirmText })
      // });

      // if (!response.ok) throw new Error('Deletion failed');
      
      // For now, just redirect with a message
      router.push('/?deleted=true');
    } catch (err) {
      setError('Nastala chyba při mazání účtu. Zkuste to prosím znovu.');
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <IOSCircleIcon variant="red" size="lg">
            <UserX className="h-8 w-8" />
          </IOSCircleIcon>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Smazání účtu</h1>
            <p className="text-lg text-gray-600 mt-2">
              Pro smazání účtu se musíte přihlásit.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-3">
          <IOSCircleIcon variant="red" size="lg">
            <UserX className="h-8 w-8" />
          </IOSCircleIcon>
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Smazání účtu</h1>
          <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
            Tato akce je nevratná a všechna vaše data budou trvale smazána.
          </p>
        </div>
      </motion.div>

      {/* Back button */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <IOSButton
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zpět
        </IOSButton>
      </motion.div>

      {/* Warning Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <IOSCard
          title="Varování"
          subtitle="Tato akce je nevratná"
          icon={<AlertTriangle className="h-6 w-6" />}
          iconBackground="bg-red-100"
          iconColor="text-red-600"
          variant="outlined"
          className="border-red-200 bg-red-50/50"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Smazáním účtu ztratíte všechna svá data včetně tras, fotografií, bodů a dalších informací. 
              Tato akce je nevratná a nemůže být vrácena zpět.
            </p>
            
            <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-gray-200/50">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-600" />
                Co bude smazáno:
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  Váš uživatelský účet a profil
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  Všechny vaše nahrané trasy a GPS data
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  Fotografie a komentáře
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  Body a statistiky
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  Historie aktivit a nastavení
                </li>
              </ul>
            </div>
          </div>
        </IOSCard>
      </motion.div>

      {/* Deletion Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <IOSCard
          title="Potvrzení smazání"
          subtitle="Pro pokračování vyplňte následující údaje"
          icon={<Trash2 className="h-6 w-6" />}
          iconBackground="bg-gray-100"
          iconColor="text-gray-600"
        >
          <div className="space-y-6">
            <IOSTextInput
              label="Potvrďte svůj email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={user.email || ''}
              required
            />

            <IOSTextInput
              label='Napište "SMAZAT MŮJ ÚČET" pro potvrzení'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SMAZAT MŮJ ÚČET"
              required
            />

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl"
                >
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 font-medium">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4 pt-4">
              <IOSButton
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Zrušit
              </IOSButton>
              <IOSButton
                onClick={handleDeleteAccount}
                disabled={isDeleting || !confirmEmail || !confirmText}
                loading={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Smazat účet
              </IOSButton>
            </div>
          </div>
        </IOSCard>
      </motion.div>
    </div>
  );
} 