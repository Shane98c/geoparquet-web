import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { layers, namedFlavor } from "@protomaps/basemaps";
import { Protocol } from "pmtiles";

const backgroundColor = "#1b1e23";

const mapTheme = {
  ...namedFlavor("black"),
  buildings: backgroundColor,
  background: backgroundColor,
  earth: backgroundColor,
  park_a: backgroundColor,
  park_b: backgroundColor,
  golf_course: backgroundColor,
  aerodrome: backgroundColor,
  industrial: backgroundColor,
  university: backgroundColor,
  school: backgroundColor,
  zoo: backgroundColor,
  farmland: backgroundColor,
  wood_a: backgroundColor,
  wood_b: backgroundColor,
  residential: backgroundColor,
  protected_area: backgroundColor,
  scrub_a: backgroundColor,
  scrub_b: backgroundColor,
  landcover: {
    barren: backgroundColor,
    farmland: backgroundColor,
    forest: backgroundColor,
    glacier: backgroundColor,
    grassland: backgroundColor,
    scrub: backgroundColor,
    urban_area: backgroundColor,
  },
  regular: "Relative Pro Book",
  bold: "Relative Pro Book",
  italic: "Relative Pro Book",
};

export default function Map({ children }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs:
          "https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/fonts/{fontstack}/{range}.pbf",
        sources: {
          protomaps: {
            type: "vector",
            url: "pmtiles://https://demo-bucket.protomaps.com/v4.pmtiles",
            attribution:
              '<a href="https://overturemaps.org/">Overture Maps</a>, <a href="https://protomaps.com">Protomaps</a>, © <a href="https://openstreetmap.org">OpenStreetMap</a>',
          },
        },
        layers: layers("protomaps", mapTheme, { lang: "en" }),
      },
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
