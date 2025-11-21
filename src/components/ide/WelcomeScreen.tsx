import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LicenseStatus } from "../../App";

interface WelcomeScreenProps {
  licenseStatus: LicenseStatus | null;
  onLicenseActivated: () => void;
  onSkip: () => void;
}

export default function WelcomeScreen({
  licenseStatus,
  onLicenseActivated,
  onSkip,
}: WelcomeScreenProps) {
  const [licenseKey, setLicenseKey] = useState("");
  const [certificate, setCertificate] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState("");
  const [showCertificateInput, setShowCertificateInput] = useState(false);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError("Please enter a license key");
      return;
    }

    setIsActivating(true);
    setError("");

    try {
      // For MVP, we'll create a simple mock certificate
      // In production, this would come from the server
      const mockCertificate = JSON.stringify({
        payload: {
          key: licenseKey,
          email: "user@example.com",
          tier: "annual",
          issued_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          features: ["unlimited_projects", "all_models"],
          version: "1.0",
        },
        signature: "mock_signature_for_development",
      });

      await invoke("activate_license", {
        licenseKey: licenseKey,
        certificate: certificate || mockCertificate,
      });

      onLicenseActivated();
    } catch (err) {
      setError(err as string);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 space-y-6">
          {/* Logo/Title */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary rounded-lg mx-auto flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Software Developer Agent IDE
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI-Powered Offline Development
            </p>
          </div>

          {/* License Status */}
          {licenseStatus && licenseStatus.status !== "NotActivated" && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-300">
                License Status: <strong>{licenseStatus.status}</strong>
              </p>
            </div>
          )}

          {/* License Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                License Key
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isActivating}
              />
            </div>

            {showCertificateInput && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Activation Certificate (Optional)
                </label>
                <textarea
                  value={certificate}
                  onChange={(e) => setCertificate(e.target.value)}
                  placeholder="Paste your activation certificate JSON here..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  disabled={isActivating}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={isActivating}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isActivating ? "Activating..." : "Activate License"}
            </button>

            <button
              onClick={() => setShowCertificateInput(!showCertificateInput)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              {showCertificateInput ? "Hide" : "I have"} Activation Certificate
            </button>

            {/* Development Mode Skip */}
            <button
              onClick={onSkip}
              className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm"
            >
              Skip for now (Development Mode)
            </button>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p>Don't have a license?</p>
            <a
              href="https://agent-at-your-desk.com/purchase"
              target="_blank"
              className="text-primary hover:underline"
            >
              Purchase License (€99/year)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
