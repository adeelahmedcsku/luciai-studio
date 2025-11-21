/**
 * License Expired Component for Luciai Studio
 * Displayed when license is invalid or expired
 * Blocks all IDE functionality until license is renewed
 */

import React, { useState, useEffect } from 'react';
import { licenseManager } from './LicenseManager';
import { 
  AlertTriangle, 
  Calendar, 
  Key, 
  RefreshCw, 
  Mail, 
  CreditCard,
  Shield,
  Clock
} from 'lucide-react';

interface LicenseExpiredProps {
  onRenew: () => void;
  reason: 'expired' | 'invalid' | 'grace-period';
}

export const LicenseExpired: React.FC<LicenseExpiredProps> = ({ onRenew, reason }) => {
  const [licenseInfo, setLicenseInfo] = useState(licenseManager.getLicenseInfo());
  const [renewalInfo, setRenewalInfo] = useState(licenseManager.getRenewalInfo());
  const [gracePeriodEnd, setGracePeriodEnd] = useState(licenseManager.getGracePeriodEnd());

  useEffect(() => {
    const interval = setInterval(() => {
      setRenewalInfo(licenseManager.getRenewalInfo());
      setGracePeriodEnd(licenseManager.getGracePeriodEnd());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getTitle = () => {
    switch (reason) {
      case 'expired':
        return 'License Expired';
      case 'invalid':
        return 'Invalid License';
      case 'grace-period':
        return 'License Verification Required';
      default:
        return 'License Issue';
    }
  };

  const getMessage = () => {
    switch (reason) {
      case 'expired':
        return 'Your Luciai Studio subscription has expired. Please renew to continue using the IDE.';
      case 'invalid':
        return 'Your license key is invalid or has been revoked. Please contact your administrator.';
      case 'grace-period':
        return 'Unable to verify your license online. You have a grace period to connect and validate.';
      default:
        return 'There is an issue with your license. Please renew or contact support.';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getDaysRemaining = (date: Date | null) => {
    if (!date) return 0;
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{getTitle()}</h1>
          <p className="text-gray-600 text-lg">{getMessage()}</p>
        </div>

        {/* License Information */}
        {licenseInfo && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">License Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <div className="font-medium text-gray-900">{licenseInfo.userEmail}</div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Key className="w-4 h-4" />
                  License Key
                </div>
                <div className="font-mono text-sm text-gray-900">
                  {licenseInfo.licenseKey.substring(0, 12)}...
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  Valid Until
                </div>
                <div className="font-medium text-red-600">
                  {formatDate(licenseInfo.validUntil)}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  Days Expired
                </div>
                <div className="font-medium text-red-600">
                  {Math.abs(getDaysRemaining(licenseInfo.validUntil))} days ago
                </div>
              </div>
            </div>

            {reason === 'grace-period' && gracePeriodEnd && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-yellow-900">Offline Grace Period Active</div>
                    <div className="text-sm text-yellow-700 mt-1">
                      You can continue using Luciai Studio until{' '}
                      <span className="font-semibold">{formatDate(gracePeriodEnd)}</span>
                      {' '}({getDaysRemaining(gracePeriodEnd)} days remaining)
                    </div>
                    <div className="text-sm text-yellow-700 mt-1">
                      Please connect to the internet to verify your license.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Renewal Information */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-5 h-5" />
                <span className="text-xl font-bold">Renew for $25/year</span>
              </div>
              <p className="text-blue-100 text-sm">Continue accessing all 129 features</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">∞</div>
              <p className="text-blue-100 text-sm">ROI</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
              <div className="text-2xl font-bold">129</div>
              <div className="text-xs text-blue-100">Features</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
              <div className="text-2xl font-bold">$6.4K+</div>
              <div className="text-xs text-blue-100">Value/Year</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
              <div className="text-2xl font-bold">18</div>
              <div className="text-xs text-blue-100">Tools Replaced</div>
            </div>
          </div>
        </div>

        {/* What You're Missing */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">What You're Missing:</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              'AI Code Assistant',
              'Cloud Deployment',
              'Code Editing',
              'Monitoring & Alerts',
              'Git Integration',
              'Environment Manager',
              'Database Tools',
              'GraphQL Client',
              'ML/AI Development',
              'Package Manager',
              'DevOps Tools',
              'Test Runner'
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onRenew}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Renew License Now
          </button>

          {reason === 'grace-period' && (
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all"
            >
              Retry Connection
            </button>
          )}
        </div>

        {/* Help */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Need help with renewal?</p>
          <p className="mt-1">
            Contact your administrator or visit{' '}
            <a 
              href="https://luciaistudio.com/support" 
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              luciaistudio.com/support
            </a>
          </p>
        </div>

        {/* Blocked Features Notice */}
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-red-900 mb-1">All Features Disabled</div>
              <div className="text-red-700">
                All IDE functionality has been disabled until your license is renewed. 
                Your files and projects are safe and will be accessible after renewal.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>Luciai Studio v1.9 • Cloud-Powered AI-Enabled Edition</p>
          <p className="mt-1">© 2025 Luciai Studio. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
