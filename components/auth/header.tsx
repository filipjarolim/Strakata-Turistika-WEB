import Image from "next/image"
import basicInfo from "@/lib/settings/basicInfo"

interface HeaderProps {
    label: string;
}

export const Header = ({ label }: HeaderProps) => {
    return (
        <div className={"w-full flex flex-col gap-y-4 items-start justify-center"}>
            {/*<Image src={basicInfo.img.icons.small} alt={"logo"} width={64} height={64} />*/}
            <p className={"text-[30px] font-medium flex flex-col"}>
                {label}
                <span className={"text-[50px] font-bold mt-[-10px]"}>
                    {basicInfo.name}
                </span>
            </p>
        </div>
    )
}