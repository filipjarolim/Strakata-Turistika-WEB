import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { currentUser, currentRole } from "@/lib/auth";
import Image from 'next/image';

export default async function ExamplesPage() {
    const user = await currentUser();
    const role = await currentRole();

    return (
        <CommonPageTemplate 
            contents={{header: true}} 
            headerMode="auto-hide"
            currentUser={user}
            currentRole={role}
        >
            <div className="min-h-screen bg-gray-50">
                <div className="px-8 py-16 animate-fadeIn animation-delay-400">
                    <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Grid-Based Design Variants</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        
                        {/* Card 1 - Original Grid Based */}
                        <div className="bg-white p-4 rounded-2xl">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-xl">
                                    <Image
                                        src="/images/mainBackground.png"
                                        alt="Design 1"
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">2024</span>
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Design</span>
                                    </div>
                                    <h3 className="text-lg font-bold">Original Grid</h3>
                                    <p className="text-sm text-gray-600">Classic 2-column layout with full-width button.</p>
                                </div>
                            </div>
                            <button className="w-full bg-black text-white py-2 text-sm rounded-lg">Action</button>
                        </div>

                        {/* Card 2 - Grid with Small Button */}
                        <div className="bg-white p-4 rounded-2xl">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-xl">
                                    <Image
                                        src="/images/mainBackground.png"
                                        alt="Design 2"
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                </div>
                                <div className="flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">New</span>
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">UI</span>
                                        </div>
                                        <h3 className="text-lg font-bold">Small Button</h3>
                                        <p className="text-sm text-gray-600">Compact button within content area.</p>
                                    </div>
                                    <button className="bg-black text-white px-3 py-1 text-xs rounded-lg self-start">View</button>
                                </div>
                            </div>
                        </div>

                        {/* Card 3 - Grid with Icon Button */}
                        <div className="bg-white p-4 rounded-2xl">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-xl">
                                    <Image
                                        src="/images/mainBackground.png"
                                        alt="Design 3"
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                </div>
                                <div className="flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Featured</span>
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Hot</span>
                                        </div>
                                        <h3 className="text-lg font-bold">Icon Button</h3>
                                        <p className="text-sm text-gray-600">Minimal icon-only button design.</p>
                                    </div>
                                    <button className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center text-xs">→</button>
                                </div>
                            </div>
                        </div>

                        {/* Card 4 - Grid with Outline Button */}
                        <div className="bg-white p-4 rounded-2xl">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-xl">
                                    <Image
                                        src="/images/mainBackground.png"
                                        alt="Design 4"
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Urgent</span>
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Update</span>
                                    </div>
                                    <h3 className="text-lg font-bold">Outline Button</h3>
                                    <p className="text-sm text-gray-600">Subtle border button style.</p>
                                </div>
                            </div>
                            <button className="w-full border-2 border-black text-black py-2 text-sm rounded-lg hover:bg-black hover:text-white transition-colors">Learn More</button>
                        </div>

                        {/* Card 5 - Grid with Split Button */}
                        <div className="bg-white p-4 rounded-2xl">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-xl">
                                    <Image
                                        src="/images/mainBackground.png"
                                        alt="Design 5"
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Beta</span>
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Tech</span>
                                    </div>
                                    <h3 className="text-lg font-bold">Split Button</h3>
                                    <p className="text-sm text-gray-600">Button split into two sections.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <button className="bg-black text-white py-2 text-xs rounded-l-lg">Primary</button>
                                <button className="bg-gray-200 text-black py-2 text-xs rounded-r-lg">Secondary</button>
                            </div>
                        </div>

                        {/* Card 6 - Grid with Pill Button */}
                        <div className="bg-white p-4 rounded-2xl">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-xl">
                                    <Image
                                        src="/images/mainBackground.png"
                                        alt="Design 6"
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Live</span>
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Trending</span>
                                    </div>
                                    <h3 className="text-lg font-bold">Pill Button</h3>
                                    <p className="text-sm text-gray-600">Rounded pill-shaped button.</p>
                                </div>
                            </div>
                            <button className="w-full bg-black text-white py-2 text-sm rounded-full">Get Started</button>
                        </div>

                        {/* Card 7 - Grid with Text Button */}
                        <div className="bg-white p-4 rounded-2xl">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-xl">
                                    <Image
                                        src="/images/mainBackground.png"
                                        alt="Design 7"
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Premium</span>
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Guide</span>
                                    </div>
                                    <h3 className="text-lg font-bold">Text Button</h3>
                                    <p className="text-sm text-gray-600">Minimal text-only button.</p>
                                </div>
                            </div>
                            <button className="w-full text-black py-2 text-sm underline hover:no-underline">Read More →</button>
                        </div>

                        {/* Card 8 - Grid with Badge Button */}
                        <div className="bg-white p-4 rounded-2xl">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-xl">
                                    <Image
                                        src="/images/mainBackground.png"
                                        alt="Design 8"
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Updated</span>
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">News</span>
                                    </div>
                                    <h3 className="text-lg font-bold">Badge Button</h3>
                                    <p className="text-sm text-gray-600">Small badge-style button.</p>
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <button className="bg-black text-white px-4 py-1 text-xs rounded-full">NEW</button>
                            </div>
                        </div>

                        {/* Card 9 - Grid with Corner Button */}
                        <div className="bg-white p-4 rounded-2xl">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-xl">
                                    <Image
                                        src="/images/mainBackground.png"
                                        alt="Design 9"
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                </div>
                                <div className="flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Popular</span>
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Tip</span>
                                        </div>
                                        <h3 className="text-lg font-bold">Corner Button</h3>
                                        <p className="text-sm text-gray-600">Button positioned in corner.</p>
                                    </div>
                                    <div className="flex justify-end">
                                        <button className="bg-black text-white px-3 py-1 text-xs rounded-lg">→</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 10 - Grid with Dual Buttons */}
                        <div className="bg-white p-4 rounded-2xl">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-xl">
                                    <Image
                                        src="/images/mainBackground.png"
                                        alt="Design 10"
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Limited</span>
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Offer</span>
                                    </div>
                                    <h3 className="text-lg font-bold">Dual Buttons</h3>
                                    <p className="text-sm text-gray-600">Two buttons side by side.</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 bg-black text-white py-2 text-sm rounded-lg">Primary</button>
                                <button className="flex-1 border border-black text-black py-2 text-sm rounded-lg">Secondary</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CommonPageTemplate>
    );
} 