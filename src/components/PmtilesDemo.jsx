import React, { useEffect } from "react";

const BASE_URL =
  "https://carbonplan-scratch.s3.us-west-2.amazonaws.com/OCR/LA_region_coiled.pmtiles";

export default function PmtilesDemo({ map }) {
  useEffect(() => {
    if (!map) {
      console.log("Map not available yet");
      return;
    }

    // Add the source and layers
    map.addSource("buildings", {
      type: "vector",
      url: `pmtiles://${BASE_URL}`,
    });

    // Add fill layer
    map.addLayer({
      id: "buildings-fill",
      type: "fill",
      source: "buildings",
      "source-layer": "LA_regionfgb",
      paint: {
        "fill-color": "#627BC1",
        "fill-opacity": 0.4,
      },
    });

    // Add line layer
    map.addLayer({
      id: "buildings-line",
      type: "line",
      source: "buildings",
      "source-layer": "LA_regionfgb",
      paint: {
        "line-color": "#627BC1",
        "line-opacity": 0.8,
        "line-width": 1,
      },
    });

    // Cleanup function
    return () => {
      try {
        if (!map) return;
        if (map.getLayer("buildings-fill")) {
          map.removeLayer("buildings-fill");
        }
        if (map.getLayer("buildings-line")) {
          map.removeLayer("buildings-line");
        }
        if (map.getSource("buildings")) {
          map.removeSource("buildings");
        }
      } catch (error) {
        console.log("Error during cleanup:", error);
      }
    };
  }, [map]);

  return null;
}
