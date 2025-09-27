"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useTransition, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import { SettingsSchema } from "@/schemas";
import { settings } from "@/actions/auth/settings";
import { getUserStats } from "@/actions/auth/getUserStats";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import { UserRole } from "@prisma/client";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";

// iOS Components
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSTextInput } from "@/components/ui/ios/text-input";
import { IOSSelect } from "@/components/ui/ios/select";
import { IOSSwitch } from "@/components/ui/ios/switch";
import { IOSSection } from "@/components/ui/ios/section";
import { IOSStatsCard } from "@/components/ui/ios/stats-card";
import { IOSRecentActivity } from "@/components/ui/ios/recent-activity";
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSCardSkeleton } from "@/components/ui/ios/loading-skeleton";
import { IOSLabel } from "@/components/ui/ios/label";

// Icons
import { 
  Settings,
  User, 
  Mail, 
  Lock, 
  Shield, 
  Dog, 
  Award, 
  MapPin, 
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Activity,
  Info,
  Crown,
  Zap
} from "lucide-react";

// Add interface for user stats
interface UserStats {
  totalVisits: number;
  totalPoints: number;
  averagePoints: number;
  approvedVisits: number;
  pendingVisits: number;
  draftVisits: number;
  rejectedVisits: number;
  visitsByYear: Record<number, { count: number; points: number; approved: number }>;
  recentVisits: Array<{
    id: string;
    routeTitle?: string;
    points: number;
    state: string;
    createdAt?: Date;
    year: number;
  }>;
}

