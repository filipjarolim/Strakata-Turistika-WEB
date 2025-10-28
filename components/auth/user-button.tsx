import { FaUser } from "react-icons/fa";
import { ExitIcon } from "@radix-ui/react-icons";
import { Map, Shield, Bug, Settings, ChevronDown } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';

import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LogoutButton } from "@/components/auth/logout-button";
import { authprefix } from "@/assets/auth";
import { 
    IOSDropdownMenu, 
    IOSDropdownMenuItem, 
    IOSDropdownMenuLabel, 
    IOSDropdownMenuSeparator 
} from "@/components/ui/ios/dropdown-menu";
import { ExtendedUser } from "@/next-auth";
import { cn } from "@/lib/utils";

interface UserButtonProps {
    role?: string;
    textColor?: string;
}
    
export const UserButton = ({ role, textColor = "text-gray-900" }: UserButtonProps) => {
    const user = useCurrentUser();

    // Dynamic background styling based on dark/light mode
    const getButtonBackground = () => "bg-gray-900/10 backdrop-blur-xl border-gray-900/20 hover:bg-gray-900/20 hover:border-gray-900/30";

    // Dynamic avatar ring styling
    const getAvatarRing = () => "ring-2 ring-gray-900/20 group-hover:ring-gray-900/30";

    return (
        <IOSDropdownMenu
            trigger={
                <button className={cn(
                    "group flex items-center gap-3 px-4 py-2.5 rounded-2xl",
                    "backdrop-blur-xl transition-all duration-200 ease-out",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    "shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2",
                    getButtonBackground(),
                    textColor
                )}>
                    <Avatar className={cn("w-8 h-8 transition-all duration-200", getAvatarRing())}>
                        {user?.image ? (
                            <Image src={user.image} alt="User Image" width={32} height={32} className="rounded-full" />
                        ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                                <FaUser className="text-white w-4 h-4" />
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="flex flex-col items-start">
                        <span className={cn("text-sm font-semibold leading-tight", textColor)}>
                            {authprefix.buttons.user.label}
                        </span>
                        <span className={cn("text-xs opacity-70 leading-tight", textColor)}>
                            {role === "ADMIN" ? "Administrátor" : role === "TESTER" ? "Tester" : "Uživatel"}
                        </span>
                    </div>
                    <ChevronDown className={cn(
                        "w-4 h-4 opacity-60 group-hover:opacity-80 transition-all duration-200",
                        "group-data-[state=open]:rotate-180",
                        textColor
                    )} />
                </button>
            }
        >
            <IOSDropdownMenuLabel>
                <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                        {user?.image ? (
                            <Image src={user.image} alt="User Image" width={32} height={32} className="rounded-full" />
                        ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                                <FaUser className="text-white w-4 h-4" />
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                            {user?.name || "Uživatel"}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                            {user?.email || "uživatel@example.com"}
                        </span>
                    </div>
                </div>
            </IOSDropdownMenuLabel>
            <IOSDropdownMenuSeparator />
            
            {/* Default Menu Options */}
            {authprefix.buttons.user.menu.options.map((option) => (
                <Link href={option.href} key={option.label}>
                    <IOSDropdownMenuItem
                        icon={option.icon}
                        className="px-3 py-2.5"
                    >
                        {option.label}
                    </IOSDropdownMenuItem>
                </Link>
            ))}

            <IOSDropdownMenuSeparator />
            
            {/* My Routes */}
            <Link href="/vysledky/moje">
                <IOSDropdownMenuItem 
                    icon={<Map className="h-4 w-4" />}
                    className="px-3 py-2.5"
                >
                    Moje trasy
                </IOSDropdownMenuItem>
            </Link>

            {/* Admin Routes */}
            {role === "ADMIN" && (
                <Link href="/admin">
                    <IOSDropdownMenuItem 
                        icon={<Shield className="h-4 w-4" />}
                        className="px-3 py-2.5"
                    >
                        Administrace
                    </IOSDropdownMenuItem>
                </Link>
            )}
            
            <IOSDropdownMenuSeparator />
            <LogoutButton>
                <IOSDropdownMenuItem 
                    icon={<ExitIcon className="h-4 w-4" />}
                    className="px-3 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    Odhlásit se
                </IOSDropdownMenuItem>
            </LogoutButton>
        </IOSDropdownMenu>
    );
};