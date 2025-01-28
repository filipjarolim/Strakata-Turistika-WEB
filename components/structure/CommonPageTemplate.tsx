import React from "react";
import Header from "@/components/structure/Header";
import Footer from "@/components/structure/Footer";

const CommonPageTemplate = ({
                                children,
                                contents,
                            }: {
    children: React.ReactNode;
    contents: { complete?: boolean; header?: boolean; footer?: boolean };
}) => {
    return (
        <main className="min-h-screen p-4 sm:p-6 flex flex-col items-start justify-start">
            {(contents.complete || contents.header) && <Header />}
            {children}
            {(contents.complete || contents.footer) && <Footer />}
        </main>
    );
};

export default CommonPageTemplate;
