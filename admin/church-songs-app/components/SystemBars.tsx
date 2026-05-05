"use client";

import { useEffect } from "react";
import { NavigationBar } from "@capgo/capacitor-navigation-bar";
import { StatusBar, Style } from "@capacitor/status-bar";

export default function SystemBars() {
  useEffect(() => {
    const setBars = async () => {
      // Bottom navigation bar
      await NavigationBar.setNavigationBarColor({
        color: "#fef2f2",
        darkButtons: true,
      });

      // Top status bar
      await StatusBar.setBackgroundColor({
        color: "#fef2f2",
      });

      // Dark icons/text on light background
      await StatusBar.setStyle({
        style: Style.Light,
      });
    };

    setBars();
  }, []);

  return null;
}