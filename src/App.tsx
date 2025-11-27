/**
 * Luciai Studio - Main Application Entry Point
 * Cloud-Powered AI-Enabled IDE with Licensing System
 * 
 * Version: 2.0 (Licensing Edition)
 * Features: 129+ Complete Features
 * Price: $25/year
 */

import { useState, useEffect } from "react";
import MainIDE from "./components/ide/MainIDE";
import LoadingScreen from "./components/ide/LoadingScreen";
import { LicenseActivation } from "./components/licensing/LicenseActivation";
import { LicenseExpired } from "./components/licensing/LicenseExpired";
import { LicenseStatusWidget } from "./components/licensing/LicenseStatusWidget";
import { licenseManager } from "./components/licensing/LicenseManager";
import { ThemeProvider } from "./context/ThemeContext";

type AppView = 'loading' | 'activation' | 'expired' | 'ide';

interface ExpiredReason {
  type: 'expired' | 'invalid' | 'grace-period';
}

function App() {
  const [currentView, setCurrentView] = useState<AppView>('loading');
  const [expiredReason, setExpiredReason] = useState<ExpiredReason>({ type: 'invalid' });
  const [isRenewal, setIsRenewal] = useState(false);

  useEffect(() => {
    initializeApp();

    // Send heartbeat every 30 minutes
    const heartbeatInterval = setInterval(() => {
      licenseManager.sendHeartbeat();
    }, 30 * 60 * 1000);

    return () => clearInterval(heartbeatInterval);
  }, []);

  const initializeApp = async () => {
    try {
      // Check if license exists and is valid
      const isValid = await licenseManager.isLicenseValid();
      const licenseInfo = licenseManager.getLicenseInfo();

      if (!licenseInfo) {
        // No license found - show activation
        setCurrentView('activation');
        setIsRenewal(false);
      } else if (isValid) {
        // Valid license - start IDE
        setCurrentView('ide');
        // Send initial heartbeat
        await licenseManager.sendHeartbeat();
      } else {
        // Invalid or expired license
        const gracePeriod = licenseManager.getGracePeriodEnd();
        const now = new Date();

        if (gracePeriod && now < gracePeriod) {
          // Grace period active - allow usage but show warning
          setExpiredReason({ type: 'grace-period' });
          setCurrentView('ide');
        } else {
          // Show expired screen
          const validUntil = new Date(licenseInfo.validUntil);
          if (now > validUntil) {
            setExpiredReason({ type: 'expired' });
          } else {
            setExpiredReason({ type: 'invalid' });
          }
          setCurrentView('expired');
        }
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setCurrentView('activation');
      setIsRenewal(false);
    }
  };

  const handleLicenseActivated = async () => {
    // Verify the license one more time
    const isValid = await licenseManager.isLicenseValid();
    if (isValid) {
      setCurrentView('ide');
      // Send initial heartbeat
      await licenseManager.sendHeartbeat();
    } else {
      // Shouldn't happen, but handle it
      setCurrentView('expired');
      setExpiredReason({ type: 'invalid' });
    }
  };

  const handleRenewClicked = () => {
    setIsRenewal(true);
    setCurrentView('activation');
  };

  const handleLogout = () => {
    licenseManager.clearLicense();
    setIsRenewal(false);
    setCurrentView('activation');
  };

  // Check license periodically while IDE is running
  useEffect(() => {
    if (currentView !== 'ide') return;

    const checkInterval = setInterval(async () => {
      const isValid = await licenseManager.isLicenseValid();
      if (!isValid) {
        const licenseInfo = licenseManager.getLicenseInfo();
        if (licenseInfo) {
          const validUntil = new Date(licenseInfo.validUntil);
          const now = new Date();

          if (now > validUntil) {
            setExpiredReason({ type: 'expired' });
            setCurrentView('expired');
          } else {
            setExpiredReason({ type: 'invalid' });
            setCurrentView('expired');
          }
        } else {
          setCurrentView('activation');
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(checkInterval);
  }, [currentView]);

  // Render appropriate view
  switch (currentView) {
    case 'loading':
      return <LoadingScreen />;

    case 'activation':
      return (
        <LicenseActivation
          onActivated={handleLicenseActivated}
          isRenewal={isRenewal}
        />
      );

    case 'expired':
      return (
        <LicenseExpired
          onRenew={handleRenewClicked}
          reason={expiredReason.type}
        />
      );

    case 'ide':
      return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <MainIDE />
          <LicenseStatusWidget onRenew={handleRenewClicked} />
        </ThemeProvider>
      );

    default:
      return <LoadingScreen />;
  }
}

export default App;
