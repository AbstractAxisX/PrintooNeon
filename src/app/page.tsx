import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Designer } from "@/components/neon/Designer";
import { Gallery } from "@/components/site/Gallery";
import { CraftStrip } from "@/components/site/CraftStrip";
import { Steps } from "@/components/site/Steps";
import { Faq } from "@/components/site/Faq";
import { Footer } from "@/components/site/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <Hero />
        </div>

        {/* ابزار طراحی — قلب سایت */}
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <Designer />
        </div>

        <div className="bg-muted/30">
          <Gallery />
        </div>

        <CraftStrip />
        <Steps />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
