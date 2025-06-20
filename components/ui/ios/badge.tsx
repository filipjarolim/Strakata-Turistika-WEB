"use client";
import React from "react";
import Image, { StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

export interface IOSBadgeProps {
  label: string;
  icon?: React.ReactNode | string | StaticImageData;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  specialStyle?: {
    iconSize?: number;
    iconLeft?: string;
    textPaddingLeft?: number;
  };
}

export const IOSBadge = ({
  label,
  icon,
  bgColor = 'bg-gray-100',
  textColor = 'text-gray-900',
  borderColor = 'border-gray-200',
  size = 'md',
  className,
  onClick,
  specialStyle
}: IOSBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  // If specialStyle is provided, render the special badge design
  if (specialStyle) {
    const iconSize = specialStyle.iconSize || 32;
    const iconLeft = specialStyle.iconLeft || (iconSize <= 32 ? 'left-2' : iconSize <= 48 ? 'left-3' : 'left-4');
    const textPaddingLeft = specialStyle.textPaddingLeft || (icon ? iconSize / 1.8 : 0);

    // Handle icon as string/StaticImageData for special style
    const renderIcon = () => {
      if (typeof icon === 'string' || (icon && typeof icon === 'object' && 'src' in icon)) {
        return (
          <Image
            src={icon as string | StaticImageData}
            alt=""
            width={iconSize}
            height={iconSize}
            className="drop-shadow ml-[-54px]"
            draggable={false}
          />
        );
      }
      return icon;
    };

    return (
      <span
        onClick={onClick}
        className={cn(
          "relative inline-flex items-center align-baseline font-bold",
          "px-6 py-1 min-h-[44px] ml-[24px]",
          "rounded-full border-2",
          "shadow-sm",
          bgColor,
          borderColor,
          textColor,
          onClick && 'cursor-pointer',
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
            style={{ top: '50%', width: iconSize, height: iconSize }}
            aria-hidden="true"
          >
            {renderIcon()}
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

  // Default badge style
  return (
    <div
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border',
        'font-medium backdrop-blur-sm',
        sizeClasses[size],
        bgColor,
        textColor,
        borderColor,
        onClick && 'cursor-pointer',
        className
      )}
    >
      {typeof icon === 'string' || (icon && typeof icon === 'object' && 'src' in icon) ? (
        <Image
          src={icon as string | StaticImageData}
          alt=""
          width={20}
          height={20}
          className="w-5 h-5"
        />
      ) : (
        icon
      )}
      <span>{label}</span>
    </div>
  );
};
IOSBadge.displayName = "IOSBadge"; 