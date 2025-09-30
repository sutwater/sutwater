import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import ConfigRoutes from "./routes";
import "./App.css";

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <ConfigRoutes />
      </Router>
    </AppProvider>
  );
};

export default App;
