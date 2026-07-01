import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ConfigRoutes from "./routes";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <ConfigRoutes />
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
