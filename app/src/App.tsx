import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Header } from "./components/Header";
import { Footer } from "./components/Sections";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  const { t } = useTranslation();
  return (
    <BrowserRouter>
      {/* F02: スキップリンク */}
      <a data-ui="F02" className="skip-link" href="#main">
        {t("skipToContent")}
      </a>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <main id="main">
              <HomePage />
            </main>
          }
        />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
