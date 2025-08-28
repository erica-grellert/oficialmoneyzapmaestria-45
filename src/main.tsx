import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Novo conteúdo disponível. Atualizar?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {},
});

createRoot(document.getElementById("root")!).render(<App />);
