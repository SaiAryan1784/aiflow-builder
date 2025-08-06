"use client"

import { useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the warning before
    const dismissed = localStorage.getItem('mobile-warning-dismissed') === 'true';
    setIsDismissed(dismissed);
  }, []);

  useEffect(() => {
    const checkIfMobile = () => {
      // Check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/.test(userAgent);
      
      // Check screen size (less than md breakpoint in Tailwind = 768px)
      const isSmallScreen = window.innerWidth < 768;
      
      // Check for touch capability (additional mobile indicator)
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check if it's actually a small mobile device (not tablet)
      const isVerySmallScreen = window.innerWidth < 640; // sm breakpoint
      
      // Show warning if it's a mobile device OR very small screen OR (small screen AND touch device)
      const shouldShowWarning = isMobileDevice || isVerySmallScreen || (isSmallScreen && isTouchDevice);
      
      setIsMobile(shouldShowWarning);
      
      // Only show if it's mobile and not manually dismissed
      if (shouldShowWarning && !isDismissed) {
        setIsVisible(true);
      } else if (!shouldShowWarning) {
        setIsVisible(false);
      }
    };

    // Check on mount
    checkIfMobile();

    // Check on resize with debounce
    let timeoutId: NodeJS.Timeout;
    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkIfMobile, 100);
    };

    window.addEventListener('resize', debouncedCheck);
    window.addEventListener('orientationchange', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', debouncedCheck);
      window.removeEventListener('orientationchange', checkIfMobile);
      clearTimeout(timeoutId);
    };
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    localStorage.setItem('mobile-warning-dismissed', 'true');
  };

  if (!isMobile || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-background border shadow-lg">
        <div className="p-6 text-center space-y-4">
          {/* Header with close button */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Smartphone className="h-12 w-12 text-muted-foreground" />
                  <div className="absolute -top-1 -right-1 bg-destructive rounded-full p-1">
                    <X className="h-3 w-3 text-destructive-foreground" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Mobile Experience Limited
              </h2>
              
              <p className="text-sm text-muted-foreground mb-4">
                AI Flow Builder is optimized for larger screens. For the best experience, please open this application on:
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 -mt-2 -mr-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Recommended devices */}
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
              <Monitor className="h-8 w-8 text-primary mb-2" />
              <span className="text-xs font-medium">Desktop</span>
              <span className="text-xs text-muted-foreground">Recommended</span>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
              <Tablet className="h-8 w-8 text-primary mb-2" />
              <span className="text-xs font-medium">Tablet</span>
              <span className="text-xs text-muted-foreground">Good</span>
            </div>
          </div>

          {/* Features that work better on larger screens */}
          <div className="text-left space-y-2">
            <p className="text-xs font-medium text-foreground">Features requiring larger screens:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Visual flow canvas with drag & drop</li>
              <li>• AI assistant panel with chat interface</li>
              <li>• Multi-panel layout and toolbar controls</li>
              <li>• Keyboard shortcuts and precision editing</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={handleDismiss}
              className="w-full"
              size="sm"
            >
              Continue Anyway
            </Button>
            
            <p className="text-xs text-muted-foreground">
              You can dismiss this message and continue, but some features may not work optimally.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