const SettingsPage = () => {
    const user = useCurrentUser();
    const role = useCurrentRole();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

    const [error, setError] = useState<string | undefined>();
    const [success, setSuccess] = useState<string | undefined>();

    const form = useForm<z.infer<typeof SettingsSchema>>({
        resolver: zodResolver(SettingsSchema),
        defaultValues: {
            password: undefined,
            newPassword: undefined,
            name: user?.name || undefined,
      dogName: user?.dogName || undefined,
            email: user?.email || undefined,
            role: (user?.role === 'ADMIN' || user?.role === 'UZIVATEL') ? user.role : undefined,
            isTwoFactorEnabled: user?.isTwoFactorEnabled || undefined,
        }
    });

  // Load user statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await getUserStats();
        if (result.success) {
          // Transform the data to match the expected interface
          const transformedStats: UserStats = {
            ...result.stats,
            recentVisits: result.stats.recentVisits.map(visit => ({
              id: visit.id,
              routeTitle: visit.routeTitle || undefined,
              points: visit.points,
              state: visit.state,
              createdAt: visit.createdAt || undefined,
              year: visit.year
            }))
          };
          setStats(transformedStats);
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      loadStats();
    }
  }, [user]);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      console.log("Current user data:", user); // Debug log
      form.reset({
        password: undefined,
        newPassword: undefined,
        name: user.name || undefined,
        dogName: user.dogName || undefined,
        email: user.email || undefined,
        role: user.role || undefined,
        isTwoFactorEnabled: user.isTwoFactorEnabled || undefined,
      });
    }
  }, [user, form]);

    const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    setError(undefined);
    setSuccess(undefined);
    
    console.log("Submitting values:", values); // Debug log
    
        startTransition(() => {
            settings(values)
                .then((data) => {
                    if (data.error) {
                        setError(data.error);
                    }

                    if (data.success) {
            // Update the session to reflect the changes
                        update();
                        setSuccess(data.success);
            
            // Reset form with new values after a short delay to allow session update
            setTimeout(() => {
              form.reset({
                password: undefined,
                newPassword: undefined,
                name: values.name || user?.name || undefined,
                dogName: values.dogName || user?.dogName || undefined,
                email: values.email || user?.email || undefined,
                role: values.role || user?.role || undefined,
                isTwoFactorEnabled: values.isTwoFactorEnabled !== undefined ? values.isTwoFactorEnabled : user?.isTwoFactorEnabled || undefined,
              });
            }, 100);
          }
        })
        .catch((error) => {
          console.error("Settings error:", error);
          setError("Něco se pokazilo!");
        });
    });
  };

  const roleOptions = [
    { value: UserRole.ADMIN, label: "Administrátor" },
    { value: UserRole.UZIVATEL, label: "Uživatel" },
    { value: UserRole.TESTER, label: "Tester" }
  ];

    return (
    <CommonPageTemplate contents={{ header: true }} currentUser={user} currentRole={role} headerMode="auto-hide">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 p-3 sm:p-4 overflow-visible">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 sm:p-3 rounded-2xl bg-blue-50/80 border border-blue-200/50">
              <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Nastavení</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Spravujte svůj účet a sledujte své výsledky</p>
          </div>
        </div>

        {/* User Statistics */}
        {loadingStats ? (
          <IOSSection title="Statistiky" subtitle="Načítání...">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <IOSCardSkeleton key={index} />
              ))}
            </div>
          </IOSSection>
        ) : stats && (
          <IOSSection title="Vaše statistiky" subtitle="Přehled vašich návštěv a bodů">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <IOSStatsCard
                title="Celkem návštěv"
                value={stats.totalVisits}
                icon={<MapPin className="w-5 h-5" />}
                variant="info"
              />
              <IOSStatsCard
                title="Celkem bodů"
                value={stats.totalPoints}
                icon={<Award className="w-5 h-5" />}
                variant="success"
              />
              <IOSStatsCard
                title="Průměr bodů"
                value={stats.averagePoints}
                subtitle="na návštěvu"
                icon={<TrendingUp className="w-5 h-5" />}
                variant="default"
              />
              <IOSStatsCard
                title="Schválené"
                value={stats.approvedVisits}
                subtitle={`z ${stats.totalVisits}`}
                icon={<CheckCircle className="w-5 h-5" />}
                variant="success"
              />
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 sm:mt-6">
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-amber-100/50">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-amber-900">Čekající</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-amber-900">{stats.pendingVisits}</span>
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-gray-50/80 border border-gray-200/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-gray-100/50">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">Koncepty</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-gray-900">{stats.draftVisits}</span>
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-red-50/80 border border-red-200/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-red-100/50">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-red-900">Zamítnuté</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-red-900">{stats.rejectedVisits}</span>
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-blue-50/80 border border-blue-200/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-blue-100/50">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-blue-900">
                    <span className="hidden sm:inline">Rok {new Date().getFullYear()}</span>
                    <span className="sm:hidden">{new Date().getFullYear()}</span>
                  </span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-blue-900">
                  {stats.visitsByYear[new Date().getFullYear()]?.count || 0}
                </span>
              </div>
            </div>
          </IOSSection>
        )}

        {/* Recent Activity */}
        {loadingStats ? (
          <IOSSection title="Poslední aktivity" subtitle="Načítání...">
            <IOSCardSkeleton />
          </IOSSection>
        ) : stats && (
          <IOSSection title="Poslední aktivity" subtitle="Vaše nedávné návštěvy">
            <IOSRecentActivity visits={stats.recentVisits} />
          </IOSSection>
        )}

        {/* Settings Form */}
        <IOSCard 
          title="Osobní údaje" 
          subtitle="Upravte své základní informace"
          icon={<User className="w-6 h-6" />}
          iconBackground="bg-blue-100"
          iconColor="text-blue-600"
        >
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            {/* Personal Information */}
            <IOSSection title="Osobní údaje">
              <IOSTextInput
                label="Jméno"
                placeholder="Vaše jméno"
                {...form.register("name")}
              />
              
              <IOSTextInput
                label="Jméno psa"
                placeholder="Jméno vašeho psa"
                {...form.register("dogName")}
              />

              <IOSTextInput
                label="Email"
                                                            type="email"
                placeholder="vas@email.cz"
                {...form.register("email")}
                disabled={user?.isOAuth}
              />
            </IOSSection>

            {/* Role Selection */}
            <IOSSection title="Role">
              <IOSSelect
                label="Role v systému"
                value={form.watch("role") || ""}
                onChange={(value) => form.setValue("role", value as UserRole)}
                options={roleOptions}
                placeholder="Vyberte roli"
              />
            </IOSSection>

            {/* Password Section - Only for non-OAuth users */}
            {user?.isOAuth === false && (
              <IOSSection title="Zabezpečení" subtitle="Změňte své heslo">
                <IOSTextInput
                  label="Současné heslo"
                  type="password"
                  placeholder="••••••••"
                  {...form.register("password")}
                />
                
                <IOSTextInput
                  label="Nové heslo"
                                                            type="password"
                  placeholder="••••••••"
                  {...form.register("newPassword")}
                />
              </IOSSection>
            )}

            {/* Two Factor Authentication */}
            {user?.isOAuth === false && (
              <IOSSection title="Dvoufaktorová autentifikace">
                <IOSSwitch
                  label="Povolit 2FA"
                  checked={form.watch("isTwoFactorEnabled") || false}
                  onCheckedChange={(checked) => form.setValue("isTwoFactorEnabled", checked)}
                                                            disabled={isPending}
                                                        />
              </IOSSection>
            )}

            {/* Error and Success Messages */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-100/50">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm text-red-900">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-2xl bg-green-50/80 border border-green-200/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-100/50">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-green-900">{success}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <IOSButton
                type="submit"
                                                disabled={isPending}
                loading={isPending}
                variant="primary"
                size="md"
                className="min-w-[120px] sm:min-w-[140px] h-10 sm:h-12 w-full sm:w-auto"
              >
                <span className="hidden sm:inline">{isPending ? "Ukládám..." : "Uložit změny"}</span>
                <span className="sm:hidden">{isPending ? "Ukládám..." : "Uložit"}</span>
              </IOSButton>
            </div>
          </form>
        </IOSCard>

        {/* Account Info */}
        <IOSCard 
          title="Informace o účtu" 
          subtitle="Detaily vašeho účtu"
          icon={<Info className="w-6 h-6" />}
          iconBackground="bg-gray-100"
          iconColor="text-gray-600"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 backdrop-blur-sm">
              <span className="text-sm font-medium text-gray-600">ID uživatele</span>
              <span className="text-sm text-gray-900 font-mono bg-white/50 px-3 py-1 rounded-lg">{user?.id}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 backdrop-blur-sm">
              <span className="text-sm font-medium text-gray-600">Typ účtu</span>
              <IOSBadge
                label={user?.isOAuth ? "OAuth" : "Email"}
                bgColor={user?.isOAuth ? "bg-blue-100" : "bg-gray-100"}
                textColor={user?.isOAuth ? "text-blue-900" : "text-gray-900"}
              />
                                                </div>
            
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 backdrop-blur-sm">
              <span className="text-sm font-medium text-gray-600">Role</span>
              <IOSBadge
                label={user?.role === 'ADMIN' ? 'Administrátor' : user?.role === 'TESTER' ? 'Tester' : 'Uživatel'}
                bgColor={user?.role === 'ADMIN' ? "bg-red-100" : user?.role === 'TESTER' ? "bg-purple-100" : "bg-blue-100"}
                textColor={user?.role === 'ADMIN' ? "text-red-900" : user?.role === 'TESTER' ? "text-purple-900" : "text-blue-900"}
              />
            </div>
          </div>
        </IOSCard>
                            </div>
        </CommonPageTemplate>
    );
};

export default SettingsPage;