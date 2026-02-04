
let googleMapsPromise: Promise<void> | null = null;

export const loadGoogleMaps = (): Promise<void> => {
  if ((window as any).google && (window as any).google.maps) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error("Google Maps API key is missing"));
      return;
    }

    // Check if script is already in DOM to prevent duplicates
    if (document.getElementById('google-maps-script')) {
        // Wait a bit for it to load
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            if ((window as any).google && (window as any).google.maps) {
                clearInterval(checkInterval);
                resolve();
            } else if (attempts > 50) { // 5 seconds
                clearInterval(checkInterval);
                reject(new Error("Google Maps script present but not loading"));
            }
        }, 100);
        return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';
    
    script.onload = () => {
        console.error('GOOGLE MAPS SCRIPT LOADED');
        resolve();
    };
    
    script.onerror = (err) => {
        console.error('GOOGLE MAPS SCRIPT FAILED TO LOAD', err);
        reject(err);
    };

    document.head.appendChild(script);
    
    // Safety Timeout (10 seconds)
    setTimeout(() => {
        if (!((window as any).google && (window as any).google.maps)) {
            reject(new Error("Google Maps load timeout"));
        }
    }, 10000);
  });

  return googleMapsPromise;
};
