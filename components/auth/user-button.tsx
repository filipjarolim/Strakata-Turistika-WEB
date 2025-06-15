import { FaUser } from "react-icons/fa";
import { ExitIcon } from "@radix-ui/react-icons";
import { Map, Shield, Bug, Settings } from "lucide-react";
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

interface UserButtonProps {
    role?: string;
}
    
export const UserButton = ({ role }: UserButtonProps) => {
    const user = useCurrentUser();

    return (
        <IOSDropdownMenu
            trigger={
                <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 active:bg-white/95 transition-all duration-200 shadow-sm shadow-black/5">
                    <Avatar className="w-7 h-7">
                        {user?.image ? (
                            <Image src={user.image} alt="User Image" width={28} height={28} className="rounded-full" />
                        ) : (
                            <AvatarFallback className="bg-blue-500">
                                <FaUser className="text-white w-3.5 h-3.5" />
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <span className="text-sm font-medium text-gray-900">
                        {authprefix.buttons.user.label}
                    </span>
                </button>
            }
        >
            <IOSDropdownMenuLabel>{authprefix.buttons.user.menu.label}</IOSDropdownMenuLabel>
            <IOSDropdownMenuSeparator />
            
            {/* Default Menu Options */}
            {authprefix.buttons.user.menu.options.map((option) => (
                <Link href={option.href} key={option.label}>
                    <IOSDropdownMenuItem
                        icon={option.icon}
                        shortcut={option.shortcut}
                    >
                        {option.label}
                    </IOSDropdownMenuItem>
                </Link>
            ))}

            <IOSDropdownMenuSeparator />
            
            {/* My Routes */}
            <Link href="/vysledky/moje">
                <IOSDropdownMenuItem icon={<Map className="h-3.5 w-3.5" />}>
                    Moje trasy
                </IOSDropdownMenuItem>
            </Link>

            {/* Admin Routes */}
            {role === "ADMIN" && (
                <Link href="/admin">
                    <IOSDropdownMenuItem icon={<Shield className="h-3.5 w-3.5" />}>
                        Administrace
                    </IOSDropdownMenuItem>
                </Link>
            )}

            {/* Tester Routes */}
            {role === "TESTER" && (
                <Link href="/tester">
                    <IOSDropdownMenuItem icon={<Settings className="h-3.5 w-3.5" />}>
                        Testování
                    </IOSDropdownMenuItem>
                </Link>
            )}
            
            <IOSDropdownMenuSeparator />
            <LogoutButton>
                <IOSDropdownMenuItem icon={<ExitIcon className="h-3.5 w-3.5" />}>
                    Logout
                </IOSDropdownMenuItem>
            </LogoutButton>
        </IOSDropdownMenu>
    );
};