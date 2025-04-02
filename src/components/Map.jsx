import React, { useEffect, useRef, useState } from "react";
import { Map as MapLibre } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import "maplibre-gl/dist/maplibre-gl.css";

export default function Map({ children }) {
  const deckOverlayRef = useRef(null);
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    const map = new MapLibre({
      container: "map",
      style: "https://demotiles.maplibre.org/style.json",
      center: [-111.5, 39],
      zoom: 6,
    });

    const overlay = new MapboxOverlay({
      interleaved: true,
      layers: [],
    });
    map.addControl(overlay);

    deckOverlayRef.current = overlay;
    mapRef.current = map;

    map.on("load", () => {
      setIsMapReady(true);
    });

    return () => {
      map.remove();
    };
  }, []);

  // Clone children with map and overlay props
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        map: mapRef.current,
        overlay: deckOverlayRef.current,
      });
    }
    return child;
  });

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div id="map" style={{ width: "100%", height: "100%" }} />
      {isMapReady && childrenWithProps}
    </div>
  );
}
