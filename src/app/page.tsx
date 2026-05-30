import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/layout/Hero";
import { Features } from "@/components/layout/Features";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <Header />
      <Hero />
      <Features />
    </main>
  );
}
