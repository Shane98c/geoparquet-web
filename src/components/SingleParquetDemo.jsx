import React, { useEffect, useRef } from "react";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ParquetFile, set_panic_hook } from "@geoarrow/geoparquet-wasm";
import { tableFromIPC } from "apache-arrow";
import { GeoArrowPolygonLayer } from "@geoarrow/deck.gl-layers";

const BASE_URL =
  "https://carbonplan-scratch.s3.us-west-2.amazonaws.com/OCR/LA_region_geoarrow_500000_RGS.parquet";

const MIN_ZOOM = 13;

export default function SingleParquetDemo({ map }) {
  const parquetRef = useRef(null);
  const overlayRef = useRef(null);

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

    const fetchParquetMeta = async () => {
      if (parquetRef.current) {
        console.log("Parquet already loaded, skipping fetch");
        return;
      }

      console.log("Fetching parquet data from:", BASE_URL);

      try {
        const dataset = await new ParquetFile(BASE_URL);
        console.log("Parquet data fetched successfully", dataset);
        parquetRef.current = dataset;
        updateData();
      } catch (err) {
        console.error("Error fetching parquet data:", err);
      }
    };

    fetchParquetMeta();

    map.on("moveend", () => {
      updateData();
    });

    return () => {
      if (overlayRef.current) {
        map.removeControl(overlayRef.current);
      }
    };
  }, [map]);

  async function updateData() {
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
