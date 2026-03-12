import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import ExplainerSection from "@/components/sections/ExplainerSection";
import FeatureCardsSection from "@/components/sections/FeatureCardsSection";
import SponsorsSection from "@/components/sections/SponsorsSection";
import UseCasesSection from "@/components/sections/UseCasesSection";
import PricingSection from "@/components/sections/PricingSection";
import FAQSection from "@/components/sections/FAQSection";
import ClosingCTASection from "@/components/sections/ClosingCTASection";

export default function Home() {
  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <ExplainerSection />
        <FeatureCardsSection />
        <SponsorsSection />
        <UseCasesSection />
        <PricingSection />
        <FAQSection />
        <ClosingCTASection />
      </main>
      <Footer />
    </div>
  );
}
