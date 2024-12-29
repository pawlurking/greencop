import React, { useState } from 'react';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;

export default function ReportPage() {
  const [newReport, setNewReport] = useState({
    location: "",
    type: "",
    amount: "",
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const handleGeocoderResult = (result: any) => {
    if (result && result.place_name) {
      setNewReport((prev) => ({
        ...prev,
        location: result.place_name,
      }));
    }
  };

  React.useEffect(() => {
    // Simulate loading behavior for parity with Google Maps example
    setIsLoaded(true);
  }, []);

  return (
    <div>
      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
        Location
      </label>
      {isLoaded ? (
        <div className="relative">
          {/* This container will host the Mapbox Geocoder search box */}
          <div
            id="geocoder-container"
            className="w-full"
          ></div>

          {/* Initialize the Geocoder */}
          <MapboxGeocoderComponent
            accessToken={mapboxToken}
            onResult={handleGeocoderResult}
          />
        </div>
      ) : (
        <input
          type="text"
          id="location"
          name="location"
          value={newReport.location}
          onChange={(e) => setNewReport({ ...newReport, location: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
          placeholder="Enter waste location"
        />
      )}
    </div>
  );
}

function MapboxGeocoderComponent({
  accessToken,
  onResult,
}: {
  accessToken: string;
  onResult: (result: any) => void;
}) {
  React.useEffect(() => {
    const geocoder = new MapboxGeocoder({
      accessToken: accessToken,
      placeholder: 'Enter waste location',
      proximity: undefined,
      mapboxgl: undefined,
    });

    const container = document.getElementById('geocoder-container');
    if (container) {
      container.innerHTML = ""; // Clear existing content to prevent duplicates
      geocoder.addTo(container);
    }

    geocoder.on('result', (e) => {
      onResult(e.result);
    });

    return () => {
      geocoder.off('result', () => {});
      geocoder.clear();
    };
  }, [accessToken, onResult]);

  return null;
}
