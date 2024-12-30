import {StandaloneSearchBox, useJsApiLoader} from '@react-google-maps/api';
import { Libraries } from '@react-google-maps/api';
import { useState, useCallback } from 'react';

const GoogleMapsAPIKey = process.env.GOOGLE_MAPS_API_KEY as any;
const libraries: Libraries = ['places'];

export default function ReportPage() {

  const [newReport, setNewReport] = useState({
    location: "",
    type: "",
    amount: "",
  });

  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

  const {isLoaded} = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GoogleMapsAPIKey,
    libraries: libraries,
  });

  const onLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  }, []);

  const onPlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        setNewReport(prev=>({
          ...prev,
          location: place.formatted_address || '',
        }))
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value} = e.target;
    setNewReport({...newReport, [name]: value});

  };


  return (
    <div>
      {isLoaded ?(<StandaloneSearchBox
      onLoad={onLoad}
      onPlacesChanged={onPlacesChanged}
    >
      <input
        type="text"
        id="location"
        name="location"
        value={newReport.location}
        onChange={handleInputChange}
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
        placeholder="Enter waste location"
      />
    </StandaloneSearchBox>):(
      <input
        type="text"
        id="location"
        name="location"
        value={newReport.location}
        onChange={handleInputChange}
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
        placeholder="Enter waste location"
      />
    )}
    </div>
  )


}