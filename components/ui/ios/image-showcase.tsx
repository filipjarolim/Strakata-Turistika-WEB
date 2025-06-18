"use client";
import React from "react";
import Image, { StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

export interface ShowcaseImage {
  url: string | StaticImageData;
  alt?: string;
  title?: string;
}

interface IOSImageShowcaseProps {
  images: ShowcaseImage[];
  layout?: "overlap" | "fan" | "stack" | "diagonal" | "classicOverlap" | "grid" | "carousel" | "list" | "masonry";
  aspectRatio?: "square" | "landscape" | "video";
  className?: string;
  mainWidth?: number;
  mainHeight?: number;
  sideWidth?: number;
  sideHeight?: number;
  sizes?: { width: number; height: number }[];
}

export const IOSImageShowcase: React.FC<IOSImageShowcaseProps> = ({
  images,
  layout = "overlap",
  aspectRatio = "square",
  className,
  mainWidth = 240,
  mainHeight = 320,
  sideWidth = 180,
  sideHeight = 240,
  sizes
}) => {
  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    landscape: "aspect-[16/9]"
  }[aspectRatio];

  // Helper to get per-image size
  const getSize = (idx: number, fallback: { width: number; height: number }) =>
    sizes && sizes[idx] ? sizes[idx] : fallback;

  if (layout === "carousel") {
    // Simple horizontal scroll carousel
    return (
      <div className={cn("w-full overflow-x-auto flex gap-4 py-4", className)}>
        {images.map((img, idx) => (
          <div key={idx} className={cn("relative min-w-[220px] max-w-[320px]", aspectRatioClass)}>
            <Image
              src={img.url}
              alt={img.alt || "Showcase image"}
              fill
              className="object-cover rounded-2xl border border-white/60 shadow-lg"
            />
            {img.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-2xl">
                <p className="text-white text-sm truncate">{img.title}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (layout === "list" || layout === "masonry") {
    // Masonry/list style
    return (
      <div className={cn("flex flex-col gap-6 w-full", className)}>
        {images.map((img, idx) => (
          <div key={idx} className={cn("relative w-full", aspectRatioClass)}>
            <Image
              src={img.url}
              alt={img.alt || "Showcase image"}
              fill
              className="object-cover rounded-2xl border border-white/60 shadow-lg"
            />
            {img.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-2xl">
                <p className="text-white text-sm truncate">{img.title}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // --- Overlay Layouts ---
  if (layout === "fan" && images.length >= 3) {
    // Fan out images in an arc
    const fanAngles = [-20, 0, 20];
    return (
      <div className={cn("relative w-full flex justify-center items-center min-h-[380px] py-8", className)}>
        <div className="relative" style={{ width: 400, height: 320 }}>
          {images.slice(0, 3).map((img, idx) => {
            const { width, height } = getSize(idx, { width: 200, height: 260 });
            return (
              <Image
                key={idx}
                src={img.url}
                alt={img.alt || `Showcase ${idx + 1}`}
                className={cn(
                  "absolute left-1/2 top-1/2 rounded-3xl border border-white/60 shadow-xl",
                  `z-${30 - idx * 10}`
                )}
                width={width}
                height={height}
                style={{
                  transform: `translate(-50%, -50%) rotate(${fanAngles[idx]}deg)`,
                  boxShadow: `0 ${8 + idx * 4}px ${24 + idx * 8}px 0 rgba(0,0,0,0.10)`
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (layout === "stack" && images.length >= 3) {
    // Stack images with rotation and shadow
    const stackOffsets = [0, 20, 40];
    const stackAngles = [-8, 0, 8];
    return (
      <div className={cn("relative w-full flex justify-center items-center min-h-[380px] py-8", className)}>
        <div className="relative" style={{ width: 340, height: 320 }}>
          {images.slice(0, 3).map((img, idx) => {
            const { width, height } = getSize(idx, { width: 200, height: 260 });
            return (
              <Image
                key={idx}
                src={img.url}
                alt={img.alt || `Showcase ${idx + 1}`}
                className={cn(
                  "absolute left-1/2 top-1/2 rounded-3xl border border-white/60 shadow-xl",
                  `z-${30 - idx * 10}`
                )}
                width={width}
                height={height}
                style={{
                  transform: `translate(-50%, -50%) translateY(-${stackOffsets[idx]}px) rotate(${stackAngles[idx]}deg)`,
                  boxShadow: `0 ${8 + idx * 4}px ${24 + idx * 8}px 0 rgba(0,0,0,0.10)`
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (layout === "diagonal" && images.length >= 3) {
    // Diagonal placement
    const positions = [
      { left: 0, top: 40, z: 30 },
      { left: 100, top: 0, z: 20 },
      { left: 200, top: 80, z: 10 }
    ];
    return (
      <div className={cn("relative w-full flex justify-center items-center min-h-[380px] py-8", className)}>
        <div className="relative" style={{ width: 400, height: 320 }}>
          {images.slice(0, 3).map((img, idx) => {
            const { width, height } = getSize(idx, { width: 180, height: 240 });
            return (
              <Image
                key={idx}
                src={img.url}
                alt={img.alt || `Showcase ${idx + 1}`}
                className={cn(
                  "absolute rounded-3xl border border-white/60 shadow-xl",
                  `z-${positions[idx].z}`
                )}
                width={width}
                height={height}
                style={{
                  left: positions[idx].left,
                  top: positions[idx].top,
                  position: 'absolute',
                  boxShadow: `0 ${8 + idx * 4}px ${24 + idx * 8}px 0 rgba(0,0,0,0.10)`
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (layout === "classicOverlap" && images.length >= 3) {
    // Classic overlap, all images centered, different z-index
    return (
      <div className={cn("relative w-full flex justify-center items-center min-h-[380px] py-8", className)}>
        <div className="relative" style={{ width: 340, height: 320 }}>
          {images.slice(0, 3).map((img, idx) => {
            const { width, height } = getSize(idx, { width: 200, height: 260 });
            return (
              <Image
                key={idx}
                src={img.url}
                alt={img.alt || `Showcase ${idx + 1}`}
                className={cn(
                  "absolute left-1/2 top-1/2 rounded-3xl border border-white/60 shadow-xl",
                  `z-${30 - idx * 10}`
                )}
                width={width}
                height={height}
                style={{
                  transform: `translate(-50%, -50%) scale(${1 - idx * 0.1})`,
                  boxShadow: `0 ${8 + idx * 4}px ${24 + idx * 8}px 0 rgba(0,0,0,0.10)`
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // --- Overlap Layout ---
  if (images.length >= 3 && layout === "overlap") {
    return (
      <div className={cn("relative w-full flex justify-center items-center min-h-[380px] py-8", className)}>
        <div className="relative" style={{ width: mainWidth + sideWidth * 2, height: mainHeight + 40 }}>
          <Image
            src={images[1].url}
            alt={images[1].alt || "Showcase 2"}
            className="absolute left-[120px] top-0 rounded-3xl border border-white/60 z-10 shadow-xl scale-110"
            width={mainWidth}
            height={mainHeight}
            style={{ boxShadow: "0 12px 40px 0 rgba(0,0,0,0.13)" }}
          />
          <Image
            src={images[0].url}
            alt={images[0].alt || "Showcase 1"}
            className="absolute left-0 top-8 rounded-3xl border border-white/60 z-30 shadow-2xl"
            width={sideWidth}
            height={sideHeight}
            style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,0.10)" }}
          />
          <Image
            src={images[2].url}
            alt={images[2].alt || "Showcase 3"}
            className="absolute left-[calc(120px+200px)] top-12 rounded-3xl border border-white/60 z-20 shadow-lg"
            width={sideWidth}
            height={sideHeight}
            style={{ boxShadow: "0 6px 24px 0 rgba(0,0,0,0.09)" }}
          />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: mainWidth + sideWidth * 2, height: mainHeight + 40 }}>
          <div className="w-full h-full rounded-[40px] bg-gradient-to-br from-blue-100/40 to-white/0 blur-2xl z-0 pointer-events-none" />
        </div>
      </div>
    );
  }

  // --- Grid Layout ---
  if (layout === "grid") {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6", className)}>
        {images.map((img, idx) => {
          const { width, height } = getSize(idx, { width: 320, height: 320 });
          return (
            <div key={idx} className={cn("relative w-full flex items-center justify-center", aspectRatioClass)}>
              <Image
                src={img.url}
                alt={img.alt || "Showcase image"}
                width={width}
                height={height}
                className="object-cover rounded-2xl border border-white/60 shadow-lg"
                style={{ objectFit: 'cover' }}
              />
              {img.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-2xl">
                  <p className="text-white text-sm truncate">{img.title}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // --- Fallback: simple grid ---
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {images.map((img, idx) => (
        <div key={idx} className={cn("relative w-full", aspectRatioClass)}>
          <Image
            src={img.url}
            alt={img.alt || "Showcase image"}
            fill
            className="object-cover rounded-2xl border border-white/60 shadow-lg"
          />
          {img.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-2xl">
              <p className="text-white text-sm truncate">{img.title}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 