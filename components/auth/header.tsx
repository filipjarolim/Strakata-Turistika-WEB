import Image from "next/image"
import basicInfo from "@/lib/settings/basicInfo"

interface HeaderProps {
    label: string;
}

export const Header = ({ label }: HeaderProps) => {
    return (
        <div className={"w-full flex flex-col gap-y-4 items-start justify-center"}>
            <Image src={basicInfo.img} alt={"notes logo"} width={64} height={64} />
            <p className={"text-[24px] font-bold"}>
                {label.replace("**serviceName**", `${basicInfo.name}`)}
            </p>
        </div>
    )
}