/**
 * License Status Widget for Luciai Studio
 * Shows license status and renewal reminders in the IDE
 */

import React, { useState, useEffect } from 'react';
import { licenseManager } from './LicenseManager';
import { 
  Check, 
  AlertTriangle, 
  Calendar, 
  Shield, 
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LicenseStatusWidgetProps {
  onRenew?: () => void;
}

export const LicenseStatusWidget: React.FC<LicenseStatusWidgetProps> = ({ onRenew }) => {
  const [licenseInfo, setLicenseInfo] = useState(licenseManager.getLicenseInfo());
  const [renewalInfo, setRenewalInfo] = useState(licenseManager.getRenewalInfo());
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Update every 5 minutes
    const interval = setInterval(() => {
      setLicenseInfo(licenseManager.getLicenseInfo());
      setRenewalInfo(licenseManager.getRenewalInfo());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !licenseInfo) {
    return null;
  }

  const getStatusColor = () => {
    if (renewalInfo.daysRemaining <= 0) return 'red';
    if (renewalInfo.daysRemaining <= 7) return 'orange';
    if (renewalInfo.daysRemaining <= 30) return 'yellow';
    return 'green';
  };

  const getStatusIcon = () => {
    const color = getStatusColor();
    if (color === 'green') return <Check className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (renewalInfo.daysRemaining <= 0) return 'Expired';
    if (renewalInfo.daysRemaining <= 7) return `Expiring in ${renewalInfo.daysRemaining} days`;
    if (renewalInfo.daysRemaining <= 30) return `${renewalInfo.daysRemaining} days remaining`;
    return 'Active';
  };

  const statusColor = getStatusColor();
  const bgColor = {
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200'
  }[statusColor];

  const textColor = {
    green: 'text-green-800',
    yellow: 'text-yellow-800',
    orange: 'text-orange-800',
    red: 'text-red-800'
  }[statusColor];

  const iconColor = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
    red: 'text-red-600'
  }[statusColor];

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} border rounded-lg shadow-lg transition-all duration-300 z-50 max-w-sm`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={iconColor}>
            {getStatusIcon()}
          </div>
          <div>
            <div className={`font-semibold text-sm ${textColor}`}>
              License {getStatusText()}
            </div>
            <div className="text-xs text-gray-600">
              {licenseInfo.userEmail}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded hover:bg-white/50 transition-colors ${textColor}`}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className={`p-1 rounded hover:bg-white/50 transition-colors ${textColor}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-3 border-t border-gray-200">
          {/* Days Remaining */}
          <div className="flex items-center justify-between text-sm pt-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Days Remaining</span>
            </div>
            <span className={`font-semibold ${textColor}`}>
              {renewalInfo.daysRemaining}
            </span>
          </div>

          {/* Valid Until */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Valid Until</span>
            </div>
            <span className="font-medium text-gray-900">
              {renewalInfo.willExpireOn?.toLocaleDateString()}
            </span>
          </div>

          {/* Renewal Cost */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">Renewal Cost</div>
            <span className="font-semibold text-gray-900">
              ${renewalInfo.price}/year
            </span>
          </div>

          {/* Renew Button */}
          {renewalInfo.shouldRenewSoon && onRenew && (
            <button
              onClick={onRenew}
              className={`w-full mt-2 px-4 py-2 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
                statusColor === 'red' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Renew Now
            </button>
          )}

          {/* Status Message */}
          {renewalInfo.shouldRenewSoon && (
            <div className="text-xs text-gray-600 text-center">
              {statusColor === 'red' 
                ? 'Your license has expired. Renew to continue using Luciai Studio.'
                : 'Your license will expire soon. Renew early to avoid interruption.'
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};
