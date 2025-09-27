"use client";

import { useEffect, useState, useRef, useCallback } from 'react';

interface UseBackgroundColorProps {
  x?: number;
  y?: number;
  elementRef: React.RefObject<HTMLElement | null>;
  threshold?: number;
}

interface ContrastResult {
  isDark: boolean;
  contrastRatio: number;
  recommendedTextColor: 'light' | 'dark';
  confidence: number;
  analysisMethod: string;
  sampledColors: string[];
  dominantColor: string;
}

interface ColorSample {
  x: number;
  y: number;
  color: string;
  brightness: number;
  saturation: number;
}

export const useBackgroundColor = ({ 
  x = 0, 
  y = 0, 
  elementRef, 
  threshold = 0.5 
}: UseBackgroundColorProps) => {
  const [contrastResult, setContrastResult] = useState<ContrastResult>({
    isDark: false,
    contrastRatio: 1,
    recommendedTextColor: 'dark',
    confidence: 0,
    analysisMethod: 'initial',
    sampledColors: [],
    dominantColor: '#ffffff'
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Convert color to HSL for better analysis
  const colorToHSL = useCallback((color: string): { h: number; s: number; l: number } => {
    try {
      // Handle different color formats
      let r = 0, g = 0, b = 0;
      
      if (color.startsWith('#')) {
        const hex = color.slice(1);
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      } else if (color.startsWith('rgb')) {
        const match = color.match(/\d+/g);
        if (match) {
          r = parseInt(match[0]);
          g = parseInt(match[1]);
          b = parseInt(match[2]);
        }
      } else if (color.startsWith('hsl')) {
        const match = color.match(/\d+/g);
        if (match) {
          return {
            h: parseInt(match[0]),
            s: parseInt(match[1]),
            l: parseInt(match[2])
          };
        }
      }
      
      // Convert RGB to HSL
      r /= 255;
      g /= 255;
      b /= 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      
      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      };
    } catch (error) {
      return { h: 0, s: 0, l: 50 };
    }
  }, []);

  // Sample colors from multiple points on the page
  const samplePageColors = useCallback((): ColorSample[] => {
    const samples: ColorSample[] = [];
    
    if (typeof window === 'undefined') return samples;
    
    try {
      // Instead of canvas sampling, analyze DOM elements for background colors
      const sampleElements = [
        document.body,
        document.documentElement,
        elementRef.current,
        ...Array.from(document.querySelectorAll('[class*="bg-"], [class*="background"]'))
      ].filter(Boolean);
      
      sampleElements.forEach((element, index) => {
        if (element && element instanceof Element) {
          const styles = getComputedStyle(element);
          const bgColor = styles.backgroundColor || styles.background;
          
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            const hsl = colorToHSL(bgColor);
            
            samples.push({
              x: index,
              y: index,
              color: bgColor,
              brightness: hsl.l,
              saturation: hsl.s
            });
          }
        }
      });
      
      // Also sample from viewport-visible elements
      const viewportElements = document.querySelectorAll('div, section, main, header, footer');
      viewportElements.forEach((element, index) => {
        if (index < 20) { // Limit to first 20 elements
          const rect = element.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) { // Element is visible
            const styles = getComputedStyle(element);
            const bgColor = styles.backgroundColor || styles.background;
            
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
              const hsl = colorToHSL(bgColor);
              
              samples.push({
                x: rect.left,
                y: rect.top,
                color: bgColor,
                brightness: hsl.l,
                saturation: hsl.s
              });
            }
          }
        }
      });
      
    } catch (error) {
      console.warn('Color sampling failed:', error);
    }
    
    return samples;
  }, [colorToHSL]);

  // Advanced background analysis using multiple methods
  const analyzeBackgroundComprehensive = useCallback((): ContrastResult => {
    try {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const headerElement = elementRef.current;
      
      // Method 1: Hero Section Analysis
      const heroSection = document.querySelector('[class*="hero"], [class*="Hero"], [class*="background"]');
      const hasHeroSection = heroSection !== null;
      const isOverHero = hasHeroSection && scrollY < windowHeight * 0.8;
      
      if (isOverHero) {
        // Check for background images
        const backgroundImage = getComputedStyle(document.body).backgroundImage;
        const hasDarkBackground = backgroundImage.includes('mainBackground') || 
                                document.querySelector('img[src*="mainBackground"]');
        
        if (hasDarkBackground) {
          return {
            isDark: true,
            contrastRatio: 4.5,
            recommendedTextColor: 'light',
            confidence: 0.95,
            analysisMethod: 'hero-background-image',
            sampledColors: [],
            dominantColor: '#000000'
          };
        }
        
        // Check for gradient overlays with sophisticated analysis
        const gradientOverlays = document.querySelectorAll('[class*="gradient"], [class*="overlay"]');
        let darkGradientCount = 0;
        let totalGradients = 0;
        
        gradientOverlays.forEach(el => {
          const styles = getComputedStyle(el);
          const bgColor = styles.backgroundColor || styles.background;
          const opacity = parseFloat(styles.opacity) || 1;
          
          if (bgColor && opacity > 0.1) {
            totalGradients++;
            if (bgColor.includes('black') || 
                bgColor.includes('rgba(0,0,0') ||
                bgColor.includes('rgb(0,0,0') ||
                bgColor.includes('hsl(0,0%,0%')) {
              darkGradientCount++;
            }
          }
        });
        
        if (totalGradients > 0 && darkGradientCount / totalGradients > 0.6) {
          return {
            isDark: true,
            contrastRatio: 4.0,
            recommendedTextColor: 'light',
            confidence: 0.9,
            analysisMethod: 'hero-gradient-analysis',
            sampledColors: [],
            dominantColor: '#000000'
          };
        }
      }
      
      // Method 2: Header Element Analysis
      if (headerElement) {
        const headerStyles = getComputedStyle(headerElement);
        const headerBg = headerStyles.backgroundColor || headerStyles.background;
        
        if (headerBg && headerBg !== 'rgba(0, 0, 0, 0)' && headerBg !== 'transparent') {
          const hsl = colorToHSL(headerBg);
          const isHeaderDark = hsl.l < 30;
          
          return {
            isDark: isHeaderDark,
            contrastRatio: isHeaderDark ? 3.5 : 4.0,
            recommendedTextColor: isHeaderDark ? 'light' : 'dark',
            confidence: 0.85,
            analysisMethod: 'header-background',
            sampledColors: [headerBg],
            dominantColor: headerBg
          };
        }
      }
      
      // Method 3: Color Sampling Analysis
      const colorSamples = samplePageColors();
      if (colorSamples.length > 0) {
        const avgBrightness = colorSamples.reduce((sum, sample) => sum + sample.brightness, 0) / colorSamples.length;
        const avgSaturation = colorSamples.reduce((sum, sample) => sum + sample.saturation, 0) / colorSamples.length;
        
        // Weighted analysis considering both brightness and saturation
        let darkScore = 0;
        let lightScore = 0;
        
        colorSamples.forEach(sample => {
          if (sample.brightness < 30) darkScore += 2;
          else if (sample.brightness < 50) darkScore += 1;
          else if (sample.brightness > 70) lightScore += 2;
          else if (sample.brightness > 50) lightScore += 1;
          
          // Consider saturation for more accurate detection
          if (sample.saturation > 50 && sample.brightness < 40) darkScore += 0.5;
          if (sample.saturation < 30 && sample.brightness > 60) lightScore += 0.5;
        });
        
        const isDarkBySampling = darkScore > lightScore;
        const confidence = Math.min(0.9, Math.max(0.6, Math.abs(darkScore - lightScore) / Math.max(darkScore, lightScore)));
        
        return {
          isDark: isDarkBySampling,
          contrastRatio: isDarkBySampling ? 3.5 : 4.0,
          recommendedTextColor: isDarkBySampling ? 'light' : 'dark',
          confidence,
          analysisMethod: 'color-sampling',
          sampledColors: colorSamples.map(s => s.color),
          dominantColor: colorSamples[0]?.color || '#ffffff'
        };
      }
      
      // Method 4: CSS Class Analysis with Background Verification
      const darkSections = document.querySelectorAll('[class*="dark"], [class*="black"], [class*="bg-gray-900"], [class*="bg-black"]');
      const lightSections = document.querySelectorAll('[class*="light"], [class*="white"], [class*="bg-gray-50"], [class*="bg-white"]');
      
      let verifiedDarkSections = 0;
      let verifiedLightSections = 0;
      
      // Verify dark sections actually have dark backgrounds
      darkSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          const styles = getComputedStyle(section);
          const bgColor = styles.backgroundColor || styles.background;
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            const hsl = colorToHSL(bgColor);
            if (hsl.l < 40) verifiedDarkSections++;
          }
        }
      });
      
      // Verify light sections actually have light backgrounds
      lightSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          const styles = getComputedStyle(section);
          const bgColor = styles.backgroundColor || styles.background;
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            const hsl = colorToHSL(bgColor);
            if (hsl.l > 60) verifiedLightSections++;
          }
        }
      });
      
      if (verifiedDarkSections > verifiedLightSections) {
        return {
          isDark: true,
          contrastRatio: 3.5,
          recommendedTextColor: 'light',
          confidence: 0.8,
          analysisMethod: 'verified-css-classes',
          sampledColors: [],
          dominantColor: '#000000'
        };
      } else if (verifiedLightSections > verifiedDarkSections) {
        return {
          isDark: false,
          contrastRatio: 4.0,
          recommendedTextColor: 'dark',
          confidence: 0.8,
          analysisMethod: 'verified-css-classes',
          sampledColors: [],
          dominantColor: '#ffffff'
        };
      }
      
      // Method 5: Body Background Analysis
      const bodyBackground = getComputedStyle(document.body).backgroundColor;
      if (bodyBackground && bodyBackground !== 'rgba(0, 0, 0, 0)' && bodyBackground !== 'transparent') {
        const hsl = colorToHSL(bodyBackground);
        const isBodyDark = hsl.l < 30;
        
        return {
          isDark: isBodyDark,
          contrastRatio: isBodyDark ? 3.0 : 4.0,
          recommendedTextColor: isBodyDark ? 'light' : 'dark',
          confidence: 0.7,
          analysisMethod: 'body-background',
          sampledColors: [bodyBackground],
          dominantColor: bodyBackground
        };
      }
      
      // Method 6: Fallback with intelligent defaults
      const timeOfDay = new Date().getHours();
      const isNightTime = timeOfDay < 6 || timeOfDay > 20;
      
      return {
        isDark: isNightTime,
        contrastRatio: 3.5,
        recommendedTextColor: isNightTime ? 'light' : 'dark',
        confidence: 0.5,
        analysisMethod: 'time-based-fallback',
        sampledColors: [],
        dominantColor: isNightTime ? '#000000' : '#ffffff'
      };
      
    } catch (error) {
      console.warn('Comprehensive background analysis failed:', error);
      return {
        isDark: false,
        contrastRatio: 1,
        recommendedTextColor: 'dark',
        confidence: 0,
        analysisMethod: 'error-fallback',
        sampledColors: [],
        dominantColor: '#ffffff'
      };
    }
  }, [elementRef, colorToHSL, samplePageColors]);

  const detectBackgroundColor = useCallback(() => {
    if (!elementRef.current || typeof window === 'undefined' || isDetecting || !isClient) return;

    setIsDetecting(true);

    try {
      const result = analyzeBackgroundComprehensive();
      setContrastResult(result);
    } catch (error) {
      console.warn('Background color detection failed:', error);
      setContrastResult({
        isDark: false,
        contrastRatio: 1,
        recommendedTextColor: 'dark',
        confidence: 0,
        analysisMethod: 'error-fallback',
        sampledColors: [],
        dominantColor: '#ffffff'
      });
    } finally {
      setIsDetecting(false);
    }
  }, [analyzeBackgroundComprehensive, elementRef, isDetecting, isClient]);

  useEffect(() => {
    if (!isClient) return;

    // Initial detection
    detectBackgroundColor();

    // Throttled scroll handler
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        detectBackgroundColor();
      });
    };

    // Throttled resize handler
    const handleResize = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        detectBackgroundColor();
      });
    };

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [detectBackgroundColor, isClient]);

  // Return consistent values during SSR
  if (!isClient) {
    return {
      isDark: false,
      textColor: 'text-gray-900',
      textColorHover: 'hover:text-gray-700',
      isDetecting: false,
      contrastRatio: 1,
      recommendedTextColor: 'dark' as const,
      confidence: 0,
      analysisMethod: 'ssr',
      sampledColors: [],
      dominantColor: '#ffffff'
    };
  }

  const { isDark, recommendedTextColor, contrastRatio, confidence, analysisMethod, sampledColors, dominantColor } = contrastResult;

  // Enhanced text color selection based on comprehensive analysis
  let textColor: string;
  let textColorHover: string;
  let backgroundColor: string;
  let borderColor: string;

  if (recommendedTextColor === 'light') {
    textColor = 'text-white';
    textColorHover = 'hover:text-gray-200';
    backgroundColor = 'bg-white/20';
    borderColor = 'border-white/30';
  } else {
    textColor = 'text-gray-900';
    textColorHover = 'hover:text-gray-700';
    backgroundColor = 'bg-gray-900/20';
    borderColor = 'border-gray-900/30';
  }

  return {
    isDark,
    textColor,
    textColorHover,
    backgroundColor,
    borderColor,
    isDetecting,
    contrastRatio,
    recommendedTextColor,
    confidence,
    analysisMethod,
    sampledColors,
    dominantColor
  };
}; 