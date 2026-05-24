import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/layout/Hero";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <Header />
      <Hero />
    </main>
  );
}
