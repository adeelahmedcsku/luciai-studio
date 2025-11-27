/**
 * License Manager for Luciai Studio
 * Handles license key validation, device ID generation, and API integration
 * 
 * Features:
 * - Device ID generation (unique per installation)
 * - License key validation with admin API
 * - Annual subscription tracking ($25/year)
 * - User email verification
 * - Offline grace period (7 days)
 * - Automatic license expiry checking
 */

import { invoke } from '@tauri-apps/api/core';

export interface LicenseInfo {
  deviceId: string;
  licenseKey: string;
  userEmail: string;
  validUntil: Date;
  lastValidated: Date;
  isValid: boolean;
  gracePeriodEnds?: Date;
}

export interface LicenseValidationRequest {
  deviceId: string;
  licenseKey: string;
  userEmail: string;
}

export interface LicenseValidationResponse {
  valid: boolean;
  validUntil: string; // ISO date string
  userEmail: string;
  message?: string;
  subscriptionActive: boolean;
  daysRemaining: number;
}

export class LicenseManager {
  private static instance: LicenseManager;
  private readonly ADMIN_API_URL = 'https://admin.luciaistudio.com/api/v1/license';
  private readonly STORAGE_KEY = 'luciai_license';
  private readonly DEVICE_ID_KEY = 'luciai_device_id';
  private readonly GRACE_PERIOD_DAYS = 7;
  private readonly PRICE_PER_YEAR = 25; // $25/year

  private licenseInfo: LicenseInfo | null = null;
  private validationInterval: number | null = null;

  private constructor() {
    this.loadLicenseInfo();
  }

  public static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  /**
   * Generate or retrieve unique device ID
   * This ID is persistent and unique per installation
   */
  private async generateDeviceId(): Promise<string> {
    try {
      // Check if device ID already exists
      const stored = localStorage.getItem(this.DEVICE_ID_KEY);
      if (stored) {
        return stored;
      }

      // Generate new device ID using machine info
      const deviceInfo = await this.getDeviceInfo();
      const deviceId = this.hashDeviceInfo(deviceInfo);

      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
      return deviceId;
    } catch (error) {
      console.error('Failed to generate device ID:', error);
      // Fallback to random UUID
      const fallbackId = this.generateUUID();
      localStorage.setItem(this.DEVICE_ID_KEY, fallbackId);
      return fallbackId;
    }
  }

