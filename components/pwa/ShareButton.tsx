'use client';

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScreenShare, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  variant?: 'desktop' | 'mobile';
}

const ShareButton = ({ variant = 'desktop' }: ShareButtonProps) => {
  const [hasShare, setHasShare] = useState(false);
  const [hasClipboard, setHasClipboard] = useState(false);

  useEffect(() => {
    // Check for API support once mounted
    setHasShare('share' in navigator);
    setHasClipboard('clipboard' in navigator);
  }, []);

  const handleShare = async () => {
    try {
      if (hasShare) {
        await navigator.share({
          title: 'GPS Trail Tracker',
          text: 'Track your routes with our GPS tracker!',
          url: window.location.href,
        });
      } else if (hasClipboard) {
        // Use optional chaining for type safety
        await navigator.clipboard?.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      } else {
        toast.error('Sharing not supported on this browser');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      toast.error('Could not share the app');
    }
  };

  // Determine which icon to show based on device capabilities
  const ShareIcon = hasShare ? ScreenShare : Copy;
  const buttonText = hasShare ? 'Share App' : 'Copy Link';

  if (variant === 'mobile') {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs sm:hidden flex items-center justify-center rounded-full w-10 h-10 p-0"
        onClick={handleShare}
        aria-label={buttonText}
      >
        <ShareIcon className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="text-xs sm:text-sm hidden sm:flex items-center gap-1.5"
      onClick={handleShare}
      aria-label={buttonText}
    >
      <ShareIcon className="h-4 w-4" /> {buttonText}
    </Button>
  );
};

export default ShareButton; 