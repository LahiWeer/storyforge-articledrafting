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
    type: 'pdf' | 'url' | 'youtube' | 'text';
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
    const { storyDirection, keyPoints, sources, transcript } = data;
    const verifiedKeyPoints = keyPoints.filter(point => point.verified);
    
    // Get source attributions for verified points
    const getSourceAttribution = (keyPoint: any) => {
      if (keyPoint.sources && keyPoint.sources.length > 0) {
        const sourceId = keyPoint.sources[0];
        const source = sources.find(s => s.id === sourceId);
        if (source) {
          switch (source.type) {
            case 'pdf':
            case 'url':
              return `Based on ${source.title}`;
            case 'youtube':
              return `According to the video interview`;
            case 'text':
              return `Based on the provided documentation`;
            default:
              return `According to the interview`;
          }
        }
      }
      return `According to the interviewee`;
    };

    const getIntroByAngle = () => {
      const hasTranscript = transcript && transcript.length > 50;
      switch (storyDirection.angle) {
        case 'success-story':
          return hasTranscript 
            ? "In a candid conversation, leadership shared insights into their journey of transformation and growth."
            : "Industry leaders have achieved remarkable results through strategic innovation and determination [UNVERIFIED].";
        case 'challenges-overcome':
          return hasTranscript 
            ? "During our discussion, it became clear how significant obstacles were transformed into opportunities for growth."
            : "Behind the success story lies a series of challenges that were systematically addressed [UNVERIFIED].";
        case 'innovation-focus':
          return hasTranscript 
            ? "The interview revealed how cutting-edge approaches are reshaping traditional business practices."
            : "At the intersection of technology and strategy, breakthrough innovations are emerging [UNVERIFIED].";
        default:
          return hasTranscript 
            ? "In an exclusive interview, key insights emerged about current market dynamics and strategic approaches."
            : "Industry analysis reveals significant developments in the current market landscape [UNVERIFIED].";
      }
    };

    const getToneStyle = () => {
      switch (storyDirection.tone) {
        case 'professional':
          return 'formal analysis';
        case 'conversational':
          return 'discussion-based insights';
        case 'analytical':
          return 'data-driven examination';
        case 'narrative':
          return 'story-driven exploration';
        default:
          return 'comprehensive review';
      }
    };

    return `# ${getIntroByAngle()}

This ${getToneStyle()} draws from ${transcript ? 'our conversation and' : ''} supporting documentation to examine key developments and their implications.

## Key Findings

${verifiedKeyPoints.map((point, index) => {
  const attribution = getSourceAttribution(point);
  return `### ${index + 1}. ${point.text}

${attribution}, this development represents a significant factor in the overall narrative. ${storyDirection.tone === 'analytical' ? 'The data supporting this observation' : 'This insight'} ${storyDirection.tone === 'conversational' ? 'came up naturally in our discussion' : 'emerged from the analysis'}.

`;
}).join('')}

## Analysis and Context

${storyDirection.tone === 'conversational' ? 'Throughout our conversation,' : 'The examination reveals that'} these key points interconnect to form a comprehensive picture. ${verifiedKeyPoints.length > 0 ? `${getSourceAttribution(verifiedKeyPoints[0])}, the primary theme centers on strategic adaptation and execution.` : 'The overall theme focuses on strategic development [UNVERIFIED].'} 

${sources.length > 1 ? `Cross-referencing multiple sources confirms` : sources.length === 1 ? `Based on the available source,` : `Without additional verification,`} the consistency of these findings${sources.length === 0 ? ' [UNVERIFIED]' : ''}.

${storyDirection.length === 'in-depth' && verifiedKeyPoints.length > 3 ? `
## Deeper Implications

${verifiedKeyPoints.slice(3).map(point => {
  const attribution = getSourceAttribution(point);
  return `${attribution}, ${point.text.toLowerCase()} This adds another layer to our understanding of the broader strategic landscape.`;
}).join(' ')}

The interconnected nature of these developments suggests a coordinated approach to addressing market challenges${transcript ? ', as evidenced in our discussion' : ' [UNVERIFIED]'}.
` : ''}

## Conclusion

${storyDirection.tone === 'conversational' ? 'Our conversation revealed' : 'The analysis demonstrates'} that ${verifiedKeyPoints.length > 0 ? 'the documented insights provide' : 'the available information suggests [UNVERIFIED]'} a framework for understanding current market dynamics. 

${sources.length > 0 ? `The supporting documentation reinforces` : `While comprehensive verification is pending,`} these findings${sources.length === 0 ? ' [UNVERIFIED]' : ''} point toward significant implications for industry stakeholders.

---
*Editor's Note: This article is based on ${transcript ? 'interview content and ' : ''}${sources.length} supporting source${sources.length !== 1 ? 's' : ''}. Claims marked [UNVERIFIED] require additional confirmation before publication.*`;
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
          <p className="text-2xl font-bold text-primary">{storyData.keyPoints.filter(point => point.verified).length}</p>
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