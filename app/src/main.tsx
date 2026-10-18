import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import fontUrl from "@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2?url";
import App from "./App";
import "./index.css";

/**
 * El Glyph Portal mide la tinta real de cada letra: la fuente debe estar cargada ANTES de montarlo
 * (mismo patrón que el demo de 21st.dev). En el build de un solo archivo la fuente va embebida.
 */
const FAMILY = '"Greetings Jakarta", Arial, sans-serif';

async function loadFace(): Promise<string> {
  const face = new FontFace("Greetings Jakarta", `url("${fontUrl}") format("woff2")`, { weight: "200 800", display: "block" });
  const timeout = new Promise<string>((resolve) => window.setTimeout(() => resolve("Arial, sans-serif"), 1600));
  const loaded = face.load().then((f) => {
    document.fonts.add(f);
    return FAMILY;
  }, () => "Arial, sans-serif");
  return Promise.race([loaded, timeout]);
}

loadFace().then((face) => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App face={face} />
    </StrictMode>,
  );
});
