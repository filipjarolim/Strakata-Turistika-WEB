import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import News from "@/components/blocks/News";
import { currentUser, currentRole } from "@/lib/auth";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import { Newspaper, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AktualityPage() {
    const user = await currentUser();
    const role = await currentRole();

    return (
        <CommonPageTemplate 
            contents={{header: true}}
            headerMode="auto-hide"
            currentUser={user}
            currentRole={role}
        >
            <div className="w-full">
                {/* Header Section */}
                <div className="p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            <IOSCircleIcon variant="blue" size="lg" className="shadow-lg">
                                <Newspaper className="w-8 h-8" />
                            </IOSCircleIcon>
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">Aktuality</h1>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1">Sledujte nejnovější zprávy a události</p>
                            </div>
                        </div>
                        
                        {/* Admin Actions */}
                        {role === "ADMIN" && (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Link href="/admin/News">
                                    <Button variant="outline" className="flex items-center gap-2 flex-1 sm:flex-none" size="sm">
                                        <Settings className="h-4 w-4" />
                                        <span className="hidden sm:inline">Správa</span>
                                        <span className="sm:hidden">Admin</span>
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* News Content - Full Width */}
                <div className="w-full">
                    <News standalone />
                </div>
            </div>
        </CommonPageTemplate>
    );
}
