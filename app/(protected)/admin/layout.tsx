import { Metadata } from "next";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
    title: "Admin Dashboard",
    description: "Správa aplikace",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset className="bg-white dark:bg-[#050505] transition-colors duration-300 overflow-hidden">
                {/* Background elements for premium feel (inside inset so they don't cover sidebar) */}
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[120px] opacity-50" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 dark:bg-purple-600/10 blur-[120px] opacity-50" />
                    <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-cyan-500/5 dark:bg-cyan-600/5 blur-[100px] opacity-50" />
                </div>

                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md px-4 sticky top-0 z-20">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <span className="font-medium text-sm text-gray-500">Administrace</span>
                </header>

                <div className="relative z-10 w-full p-4 overflow-x-hidden">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
