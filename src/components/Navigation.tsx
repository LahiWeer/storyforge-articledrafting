import { Button } from "@/components/ui/button";
import { PenTool, Home, FileText } from "lucide-react";

interface NavigationProps {
  currentSection: 'home' | 'generator';
  onNavigate: (section: 'home' | 'generator') => void;
}

export const Navigation = ({ currentSection, onNavigate }: NavigationProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center space-x-2">
          <PenTool className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-accent bg-clip-text text-transparent">
            StoryForge
          </span>
        </div>

        <nav className="flex items-center space-x-6">
          <Button
            variant={currentSection === 'home' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Button>
          
          <Button
            variant={currentSection === 'generator' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate('generator')}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Story Generator</span>
          </Button>
        </nav>
      </div>
    </header>
  );
};