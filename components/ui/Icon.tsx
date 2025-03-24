import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface IconProps extends HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  size?: number;
}

export function Icon({ icon: Icon, size = 24, className, ...props }: IconProps) {
  return (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <Icon size={size} />
    </div>
  );
}