import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import News from "@/components/blocks/News";
import { currentUser, currentRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";

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
            <div className="container mx-auto py-8 px-4 animate-fadeIn">
                <Card className="overflow-hidden shadow-lg mb-8">
                    <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600" />
                    <div className="p-8">
                        <h1 className="text-4xl font-bold mb-4">Aktuality</h1>
                        <p className="text-gray-600 text-lg">
                            Sledujte nejnovější informace a události ze světa strakaté turistiky.
                        </p>
                    </div>
                </Card>

                <News />
            </div>
        </CommonPageTemplate>
    );
}
