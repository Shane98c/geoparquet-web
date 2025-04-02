import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Map from "./components/Map";
import QuadkeyDemo from "./components/QuadkeyDemo";
import SingleParquetDemo from "./components/SingleParquetDemo";

function Navigation() {
  return (
    <nav
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: "rgba(255, 255, 255, 0.9)",
        padding: "10px",
        display: "flex",
        gap: "20px",
      }}
    >
      <Link to="/quadkey">Quadkey Demo</Link>
      <Link to="/singleparquet">Single Parquet Demo</Link>
      <Link to="/flatgeobuf">FlatGeobuf Demo</Link>
    </nav>
  );
}

function QuadkeyPage() {
  return (
    <Map>
      <Navigation />
      <QuadkeyDemo />
    </Map>
  );
}

function SingleParquetPage() {
  return (
    <Map>
      <Navigation />
      <SingleParquetDemo />
    </Map>
  );
}

function FlatGeobufPage() {
  return (
    <Map>
      <Navigation />
      <div
        style={{
          position: "absolute",
          top: "50px",
          left: "10px",
          background: "white",
          padding: "10px",
        }}
      >
        FlatGeobuf Demo (Coming Soon)
      </div>
    </Map>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<QuadkeyPage />} />
        <Route path="/quadkey" element={<QuadkeyPage />} />
        <Route path="/singleparquet" element={<SingleParquetPage />} />
        <Route path="/flatgeobuf" element={<FlatGeobufPage />} />
      </Routes>
    </Router>
  );
}
