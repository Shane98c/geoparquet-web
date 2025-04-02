import React, { useEffect } from "react";
import { geojson } from "flatgeobuf";

const BASE_URL =
  "https://carbonplan-scratch.s3.us-west-2.amazonaws.com/OCR/LA_region.fgb";

const MIN_ZOOM = 13;

export default function FlatGeoBufDemo({ map }) {
  useEffect(() => {
    if (!map) {
      console.log("Map not available yet");
      return;
    }

    // Add the source and layers
    map.addSource("buildings", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    // Add fill layer
    map.addLayer({
      id: "buildings-fill",
      type: "fill",
      source: "buildings",
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
      paint: {
        "line-color": "#627BC1",
        "line-opacity": 0.8,
        "line-width": 1,
      },
    });

    // Initial data load
    updateData();

    // Update data on map move
    const moveEndHandler = () => {
      updateData();
    };
    map.on("moveend", moveEndHandler);

    // Cleanup function
    return () => {
      try {
        if (!map) return;
        // Remove event listener first
        map.off("moveend", moveEndHandler);
        // Then remove layers and source
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

  async function updateData() {
    if (!map) {
      console.log("Map not available yet");
      return;
    }

    if (map.getZoom() < MIN_ZOOM) {
      console.log("Zoom level below minimum, clearing data");
      map
        .getSource("buildings")
        .setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const bounds = map.getBounds();
    const bbox = {
      minX: bounds.getWest(),
      minY: bounds.getSouth(),
      maxX: bounds.getEast(),
      maxY: bounds.getNorth(),
    };

    try {
      const fc = { type: "FeatureCollection", features: [] };

      const iter = geojson.deserialize(BASE_URL, bbox);
      for await (const feature of iter) {
        fc.features.push(feature);
      }

      map.getSource("buildings").setData(fc);
      console.log("Layer updated with", fc.features.length, "buildings");
    } catch (err) {
      console.error("Error in updateData:", err);
    }
  }

  return null;
}