  /**
   * Get device information for ID generation
   */
  private async getDeviceInfo(): Promise<any> {
    try {
      // Get system information from Tauri
      const platform = await invoke('plugin:os|platform');
      const arch = await invoke('plugin:os|arch');
      const version = await invoke('plugin:os|version');
      const hostname = await invoke('plugin:os|hostname').catch(() => 'unknown');

      return {
        platform,
        arch,
        version,
        hostname,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      };
    } catch (error) {
      console.error('Failed to get device info:', error);
      return {
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Hash device information to create unique ID
   */
  private hashDeviceInfo(info: any): string {
    const str = JSON.stringify(info);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to hex and add prefix
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    return `LUCIAI-${hexHash}-${Date.now().toString(36)}`;
  }

  /**
   * Generate UUID as fallback
   */
  private generateUUID(): string {
    return 'LUCIAI-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Validate license key with admin API
   */
  public async validateLicense(licenseKey: string, userEmail: string): Promise<LicenseValidationResponse> {
    try {
      const deviceId = await this.generateDeviceId();

      const request: LicenseValidationRequest = {
        deviceId,
        licenseKey: licenseKey.trim().toUpperCase(),
        userEmail: userEmail.trim().toLowerCase()
      };

      // Bypass for development key
      if (request.licenseKey === '0000-0000-0000-0000') {
        const validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1);

        const result: LicenseValidationResponse = {
          valid: true,
          validUntil: validUntil.toISOString(),
          userEmail: request.userEmail,
          message: 'Development License Activated',
          subscriptionActive: true,
          daysRemaining: 365
        };

        this.licenseInfo = {
          deviceId,
          licenseKey: request.licenseKey,
          userEmail: request.userEmail,
          validUntil: validUntil,
          lastValidated: new Date(),
          isValid: true
        };

        this.saveLicenseInfo();
        this.startValidationTimer();
        return result;
      }

      const response = await fetch(`${this.ADMIN_API_URL}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': deviceId,
          'X-Client-Version': '1.9.0'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || 'License validation failed');
      }

      const result: LicenseValidationResponse = await response.json();

      if (result.valid) {
        // Store license information
        this.licenseInfo = {
          deviceId,
          licenseKey: request.licenseKey,
          userEmail: request.userEmail,
          validUntil: new Date(result.validUntil),
          lastValidated: new Date(),
          isValid: true
        };

        this.saveLicenseInfo();
        this.startValidationTimer();
      }

      return result;
    } catch (error: any) {
      console.error('License validation error:', error);

      // Check if we have a grace period
      if (this.licenseInfo && this.isInGracePeriod()) {
        return {
          valid: true,
          validUntil: this.licenseInfo.validUntil.toISOString(),
          userEmail: this.licenseInfo.userEmail,
          message: 'Using offline grace period. Please connect to validate.',
          subscriptionActive: true,
          daysRemaining: this.getDaysRemaining(this.licenseInfo.validUntil)
        };
      }

      return {
        valid: false,
        validUntil: new Date().toISOString(),
        userEmail: '',
        message: error.message || 'Failed to validate license',
        subscriptionActive: false,
        daysRemaining: 0
      };
    }
  }

  /**
   * Check if license is currently valid
   */
  public async isLicenseValid(): Promise<boolean> {
    if (!this.licenseInfo) {
      return false;
    }

    const now = new Date();
    const validUntil = new Date(this.licenseInfo.validUntil);

    // Check if license has expired
    if (now > validUntil) {
      return false;
    }

    // Check if we need to revalidate (every 24 hours)
    const lastValidated = new Date(this.licenseInfo.lastValidated);
    const hoursSinceValidation = (now.getTime() - lastValidated.getTime()) / (1000 * 60 * 60);

    if (hoursSinceValidation > 24) {
      // Try to revalidate
      try {
        const result = await this.validateLicense(
          this.licenseInfo.licenseKey,
          this.licenseInfo.userEmail
        );
        return result.valid;
      } catch (error) {
        // If validation fails, check grace period
        return this.isInGracePeriod();
      }
    }

    return true;
  }

  /**
   * Check if we're in the offline grace period
   */
  private isInGracePeriod(): boolean {
    if (!this.licenseInfo) {
      return false;
    }

    const now = new Date();
    const lastValidated = new Date(this.licenseInfo.lastValidated);
    const daysSinceValidation = (now.getTime() - lastValidated.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceValidation <= this.GRACE_PERIOD_DAYS;
  }

  /**
   * Get grace period expiry date
   */
  public getGracePeriodEnd(): Date | null {
    if (!this.licenseInfo) {
      return null;
    }

    const lastValidated = new Date(this.licenseInfo.lastValidated);
    const gracePeriodEnd = new Date(lastValidated);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.GRACE_PERIOD_DAYS);

    return gracePeriodEnd;
  }

  /**
   * Get days remaining in subscription
   */
  private getDaysRemaining(validUntil: Date): number {
    const now = new Date();
    const diff = validUntil.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Get current license information
   */
  public getLicenseInfo(): LicenseInfo | null {
    return this.licenseInfo;
  }

  /**
   * Get device ID
   */
  public async getDeviceId(): Promise<string> {
    return await this.generateDeviceId();
  }

  /**
   * Save license information to local storage
   */
  private saveLicenseInfo(): void {
    if (this.licenseInfo) {
      const data = {
        ...this.licenseInfo,
        validUntil: this.licenseInfo.validUntil.toISOString(),
        lastValidated: this.licenseInfo.lastValidated.toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  /**
   * Load license information from local storage
   */
  private loadLicenseInfo(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.licenseInfo = {
          ...data,
          validUntil: new Date(data.validUntil),
          lastValidated: new Date(data.lastValidated)
        };
      }
    } catch (error) {
      console.error('Failed to load license info:', error);
      this.licenseInfo = null;
    }
  }

  /**
   * Clear license information
   */
  public clearLicense(): void {
    this.licenseInfo = null;
    localStorage.removeItem(this.STORAGE_KEY);
    this.stopValidationTimer();
  }

  /**
   * Start automatic validation timer (checks every hour)
   */
  private startValidationTimer(): void {
    this.stopValidationTimer();

    this.validationInterval = window.setInterval(async () => {
      await this.isLicenseValid();
    }, 60 * 60 * 1000); // Check every hour
  }

  /**
   * Stop validation timer
   */
  private stopValidationTimer(): void {
    if (this.validationInterval !== null) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  /**
   * Get subscription price
   */
  public getSubscriptionPrice(): number {
    return this.PRICE_PER_YEAR;
  }

  /**
   * Get renewal information
   */
  public getRenewalInfo(): {
    price: number;
    daysRemaining: number;
    willExpireOn: Date | null;
    shouldRenewSoon: boolean;
  } {
    if (!this.licenseInfo) {
      return {
        price: this.PRICE_PER_YEAR,
        daysRemaining: 0,
        willExpireOn: null,
        shouldRenewSoon: false
      };
    }

    const daysRemaining = this.getDaysRemaining(this.licenseInfo.validUntil);

    return {
      price: this.PRICE_PER_YEAR,
      daysRemaining,
      willExpireOn: this.licenseInfo.validUntil,
      shouldRenewSoon: daysRemaining <= 30 // Warn 30 days before expiry
    };
  }

  /**
   * Send heartbeat to admin API (usage tracking)
   */
  public async sendHeartbeat(): Promise<void> {
    // Heartbeat disabled to prevent network errors
    return;

    /*
    if (!this.licenseInfo || !this.licenseInfo.isValid) {
      return;
    }

    try {
      await fetch(`${this.ADMIN_API_URL}/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': this.licenseInfo.deviceId,
          'X-License-Key': this.licenseInfo.licenseKey
        },
        body: JSON.stringify({
          deviceId: this.licenseInfo.deviceId,
          timestamp: new Date().toISOString(),
          version: '1.9.0'
        })
      });
    } catch (error) {
      // Heartbeat failures are non-critical
      console.debug('Heartbeat failed:', error);
    }
    */
  }

  /**
   * Format license key for display
   */
  public static formatLicenseKey(key: string): string {
    const clean = key.replace(/[^A-Z0-9]/g, '');
    const parts = clean.match(/.{1,4}/g) || [];
    return parts.join('-');
  }

  /**
   * Validate license key format
   */
  public static isValidLicenseKeyFormat(key: string): boolean {
    const clean = key.replace(/[^A-Z0-9]/g, '');
    return clean.length >= 16 && clean.length <= 32;
  }

  /**
   * Validate email format
   */
  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const licenseManager = LicenseManager.getInstance();
