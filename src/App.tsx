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

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/wizard" element={<WizardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/director" element={<DirectorPage />} />

        <Route path="/view" element={<ViewPage />} />
        <Route path="/edit" element={<EditPage />} />
        <Route path="/print" element={<PrintPage />} />
      </Routes>
    </HashRouter>
  );
}
