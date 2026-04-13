"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <SwaggerUI url="/api/doc" />
      </div>
    </div>
  );
}
