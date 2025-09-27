import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import News from "@/components/blocks/News";
import { currentUser, currentRole } from "@/lib/auth";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import { Newspaper } from "lucide-react";

export default async function AktualityPage() {
    const user = await currentUser();
    const role = await currentRole();

    return (
        <CommonPageTemplate 
            contents={{header: true}}
            headerMode="fixed"
            currentUser={user}
            currentRole={role}
            showHeaderGap={false} // disables the header gap so blue goes behind header
        >
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 to-indigo-100/60" />
                    <div className="relative max-w-4xl mx-auto px-3 sm:px-4 md:px-8 pt-12 sm:pt-16 pb-8 sm:pb-10 flex flex-col items-center">
                        <IOSCircleIcon variant="blue" size="lg" className="mb-4 sm:mb-6 shadow-lg">
                            <Newspaper className="w-8 h-8 sm:w-10 sm:h-10" />
                        </IOSCircleIcon>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 text-center mb-3 sm:mb-4 drop-shadow-sm">
                            Aktuality
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed text-center px-2">
                            Sledujte nejnovější zprávy a události ze světa Strakaté turistiky.
                            <br className="hidden sm:block" />
                            <span className="block sm:inline"> Zůstaňte informováni o soutěžích, novinkách a zajímavostech.</span>
                        </p>
                    </div>
                </div>

                {/* News Content */}
                <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-0 pb-16 sm:pb-24">
                    <News standalone />
                </div>
            </div>
        </CommonPageTemplate>
    );
}
