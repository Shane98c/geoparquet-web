import React, { useEffect, useRef, useState } from "react";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ParquetDataset, set_panic_hook } from "@geoarrow/geoparquet-wasm";
import { tableFromIPC } from "apache-arrow";
import { GeoArrowPolygonLayer } from "@geoarrow/deck.gl-layers";

const BASE_URL =
  "https://carbonplan-scratch.s3.us-west-2.amazonaws.com/OCR/LA_region_quadkey13_100kb.parquet";

const MIN_ZOOM = 10;
const QUADKEY_ZOOM = 13;

function calculateQuadkeys(map, targetZoom = QUADKEY_ZOOM) {
  if (map.getZoom() < MIN_ZOOM) {
    console.log("Zoom level below minimum, returning empty quadkeys");
    return [];
  }
  // Get the current map bounds
  const bounds = map.getBounds();

  // Convert latitude/longitude to tile coordinates
  function latLonToTile(lat, lon, zoom) {
    const lat_rad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const xtile = Math.floor(((lon + 180.0) / 360.0) * n);
    const ytile = Math.floor(
      ((1.0 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI) /
        2.0) *
        n
    );
    return { x: xtile, y: ytile };
  }

  // Convert tile coordinates to quadkey
  function tileToQuadkey(x, y, zoom) {
    let quadkey = "";
    for (let z = zoom; z > 0; z--) {
      let digit = 0;
      const mask = 1 << (z - 1);
      if ((x & mask) !== 0) digit += 1;
      if ((y & mask) !== 0) digit += 2;
      quadkey += digit.toString();
    }
    return quadkey;
  }

  // Get the tile coordinates for the map view corners
  const nw = latLonToTile(bounds.getNorth(), bounds.getWest(), targetZoom);
  const se = latLonToTile(bounds.getSouth(), bounds.getEast(), targetZoom);

  // Calculate quadkeys for all tiles in the view
  const quadkeys = [];
  for (let x = nw.x; x <= se.x; x++) {
    for (let y = nw.y; y <= se.y; y++) {
      quadkeys.push(tileToQuadkey(x, y, targetZoom));
    }
  }

  console.log("Calculated quadkeys:", quadkeys);
  return quadkeys;
}

export default function QuadkeyDemo({ map }) {
  console.log("QuadkeyDemo rendered with map:", map);
  const parquetRef = useRef(null);
  const overlayRef = useRef(null);
  const [quadkeys, setQuadkeys] = useState([]);

  useEffect(() => {
    if (!map) {
      console.log("Map not available yet");
      return;
    }

    // Set up deck.gl overlay
    const overlay = new MapboxOverlay({
      interleaved: true,
      layers: [],
    });
    map.addControl(overlay);
    overlayRef.current = overlay;
    console.log("Added deck.gl overlay to map");

    // Initial data load
    const initialQuadkeys = calculateQuadkeys(map);
    console.log("Initial quadkeys:", initialQuadkeys);
    setQuadkeys(initialQuadkeys);

    map.on("moveend", () => {
      const newQuadkeys = calculateQuadkeys(map);
      console.log("New quadkeys after move:", newQuadkeys);
      setQuadkeys(newQuadkeys);
    });

    return () => {
      console.log("Cleaning up QuadkeyDemo");
      if (overlayRef.current) {
        map.removeControl(overlayRef.current);
      }
    };
  }, [map]);

  useEffect(() => {
    console.log("Quadkeys changed:", quadkeys);
    const setParquet = async () => {
      if (!quadkeys || quadkeys.length === 0) {
        console.log("No quadkeys found, skipping fetch");
        return;
      }

      // Skip if we already have a dataset with the same quadkeys
      if (parquetRef.current) {
        const currentQuadkeys = parquetRef.current.quadkeys;
        if (JSON.stringify(currentQuadkeys) === JSON.stringify(quadkeys)) {
          console.log("Quadkeys unchanged, reusing existing dataset");
          // Still need to update the data with new bbox
          if (map) {
            updateData();
          }
          return;
        }
      }

      console.log("Fetching parquet data from:", BASE_URL);
      console.log("Quadkeys to fetch:", quadkeys);

      try {
        const dataset = await new ParquetDataset(
          BASE_URL,
          quadkeys.map(
            (quadkey) => `quadkey_${QUADKEY_ZOOM}=${quadkey}/data_0.parquet`
          )
        );
        // Store the quadkeys with the dataset for future comparison
        dataset.quadkeys = quadkeys;
        console.log("Parquet data fetched successfully", dataset);
        parquetRef.current = dataset;

        // Only update data if we have both map and parquet
        if (map) {
          updateData();
        }
      } catch (err) {
        console.error("Error fetching parquet data:", err);
      }
    };

    setParquet();
  }, [quadkeys, map]);

  async function updateData() {
    console.log("updateData called");
    if (!map || !parquetRef.current || !overlayRef.current) {
      console.log("Map, overlay, or parquet not available yet");
      return;
    }

    if (map.getZoom() < MIN_ZOOM) {
      console.log("Zoom level below minimum, clearing layers");
      overlayRef.current.setProps({ layers: [] });
      return;
    }

    const bounds = map.getBounds();
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    console.log("Updating data for bbox:", bbox);

    const readOptions = {
      bbox,
    };

    set_panic_hook();

    try {
      const table = await parquetRef.current.read(readOptions);

      const arrowIPCStream = table.intoIPCStream();
      const jsTable = tableFromIPC(arrowIPCStream);
      console.log("Table converted to IPC, rows:", jsTable.numRows);

      const polygonLayer = new GeoArrowPolygonLayer({
        id: "polygon-layer",
        data: jsTable,
        getPolygon: jsTable.getChild("geometry") || undefined,
        filled: true,
        stroked: true,
        getFillColor: [0, 100, 60, 160],
        getLineColor: [255, 0, 0],
        lineWidthMinPixels: 1,
        pickable: true,
      });

      overlayRef.current.setProps({
        layers: [polygonLayer],
      });

      console.log("Layer updated with", jsTable.numRows, "features");
    } catch (err) {
      console.error("Error in updateData:", err);
    }
  }

  return null;
}
