import React from "react";
import ErrorBoundary from "../../error/ErrorBoundary";
import App from "./App";
import { AppAuthGate } from "./App";

const AppWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <AppAuthGate>
      <App />
    </AppAuthGate>
  </ErrorBoundary>
);

export default AppWithErrorBoundary;
