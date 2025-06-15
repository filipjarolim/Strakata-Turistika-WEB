import { useEffect, useState } from 'react';

// Helper to convert [r,g,b] to rgb string
function rgbToString([r, g, b]: number[]) {
  return `rgb(${r},${g},${b})`;
}

// Euclidean distance between two colors
function colorDistance(a: number[], b: number[]) {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2) +
    Math.pow(a[2] - b[2], 2)
  );
}

// Improved function to get two distinct, non-dark, non-gray dominant colors
function getDominantColors(imageData: Uint8ClampedArray, width: number, height: number): [string, string] {
  const vibrantPixels: number[][] = [];
  for (let i = 0; i < imageData.length; i += 4 * 10) { // sample every 10th pixel
    const idx = i;
    const red = imageData[idx];
    const green = imageData[idx + 1];
    const blue = imageData[idx + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const brightness = (red + green + blue) / 3;
    if (max - min < 40) continue; // skip low colorfulness (grayish)
    if (brightness < 120) continue; // skip dark
    if (red < 60 || green < 60 || blue < 60) continue; // skip dark channels
    vibrantPixels.push([red, green, blue]);
  }
  // If no vibrant pixels, fallback to all pixels
  if (vibrantPixels.length === 0) {
    for (let i = 0; i < imageData.length; i += 4 * 10) {
      const idx = i;
      const red = imageData[idx];
      const green = imageData[idx + 1];
      const blue = imageData[idx + 2];
      vibrantPixels.push([red, green, blue]);
    }
  }
  // If still nothing, fallback to light gray
  if (vibrantPixels.length === 0) {
    return ["rgb(220,220,220)", "rgb(240,240,240)"];
  }
  // Find the most common color (mode)
  const colorMap: Record<string, { color: number[]; count: number }> = {};
  for (const c of vibrantPixels) {
    const key = c.map(x => Math.round(x / 16) * 16).join(","); // quantize
    if (!colorMap[key]) colorMap[key] = { color: c, count: 0 };
    colorMap[key].count++;
  }
  const sortedColors = Object.values(colorMap).sort((a, b) => b.count - a.count);
  const mainColor = sortedColors[0]?.color || vibrantPixels[0];
  // Find the most different color from mainColor
  let maxDist = -1;
  let secondColor = mainColor;
  for (const c of sortedColors) {
    const dist = colorDistance(mainColor, c.color);
    if (dist > maxDist && c.count > 1) { // prefer more common colors
      maxDist = dist;
      secondColor = c.color;
    }
  }
  // If only one color, use it for both
  if (colorDistance(mainColor, secondColor) < 40) {
    secondColor = mainColor;
  }
  return [rgbToString(mainColor), rgbToString(secondColor)];
}

export function useDominantColors(imageUrl: string): [string | null, string | null] {
  const [colors, setColors] = useState<[string | null, string | null]>([null, null]);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
      const [c1, c2] = getDominantColors(imageData, img.width, img.height);
      setColors([c1, c2]);
    };
    img.onerror = () => setColors([null, null]);
  }, [imageUrl]);

  return colors;
} 