import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "./components/app-shell";
import "./styles.css";

document.documentElement.style.overflow = "hidden";
document.body.style.overflow = "hidden";
document.body.style.position = "fixed";
document.body.style.inset = "0";
document.body.style.width = "100%";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Elemento #root non trovato in index.html");
}

createRoot(root).render(
  <StrictMode>
    <div className="cosmic-bg h-full w-full overflow-hidden">
      <AppShell />
    </div>
  </StrictMode>,
);
