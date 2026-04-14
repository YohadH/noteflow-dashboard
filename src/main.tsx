import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/push";

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void registerServiceWorker().catch(() => {
      // Push registration is handled explicitly in settings; silent failure here is acceptable.
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
