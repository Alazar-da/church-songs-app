"use client";

import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";
import { motion, AnimatePresence } from "framer-motion";
import { FaWifi, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { FiWifiOff } from "react-icons/fi";

export default function NetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const status = await Network.getStatus();
      handleStatusChange(status.connected);
    };

    checkConnection();

    const listener = Network.addListener(
      "networkStatusChange",
      (status) => {
        handleStatusChange(status.connected);
      }
    );

    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

  const handleStatusChange = (connected: boolean) => {
    if (connected !== isConnected) {
      setIsConnected(connected);
      setShowNotification(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
  };

  return (
    <AnimatePresence>
      {/* Offline Banner - Persistent */}
      {!isConnected && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white shadow-lg"
        >
          <div className="px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <FiWifiOff className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">No Internet Connection</p>
                  <p className="text-xs text-white/80">Some features may be unavailable</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                <FaExclamationTriangle className="w-3 h-3" />
                <span>Offline</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Temporary Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-auto min-w-[200px] max-w-[90vw]"
          >
            <div className={`rounded-xl shadow-lg overflow-hidden ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <div className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    {isConnected ? (
                      <FaWifi className="w-4 h-4 text-white" />
                    ) : (
                      <FiWifiOff className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">
                      {isConnected ? "Connected" : "Disconnected"}
                    </p>
                    <p className="text-white/80 text-xs">
                      {isConnected ? "Back online" : "Connection lost"}
                    </p>
                  </div>
                  {isConnected && <FaCheckCircle className="w-4 h-4 text-white/80" />}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}