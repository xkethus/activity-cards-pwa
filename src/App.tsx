import { HashRouter, Route, Routes } from "react-router-dom";
import { ViewPage } from "./pages/ViewPage";
import { EditPage } from "./pages/EditPage";
import { PrintPage } from "./pages/PrintPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ViewPage />} />
        <Route path="/edit" element={<EditPage />} />
        <Route path="/print" element={<PrintPage />} />
      </Routes>
    </HashRouter>
  );
}
