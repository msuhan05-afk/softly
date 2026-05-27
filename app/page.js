import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ScenarioScroll from "@/components/ScenarioScroll";
import AppPreview from "@/components/AppPreview";
import DiaryEntries from "@/components/DiaryEntries";
import Practice from "@/components/Practice";
import Waitlist from "@/components/Waitlist";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import RevealMount from "@/components/RevealMount";

export default function Page() {
  return (
    <main className="relative overflow-x-hidden">
      <Nav />
      <Hero />
      <ScenarioScroll />
      <AppPreview />
      <Practice />
      <DiaryEntries />
      <Waitlist />
      <FAQ />
      <Footer />
      <RevealMount />
    </main>
  );
}
