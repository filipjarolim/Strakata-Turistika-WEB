import { FaUser } from "react-icons/fa";
import { ExitIcon } from "@radix-ui/react-icons";
import Image from 'next/image';
import Link from 'next/link';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LogoutButton } from "@/components/auth/logout-button";

import { Button } from "@/components/ui/button";
import { authprefix } from "@/assets/auth";

export const UserButton = () => {
    const user = useCurrentUser();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size={"lg"} className={"rounded-full select-none outline-hidden shadow-none border flex flex-row items-center pr-4 dark:bg-[#111] bg-white text-black font-semibold dark:text-white hover:bg-[#fff] hover:text-[#000] dark:hover:bg-[#000] p-2"}>
                    <Avatar className={"w-[22px] h-[22px] mr-2"}>
                        {user?.image ? (
                            <Image src={user.image} alt="User Image" width={22} height={22} className="rounded-full" />
                        ) : (
                            <AvatarFallback className="bg-sky-500">
                                <FaUser className="text-white" />
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div>
                        {authprefix.buttons.user.label}
                    </div>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>{authprefix.buttons.user.menu.label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    {authprefix.buttons.user.menu.options.map((option) => (
                        <Link href={option.href} key={option.label} >
                            <DropdownMenuItem className={"cursor-pointer"} >

                                {option.icon}
                                <span>{option.label}</span>
                                <DropdownMenuShortcut className={"font-bold"}>{option.shortcut}</DropdownMenuShortcut>
                            </DropdownMenuItem>

                        </Link>
                    ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <LogoutButton>
                        <DropdownMenuItem>
                            <ExitIcon className="h-4 w-4 mr-2" />
                            Logout
                        </DropdownMenuItem>
                    </LogoutButton>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};