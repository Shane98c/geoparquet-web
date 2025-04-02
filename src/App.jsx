import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Map from "./components/Map";
import QuadkeyDemo from "./components/QuadkeyDemo";
import SingleParquetDemo from "./components/SingleParquetDemo";
import FlatGeoBufDemo from "./components/FlatGeoBufDemo";

const Navigation = () => (
  <nav style={{ padding: "1rem", backgroundColor: "#f0f0f0" }}>
    <ul
      style={{
        listStyle: "none",
        display: "flex",
        gap: "1rem",
        margin: 0,
        padding: 0,
      }}
    >
      <li>
        <Link to="/quadkey">Quadkey Demo</Link>
      </li>
      <li>
        <Link to="/singleparquet">Single Parquet Demo</Link>
      </li>
      <li>
        <Link to="/flatgeobuf">FlatGeobuf Demo</Link>
      </li>
    </ul>
  </nav>
);

const QuadkeyPage = () => (
  <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
    <Navigation />
    <div style={{ flex: 1 }}>
      <Map>
        <QuadkeyDemo />
      </Map>
    </div>
  </div>
);

const SingleParquetPage = () => (
  <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
    <Navigation />
    <div style={{ flex: 1 }}>
      <Map>
        <SingleParquetDemo />
      </Map>
    </div>
  </div>
);

const FlatGeobufPage = () => (
  <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
    <Navigation />
    <div style={{ flex: 1 }}>
      <Map>
        <FlatGeoBufDemo />
      </Map>
    </div>
  </div>
);

function App() {
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

export default App;
