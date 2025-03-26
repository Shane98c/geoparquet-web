import { useEffect, useRef } from "react";
import { Map } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ParquetFile, set_panic_hook } from "@geoarrow/geoparquet-wasm";
import { tableFromIPC } from "apache-arrow";
import { GeoArrowPolygonLayer } from "@geoarrow/deck.gl-layers";
import "maplibre-gl/dist/maplibre-gl.css";

const BASE_URL =
  "https://carbonplan-scratch.s3.us-west-2.amazonaws.com/OCR/LA_region_param_test_10mb.parquet";

const MIN_ZOOM = 13;

export default function App() {
  const deckOverlayRef = useRef(null);
  const mapRef = useRef(null);
  const parquetRef = useRef(null);

  useEffect(() => {
    const map = new Map({
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
      map.remove();
    };
  }, []);

  async function updateData() {
    const map = mapRef.current;
    const parquet = parquetRef.current;

    if (!map || !parquet) {
      console.log("Map or parquet not available yet");
      return;
    }

    if (map.getZoom() < MIN_ZOOM) {
      console.log("Zoom level below minimum, clearing layers");
      deckOverlayRef.current?.setProps({ layers: [] });
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
      bboxPaths: {
        xmin: ["bbox", "xmin"],
        ymin: ["bbox", "ymin"],
        xmax: ["bbox", "xmax"],
        ymax: ["bbox", "ymax"],
      },
    };

    set_panic_hook();

    try {
      const table = await parquet.read(readOptions);

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

      deckOverlayRef.current?.setProps({
        layers: [polygonLayer],
      });

      console.log("Layer updated with", jsTable.numRows, "features");
    } catch (err) {
      console.error("Error in updateData:", err);
    }
  }

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div id="map" style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
