  (function () {
    const isCapacitorNative =
      !!window.Capacitor &&
      typeof window.Capacitor.getPlatform === "function" &&
      window.Capacitor.getPlatform() !== "web";

    if (isCapacitorNative) document.documentElement.classList.add("cap-native");
  })();