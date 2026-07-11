import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { FloatingLanguageToggle, LanguageProvider } from "./i18n.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
      <FloatingLanguageToggle />
    </LanguageProvider>
  </React.StrictMode>
);
