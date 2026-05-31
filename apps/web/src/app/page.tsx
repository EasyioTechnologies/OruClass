import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { LearnByBuildingSection } from "@/components/marketing/LearnByBuildingSection";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { FinalCTASection } from "@/components/marketing/FinalCTASection";
import { Footer } from "@/components/marketing/Footer";

export default function LandingPage() {
  return (
    <main className="h-screen w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth bg-white selection:bg-gray-200 selection:text-black">
      <MarketingNavbar />
      <HeroSection />
      <FeaturesSection />
      <LearnByBuildingSection />
      <DashboardPreview />
      <HowItWorksSection />
      <FinalCTASection />
      <Footer />
    </main>
  );
}
