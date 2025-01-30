import React from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import basicInfo from "@/lib/settings/basicInfo";

import {GithubIcon, TwitterIcon, LinkedinIcon} from "@/assets/img/icons"

const Footer = ({
                    user, role
                }: {
    user?: object
    role?: string
}) => {
    const currentDate = new Date("2025-01-27T12:31:56");
    const formattedDate = currentDate.toISOString().split("T")[0];
    const formattedTime = currentDate.toTimeString().split(" ")[0];
    const currentYear = currentDate.getFullYear();

    return (
        <footer className="w-full mt-auto bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
            {/*{*/}
            {/*    JSON.stringify(user)*/}
            {/*}*/}
            {/*{*/}
            {/*    JSON.stringify(role)*/}
            {/*}*/}
            <Separator />
            <div className="container px-4 md:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 py-6 gap-6 text-center sm:text-left">
                    {/* Left section - Company info */}
                    <div className="flex flex-col space-y-2">
                        <h3 className="font-semibold">{basicInfo.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            {basicInfo.description}
                        </p>
                    </div>

                    {/* Middle section - Navigation */}
                    <nav className="flex flex-col space-y-2">
                        <h3 className="font-semibold">Quick Links</h3>
                        <div className="flex flex-col space-y-2">
                            <Button
                                variant="link"
                                className="text-muted-foreground hover:text-foreground p-0 h-auto"
                            >
                                About Us
                            </Button>
                            <Button
                                variant="link"
                                className="text-muted-foreground hover:text-foreground p-0 h-auto"
                            >
                                Services
                            </Button>
                            <Button
                                variant="link"
                                className="text-muted-foreground hover:text-foreground p-0 h-auto"
                            >
                                Contact
                            </Button>
                            <Button
                                variant="link"
                                className="text-muted-foreground hover:text-foreground p-0 h-auto"
                            >
                                Privacy Policy
                            </Button>
                        </div>
                    </nav>

                    {/* Right section - System Info */}
                    <div className="flex flex-col space-y-2">
                        <h3 className="font-semibold">System Info</h3>
                        <div className="text-sm text-muted-foreground">
                            <p>Current User: GUEST</p>
                            <p>Date: {formattedDate}</p>
                            <p>Time (UTC): {formattedTime}</p>
                        </div>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {currentYear} {basicInfo.name}. Všechna práva vyhrazena.
                    </p>
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <GithubIcon className="h-6 w-6" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <TwitterIcon className="h-6 w-6" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <LinkedinIcon className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </footer>
    );
};



export default Footer;
