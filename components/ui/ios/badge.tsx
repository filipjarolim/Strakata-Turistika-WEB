"use client";
import React from "react";
import Image, { StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

interface IOSBadgeProps {
  label: string;
  icon?: string | StaticImageData;
  size?: number; // icon size in px
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
  className?: string;
}

export const IOSBadge = React.forwardRef<HTMLDivElement, IOSBadgeProps>(
  ({
    label,
    icon,
    size = 32,
    bgColor = "bg-blue-200/80",
    borderColor = "border-blue-400/70",
    textColor = "text-blue-900/80",
    className
  }, ref) => {
    // Calculate left padding and icon left position based on size
    const iconLeft = size <= 32 ? 'left-2' : size <= 48 ? 'left-3' : 'left-4';
    // Always leave a gap of 12px after the icon
    const textPaddingLeft = icon ? size /1.8  : 0;

    return (
      <span
        ref={ref}
        className={cn(
          "relative inline-flex items-center align-baseline font-bold",
          "px-6 py-1 min-h-[44px] ml-[24px]",
          "rounded-full border-2",
          "shadow-sm",
          bgColor,
          borderColor,
          textColor,
          className
        )}
        style={{
          borderStyle: 'solid',
          lineHeight: 1.1,
        }}
      >
        {icon && (
          <span
            className={cn(
              "absolute -translate-y-1/2 z-10",
              iconLeft
            )}
            style={{ top: '50%', width: size, height: size }}
            aria-hidden="true"
          >
            <Image
              src={icon}
              alt=""
              width={size}
              height={size}
              className="drop-shadow ml-[-54px]"
              draggable={false}
            />
          </span>
        )}
        <span
          className={cn("pr-1", icon ? "ml-1" : "")}
          style={{
            display: 'inline-block',
            verticalAlign: 'baseline',
            paddingLeft: textPaddingLeft
          }}
        >
          {label}
        </span>
      </span>
    );
  }
);
IOSBadge.displayName = "IOSBadge"; 