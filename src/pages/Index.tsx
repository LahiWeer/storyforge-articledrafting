import heroImage from "@/assets/hero-editorial.jpg";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StoryGenerator } from "@/components/StoryGenerator";
import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { FileText, Users, Shield, Zap } from "lucide-react";
const Index = () => {
  const [showGenerator, setShowGenerator] = useState(false);
  const handleNavigation = (section: 'home' | 'generator') => {
    setShowGenerator(section === 'generator');
  };
  if (showGenerator) {
    return <div className="min-h-screen bg-background">
        <Navigation currentSection="generator" onNavigate={handleNavigation} />
        <StoryGenerator />
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <Navigation currentSection="home" onNavigate={handleNavigation} />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-cover bg-center opacity-65" style={{
        backgroundImage: `url(${heroImage})`
      }} />
        <div className="relative container mx-auto px-6 py-24 lg:py-32">
  <div className="max-w-4xl mx-auto text-center text-white">
    <h1 className="text-5xl lg:text-7xl font-heading font-bold mb-10 leading-tight" style={{
      color: '#1976D2'
    }}>
      <span className="block pb-2 sm:pb-4">Transform Interviews into</span>
      <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-[8E44AD] text-[#d2f8ff]">
        Story-Driven Articles
      </span>
    </h1>
    <p className="text-xl lg:text-2xl mb-8 text-white/90 max-w-3xl mx-auto font-editorial">
      Our AI-powered platform turns raw interview transcripts into compelling,
      fact-checked stories with full source verification and human oversight.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button size="lg" className="text-lg px-8 py-4 bg-[#1b3b6f] text-white hover:bg-[#00798c]" onClick={() => setShowGenerator(true)}>
        Start Creating Stories
      </Button>
    </div>
  </div>
</div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold mb-4 text-foreground">
              Professional Editorial Workflow
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From transcript to published story, every step is designed for accuracy, 
              verification, and editorial control.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 hover:shadow-editorial transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Extraction</h3>
              <p className="text-muted-foreground">
                AI identifies key insights from transcripts and cross-references with your sources
              </p>
            </Card>

            <Card className="p-6 hover:shadow-editorial transition-all">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Human-in-the-Loop</h3>
              <p className="text-muted-foreground">
                Review, edit, and approve every key point before it becomes part of your story
              </p>
            </Card>

            <Card className="p-6 hover:shadow-editorial transition-all">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Source Verification</h3>
              <p className="text-muted-foreground">
                Automatic quote checking and source mapping ensures editorial integrity
              </p>
            </Card>

            <Card className="p-6 hover:shadow-editorial transition-all">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Story Direction</h3>
              <p className="text-muted-foreground">
                Set tone, angle, and approach to craft narratives that resonate with your audience
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24" style={{
      backgroundColor: '#61a5c2'
    }}>
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-heading font-bold mb-6 text-secondary-foreground">
            Ready to Transform Your Interviews?
          </h2>
          <p className="text-xl text-secondary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join journalists and content creators who trust our platform for 
            accurate, engaging storytelling.
          </p>
          <Button size="lg" className="text-lg px-8 py-4 bg-primary hover:bg-primary-hover" onClick={() => setShowGenerator(true)}>
            Get Started Now
          </Button>
        </div>
      </section>
    </div>;
};
export default Index;