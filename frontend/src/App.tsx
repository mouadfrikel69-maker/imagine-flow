import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import TextToImage from "./pages/TextToImage";
import ImageToText from "./pages/ImageToText";

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/text-to-image" element={<TextToImage />} />
          <Route path="/image-to-text" element={<ImageToText />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
