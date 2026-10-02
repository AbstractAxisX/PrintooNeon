import { Designer } from "@/components/neon/Designer";
import { Gallery } from "@/components/site/Gallery";
import { Footer } from "@/components/site/Footer";
import { ThemeFab } from "@/components/site/ThemeFab";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <ThemeFab />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 pt-8 sm:px-6 sm:pt-10">
        <Designer />
        <Gallery />
      </main>
      <Footer />
    </div>
  );
}
