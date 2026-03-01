import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import './InstallPWA.css';

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
        // If dismissed, keep the banner visible
    };

    if (!isVisible) return null;

    return (
        <div className="install-pwa-banner">
            <div className="install-pwa-content">
                <div className="install-pwa-info">
                    <Download className="install-icon" size={20} />
                    <span>Install DTEHub app for better experience!</span>
                </div>
                <div className="install-pwa-actions">
                    <button className="btn-install" onClick={handleInstall}>Install Now</button>
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;
