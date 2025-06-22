'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Battery, Wifi, Shield, AlertTriangle, Info } from 'lucide-react';
import { IOSCard } from '@/components/ui/ios/card';
import { IOSSwitch } from '@/components/ui/ios/switch';
import { IOSButton } from '@/components/ui/ios/button';
import { getTrackingSettings, saveTrackingSettings } from '@/components/pwa/gps-tracker/backgroundTracking';

interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: string;
  };
}

interface NavigatorWithGetBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

interface TrackingSettings {
  enableHighAccuracy: boolean;
  backgroundTracking: boolean;
  wakeLock: boolean;
  autoSync: boolean;
  minDistance: number;
  minAccuracy: number;
  trackingInterval: number;
  notifications: boolean;
  aggressiveWakeLock: boolean;
  backgroundMode: boolean;
}

interface GPSBackgroundSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: TrackingSettings) => void;
}

export const GPSBackgroundSettings = ({
  isOpen,
  onClose,
  onSettingsChange
}: GPSBackgroundSettingsProps) => {
  const [settings, setSettings] = useState<TrackingSettings>({
    enableHighAccuracy: true,
    backgroundTracking: true,
    wakeLock: true,
    autoSync: true,
    minDistance: 3,
    minAccuracy: 30,
    trackingInterval: 3000,
    notifications: true,
    aggressiveWakeLock: true,
    backgroundMode: true
  });

  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [networkType, setNetworkType] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      getBatteryInfo();
      getNetworkInfo();
    }
  }, [isOpen]);

  const loadSettings = () => {
    const currentSettings = getTrackingSettings();
    setSettings(currentSettings as TrackingSettings);
  };

  const getBatteryInfo = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as NavigatorWithGetBattery).getBattery?.();
        if (battery) {
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
        }
      } catch (error) {
        console.error('Failed to get battery info:', error);
      }
    }
  };

  const getNetworkInfo = () => {
    if ('connection' in navigator) {
      const connection = (navigator as NavigatorWithConnection).connection;
      setNetworkType(connection?.effectiveType || 'unknown');
    }
  };

  const handleSettingChange = (key: keyof TrackingSettings, value: TrackingSettings[keyof TrackingSettings]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveTrackingSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const getBatteryStatus = () => {
    if (batteryLevel === null) return 'Unknown';
    if (isCharging) return `${batteryLevel}% (Charging)`;
    if (batteryLevel < 20) return `${batteryLevel}% (Low)`;
    return `${batteryLevel}%`;
  };

  const getNetworkStatus = () => {
    switch (networkType) {
      case '4g': return '4G (Fast)';
      case '3g': return '3G (Medium)';
      case '2g': return '2G (Slow)';
      case 'slow-2g': return '2G (Very Slow)';
      default: return 'Unknown';
    }
  };

  const getBatteryColor = () => {
    if (batteryLevel === null) return 'text-gray-500';
    if (isCharging) return 'text-green-600';
    if (batteryLevel < 20) return 'text-red-600';
    if (batteryLevel < 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getNetworkColor = () => {
    switch (networkType) {
      case '4g': return 'text-green-600';
      case '3g': return 'text-yellow-600';
      case '2g':
      case 'slow-2g': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <IOSCard
          title="Background GPS Settings"
          subtitle="Optimize tracking for background use"
          icon={<Settings className="h-6 w-6" />}
          iconBackground="bg-blue-100"
          iconColor="text-blue-600"
          variant="elevated"
        >
          <div className="space-y-6">
            {/* Device Status */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Device Status
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <Battery className={`h-4 w-4 ${getBatteryColor()}`} />
                  <div className="text-sm">
                    <div className="font-medium">Battery</div>
                    <div className={`text-xs ${getBatteryColor()}`}>{getBatteryStatus()}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <Wifi className={`h-4 w-4 ${getNetworkColor()}`} />
                  <div className="text-sm">
                    <div className="font-medium">Network</div>
                    <div className={`text-xs ${getNetworkColor()}`}>{getNetworkStatus()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Tracking Options</h3>
              
              <IOSSwitch
                label="High Accuracy GPS"
                checked={settings.enableHighAccuracy}
                onCheckedChange={(checked) => handleSettingChange('enableHighAccuracy', checked)}
              />
              
              <IOSSwitch
                label="Background Tracking"
                checked={settings.backgroundTracking}
                onCheckedChange={(checked) => handleSettingChange('backgroundTracking', checked)}
              />
              
              <IOSSwitch
                label="Wake Lock (Keep Screen On)"
                checked={settings.wakeLock}
                onCheckedChange={(checked) => handleSettingChange('wakeLock', checked)}
              />
              
              <IOSSwitch
                label="Aggressive Wake Lock"
                checked={settings.aggressiveWakeLock}
                onCheckedChange={(checked) => handleSettingChange('aggressiveWakeLock', checked)}
              />
              
              <IOSSwitch
                label="Auto Sync Data"
                checked={settings.autoSync}
                onCheckedChange={(checked) => handleSettingChange('autoSync', checked)}
              />
              
              <IOSSwitch
                label="Notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
              />
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Advanced Settings</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Minimum Distance (meters): {settings.minDistance}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={settings.minDistance}
                  onChange={(e) => handleSettingChange('minDistance', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Minimum Accuracy (meters): {settings.minAccuracy}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.minAccuracy}
                  onChange={(e) => handleSettingChange('minAccuracy', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Tracking Interval (seconds): {settings.trackingInterval / 1000}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={settings.trackingInterval / 1000}
                  onChange={(e) => handleSettingChange('trackingInterval', parseInt(e.target.value) * 1000)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Battery Warning */}
            {batteryLevel !== null && batteryLevel < 20 && !isCharging && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-yellow-800">Low Battery Warning</div>
                    <div className="text-yellow-700 mt-1">
                      Background GPS tracking may drain your battery quickly. Consider charging your device or reducing tracking frequency.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Network Warning */}
            {networkType && ['2g', 'slow-2g'].includes(networkType) && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-orange-800">Slow Network Detected</div>
                    <div className="text-orange-700 mt-1">
                      Your network connection is slow. Data sync may take longer than usual.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-blue-800">Privacy & Battery</div>
                  <div className="text-blue-700 mt-1">
                    GPS tracking uses your device&apos;s location services and may impact battery life. All data is stored locally and synced when online.
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <IOSButton
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </IOSButton>
              
              <IOSButton
                variant="blue"
                onClick={() => {
                  loadSettings();
                  onClose();
                }}
                className="flex-1"
              >
                Reset to Defaults
              </IOSButton>
            </div>
          </div>
        </IOSCard>
      </motion.div>
    </motion.div>
  );
}; 