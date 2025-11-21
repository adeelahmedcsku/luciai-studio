/**
 * License Activation Component for Luciai Studio
 * Handles license key entry, email validation, and activation
 */

import React, { useState, useEffect } from 'react';
import { licenseManager, LicenseManager } from './LicenseManager';
import { Check, AlertCircle, Key, Mail, Monitor, Calendar, DollarSign } from 'lucide-react';

interface LicenseActivationProps {
  onActivated: () => void;
  isRenewal?: boolean;
}

export const LicenseActivation: React.FC<LicenseActivationProps> = ({ 
  onActivated, 
  isRenewal = false 
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [email, setEmail] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load device ID
    licenseManager.getDeviceId().then(setDeviceId);

    // Pre-fill email if renewal
    if (isRenewal) {
      const info = licenseManager.getLicenseInfo();
      if (info) {
        setEmail(info.userEmail);
      }
    }
  }, [isRenewal]);

  const handleLicenseKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Auto-format with dashes every 4 characters
    if (value.length > 0) {
      value = value.match(/.{1,4}/g)?.join('-') || value;
    }
    
    setLicenseKey(value);
    setError(null);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.toLowerCase());
    setError(null);
  };

  const validateInputs = (): boolean => {
    const cleanKey = licenseKey.replace(/[^A-Z0-9]/g, '');
    
    if (!LicenseManager.isValidLicenseKeyFormat(cleanKey)) {
      setError('Invalid license key format. Key should be 16-32 characters.');
      return false;
    }

    if (!LicenseManager.isValidEmail(email)) {
      setError('Invalid email address.');
      return false;
    }

    return true;
  };

  const handleActivate = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const result = await licenseManager.validateLicense(licenseKey, email);

      if (result.valid) {
        setSuccess(true);
        setTimeout(() => {
          onActivated();
        }, 1500);
      } else {
        setError(result.message || 'License validation failed. Please check your license key and email.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate license. Please check your connection and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating) {
      handleActivate();
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Activation Successful!</h2>
            <p className="text-gray-600">Your Luciai Studio license has been activated.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <img 
            src="/luciai-logo.jpg" 
            alt="Luciai Studio" 
            className="w-24 h-24 mx-auto rounded-full shadow-lg mb-4 object-cover"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isRenewal ? 'Renew Your License' : 'Welcome to Luciai Studio'}
          </h1>
          <p className="text-gray-600">
            {isRenewal 
              ? 'Enter your new license key to continue using Luciai Studio' 
              : 'The AI-Powered Cloud-Native IDE'}
          </p>
        </div>

        {/* Pricing Info */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-5 h-5" />
                <span className="text-2xl font-bold">$25 / year</span>
              </div>
              <p className="text-blue-100 text-sm">Replaces $6,446+/year in commercial tools</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">∞</div>
              <p className="text-blue-100 text-sm">ROI</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-semibold text-gray-900">129 Features</div>
            <div className="text-xs text-gray-600">Complete IDE toolkit</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-semibold text-gray-900">AI-Powered</div>
            <div className="text-xs text-gray-600">Intelligent assistance</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-semibold text-gray-900">Cloud-Native</div>
            <div className="text-xs text-gray-600">Multi-cloud deployment</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-semibold text-gray-900">Full Observability</div>
            <div className="text-xs text-gray-600">Monitoring & alerts</div>
          </div>
        </div>

        {/* Activation Form */}
        <div className="space-y-4 mb-6">
          {/* Device ID Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Monitor className="inline w-4 h-4 mr-1" />
              Device ID
            </label>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-600 break-all">
              {deviceId || 'Generating...'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This unique ID identifies your installation
            </p>
          </div>

          {/* License Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="inline w-4 h-4 mr-1" />
              License Key *
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={handleLicenseKeyChange}
              onKeyPress={handleKeyPress}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              maxLength={35} // 32 chars + 7 dashes
              disabled={isValidating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the license key provided by your administrator
            </p>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline w-4 h-4 mr-1" />
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              onKeyPress={handleKeyPress}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isValidating || (isRenewal && !!email)}
            />
            <p className="text-xs text-gray-500 mt-1">
              The email associated with your license
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-900">Activation Failed</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Activate Button */}
        <button
          onClick={handleActivate}
          disabled={isValidating || !licenseKey || !email}
          className={`w-full py-4 rounded-lg font-semibold text-white transition-all ${
            isValidating || !licenseKey || !email
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isValidating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Validating...
            </span>
          ) : (
            <span>{isRenewal ? 'Renew License' : 'Activate License'}</span>
          )}
        </button>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Don't have a license key?</p>
          <p className="mt-1">
            Contact your administrator or visit{' '}
            <a href="https://luciaistudio.com" className="text-blue-600 hover:underline">
              luciaistudio.com
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>Luciai Studio v1.9 • Cloud-Powered AI-Enabled Edition</p>
          <p className="mt-1">© 2025 Luciai Studio. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
