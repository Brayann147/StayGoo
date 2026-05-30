import React from "react";
import HouseLoader from "./HouseLoader";
import "./DualLoader.css";

function DualLoader({ overlay = false, label = "Procesando..." }) {
  if (overlay) {
    return (
      <div className="dualLoaderOverlayContainer" role="dialog" aria-modal="true" aria-label={label}>
        <div className="dualLoaderGlassCard">
          <HouseLoader size={130} label={label} />
        </div>
      </div>
    );
  }

  return (
    <div className="dualLoaderInlineContainer">
      <HouseLoader size={100} label={label} />
    </div>
  );
}

export default DualLoader;
