"use client"

import React from 'react'
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {useCurrentUser} from "@/hooks/use-current-user";

const Footer = () => {
    const currentDate = new Date('2025-01-27T12:31:56')
    const formattedDate = currentDate.toISOString().split('T')[0]
    const formattedTime = currentDate.toTimeString().split(' ')[0]
    const currentYear = currentDate.getFullYear()

    const user = useCurrentUser();



    return (
        <footer className="w-full mt-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Separator />
            <div className="container px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 py-6 gap-6">
                    {/* Left section - Company info */}
                    <div className="flex flex-col space-y-2">
                        <h3 className="font-semibold">Company Name</h3>
                        <p className="text-sm text-muted-foreground">
                            Making technology accessible and enjoyable.
                        </p>
                    </div>

                    {/* Middle section - Navigation */}
                    <nav className="flex flex-col space-y-2">
                        <h3 className="font-semibold">Quick Links</h3>
                        <div className="flex flex-col space-y-2">
                            <Button variant="link" className="text-muted-foreground hover:text-foreground p-0 h-auto">
                                About Us
                            </Button>
                            <Button variant="link" className="text-muted-foreground hover:text-foreground p-0 h-auto">
                                Services
                            </Button>
                            <Button variant="link" className="text-muted-foreground hover:text-foreground p-0 h-auto">
                                Contact
                            </Button>
                            <Button variant="link" className="text-muted-foreground hover:text-foreground p-0 h-auto">
                                Privacy Policy
                            </Button>
                        </div>
                    </nav>

                    {/* Right section - System Info */}
                    <div className="flex flex-col space-y-2">
                        <h3 className="font-semibold">System Info</h3>
                        <div className="text-sm text-muted-foreground">
                            <p>Current User: {user ? user.email : 'Guest'}</p>
                            <p>Date: {formattedDate}</p>
                            <p>Time (UTC): {formattedTime}</p>
                        </div>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="py-4 border-t">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {currentYear} Company Name. All rights reserved.
                        </p>
                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <GithubIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <TwitterIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <LinkedinIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

// Social Icons Components
const GithubIcon = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
)

const TwitterIcon = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
)

const LinkedinIcon = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
)

export default Footer