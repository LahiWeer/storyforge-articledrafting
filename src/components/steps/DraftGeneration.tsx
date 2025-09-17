import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Sparkles, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface StoryData {
  transcript: string;
  sources: Array<{
    id: string;
    type: 'pdf' | 'url' | 'youtube';
    content: string;
    title: string;
  }>;
  keyPoints: Array<{
    id: string;
    text: string;
    sources: string[];
    verified: boolean;
  }>;
  storyDirection: {
    tone: string;
    angle: string;
    length: string;
    customPrompt?: string;
  };
  draft: string;
  sourceMapping: Record<string, string[]>;
}

interface DraftGenerationProps {
  storyData: StoryData;
  onDraftGenerated: (draft: string, sourceMapping: Record<string, string[]>) => void;
}

export const DraftGeneration = ({ storyData, onDraftGenerated }: DraftGenerationProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const { toast } = useToast();

  const generateDraft = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    const steps = [
      { step: 'Analyzing key points...', duration: 1000 },
      { step: 'Structuring narrative...', duration: 1500 },
      { step: 'Writing introduction...', duration: 1200 },
      { step: 'Developing main content...', duration: 2000 },
      { step: 'Adding source references...', duration: 800 },
      { step: 'Finalizing draft...', duration: 500 },
    ];

    let totalProgress = 0;
    const progressStep = 100 / steps.length;

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i].step);
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      totalProgress += progressStep;
      setProgress(totalProgress);
    }

    // Generate mock draft based on story direction
    const mockDraft = generateMockDraft(storyData);
    const mockSourceMapping = generateMockSourceMapping(storyData);

    onDraftGenerated(mockDraft, mockSourceMapping);
    setIsGenerating(false);
    setCurrentStep('');
    
    toast({
      title: "Draft generated successfully",
      description: "Your story-driven article is ready for review",
    });
  };

  useEffect(() => {
    if (!storyData.draft) {
      generateDraft();
    }
  }, []);

  const generateMockDraft = (data: StoryData): string => {
    const { storyDirection, keyPoints } = data;
    
    const getIntroByAngle = () => {
      switch (storyDirection.angle) {
        case 'success-story':
          return "In a remarkable display of innovation and determination, the company has achieved unprecedented growth while navigating complex market challenges.";
        case 'challenges-overcome':
          return "Behind every success story lies a series of obstacles that seemed insurmountable. This is the story of how one team turned challenges into opportunities.";
        case 'innovation-focus':
          return "At the intersection of technology and human ingenuity, breakthrough innovations are reshaping entire industries. This is one such story.";
        default:
          return "In an exclusive interview, industry leaders share insights that could redefine how we think about modern business challenges.";
      }
    };

    const getToneModifier = () => {
      switch (storyDirection.tone) {
        case 'professional':
          return 'industry analysis reveals';
        case 'conversational':
          return 'as our conversation unfolded, it became clear that';
        case 'analytical':
          return 'data-driven insights demonstrate';
        case 'narrative':
          return 'the story begins with';
        default:
          return 'investigation shows';
      }
    };

    return `# ${getIntroByAngle()}

${getToneModifier()} several key factors have contributed to this remarkable transformation.

## Key Insights

${keyPoints.slice(0, 3).map((point, index) => `
**${index + 1}. ${point.text}**

This insight emerged during our conversation when discussing the strategic initiatives that have shaped the company's trajectory. The implementation of these changes has had a measurable impact on both operational efficiency and customer satisfaction.
`).join('\n')}

## The Bigger Picture

As we delve deeper into the implications of these developments, it becomes clear that the lessons learned here extend far beyond a single organization. The principles and strategies discussed offer valuable insights for anyone facing similar challenges in today's dynamic business environment.

${storyDirection.length === 'in-depth' ? `
## Technical Deep Dive

The technical challenges mentioned during our discussion reveal the complexity of modern business operations. From scalability concerns to infrastructure limitations, each obstacle presented an opportunity for innovative problem-solving.

## Future Implications

Looking ahead, the strategies and solutions discussed point to broader trends that will likely influence the industry for years to come. The proactive approach demonstrated here serves as a model for other organizations facing similar transitions.
` : ''}

## Conclusion

The journey outlined in this conversation demonstrates that with the right approach, vision, and execution, even the most daunting challenges can become stepping stones to success. As the industry continues to evolve, the insights shared here provide a valuable roadmap for future growth and innovation.

*This article is based on an exclusive interview and supported by industry research and documentation.*`;
  };

  const generateMockSourceMapping = (data: StoryData): Record<string, string[]> => {
    return {
      'paragraph-1': [data.sources[0]?.id || ''],
      'paragraph-2': data.keyPoints.slice(0, 2).map(kp => kp.sources[0]).filter(Boolean),
      'paragraph-3': [data.sources[0]?.id || ''],
    };
  };

  if (isGenerating) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
        </div>
        
        <h2 className="text-3xl font-heading font-semibold mb-2">Generating Your Story</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Our AI is crafting your article based on the key points and story direction you've set
        </p>
        
        <div className="max-w-md mx-auto space-y-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-primary font-medium">{currentStep}</p>
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          This typically takes 30-60 seconds
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <FileText className="w-16 h-16 text-success mx-auto mb-4" />
        <h2 className="text-3xl font-heading font-semibold mb-2 text-foreground">
          Draft Generated Successfully
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your story-driven article has been created based on your key points and direction. 
          Review the preview below before proceeding to final review.
        </p>
      </div>

      <Card className="p-8 bg-gradient-secondary/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Article Preview</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{storyData.draft.split(' ').length} words</span>
            <span>•</span>
            <span>{Math.ceil(storyData.draft.split(' ').length / 200)} min read</span>
          </div>
        </div>

        <div className="prose prose-gray max-w-none">
          <div className="bg-background p-6 rounded-lg border max-h-96 overflow-y-auto">
            <div 
              className="whitespace-pre-wrap font-editorial text-base leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: storyData.draft.replace(/\n/g, '<br />').replace(/#{1,6}/g, '') 
              }}
            />
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={generateDraft}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate Draft
          </Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4 text-center">
        <Card className="p-4">
          <h4 className="font-medium mb-1">Key Points</h4>
          <p className="text-2xl font-bold text-primary">{storyData.keyPoints.length}</p>
          <p className="text-xs text-muted-foreground">Incorporated</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-medium mb-1">Sources</h4>
          <p className="text-2xl font-bold text-primary">{storyData.sources.length}</p>
          <p className="text-xs text-muted-foreground">Referenced</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-medium mb-1">Tone</h4>
          <p className="text-sm font-medium text-primary capitalize">{storyData.storyDirection.tone}</p>
          <p className="text-xs text-muted-foreground">Applied</p>
        </Card>
      </div>
    </div>
  );
};