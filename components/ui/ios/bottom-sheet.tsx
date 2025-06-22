"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const IOSBottomSheet = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
IOSBottomSheet.displayName = "IOSBottomSheet"

const IOSBottomSheetTrigger = DrawerPrimitive.Trigger

const IOSBottomSheetPortal = DrawerPrimitive.Portal

const IOSBottomSheetClose = DrawerPrimitive.Close

const IOSBottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/10 backdrop-blur-sm", className)}
    {...props}
  />
))
IOSBottomSheetOverlay.displayName = DrawerPrimitive.Overlay.displayName

const IOSBottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <IOSBottomSheetPortal>
    <IOSBottomSheetOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[24px] border-t border-gray-200/50 bg-white/80 backdrop-blur-xl",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </DrawerPrimitive.Content>
  </IOSBottomSheetPortal>
))
IOSBottomSheetContent.displayName = "IOSBottomSheetContent"

const IOSBottomSheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 text-center sm:text-left", className)}
    {...props}
  />
)
IOSBottomSheetHeader.displayName = "DrawerHeader"

const IOSBottomSheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
IOSBottomSheetFooter.displayName = "DrawerFooter"

const IOSBottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
IOSBottomSheetTitle.displayName = DrawerPrimitive.Title.displayName

const IOSBottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
IOSBottomSheetDescription.displayName = DrawerPrimitive.Description.displayName

export {
  IOSBottomSheet,
  IOSBottomSheetTrigger,
  IOSBottomSheetContent,
  IOSBottomSheetHeader,
  IOSBottomSheetFooter,
  IOSBottomSheetTitle,
  IOSBottomSheetDescription,
  IOSBottomSheetClose,
  IOSBottomSheetPortal,
} 