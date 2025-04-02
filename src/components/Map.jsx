import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function Map({ children }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-118.2437, 34.0522],
      zoom: 9,
    });

    map.current.on("load", () => {
      console.log("Map loaded");
      setIsMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div ref={mapContainer} style={{ width: "100%", height: "100%" }}>
      {isMapLoaded &&
        map.current &&
        React.Children.map(children, (child) =>
          React.cloneElement(child, { map: map.current })
        )}
    </div>
  );
}
