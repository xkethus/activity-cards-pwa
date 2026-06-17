import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { DocsPage } from "./pages/DocsPage";
import { WizardPage } from "./pages/WizardPage";
import { AdminPage } from "./pages/AdminPage";
import { DirectorPage } from "./pages/DirectorPage";
import { ViewPage } from "./pages/ViewPage";
import { EditPage } from "./pages/EditPage";
import { PrintPage } from "./pages/PrintPage";
import { SaturacionPage } from "./pages/SaturacionPage";
import { AyudaPage } from "./pages/AyudaPage";
import { refreshAuthFromSession, onAuthChange } from "./lib/auth";

export default function App() {
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    refreshAuthFromSession().finally(() => {
      if (alive) setReady(true);
    });
    const off = onAuthChange(async () => {
      await refreshAuthFromSession();
      if (alive) setTick((t) => t + 1);
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        Cargando…
      </div>
    );
  }

  return (
    <HashRouter key={tick}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/wizard" element={<WizardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/director" element={<DirectorPage />} />
        <Route path="/saturacion" element={<SaturacionPage />} />
        <Route path="/ayuda" element={<AyudaPage />} />

        <Route path="/view" element={<ViewPage />} />
        <Route path="/edit" element={<EditPage />} />
        <Route path="/print" element={<PrintPage />} />
      </Routes>
    </HashRouter>
  );
}
