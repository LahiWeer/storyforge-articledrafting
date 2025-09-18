import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight, ArrowLeft } from 'lucide-react';
import { TranscriptInput } from './steps/TranscriptInput';
import { SourcesAttachment } from './steps/SourcesAttachment';
import { KeyPointsReview } from './steps/KeyPointsReview';
import { StoryDirection } from './steps/StoryDirection';
import { DraftGeneration } from './steps/DraftGeneration';
import { ReviewExport } from './steps/ReviewExport';

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
    source: string;
    status: 'VERIFIED' | 'UNVERIFIED' | 'NEEDS REVIEW';
    type: 'transcript' | 'source';
  }>;
  storyDirection: {
    tone: string;
    angle: string;
    length: string;
    customPrompt?: string;
  };
  draft: string;
  sourceMapping: Record<string, string[]>;
  articleFocus?: string; // Added to track article focus across steps
}

const steps = [
  { id: 1, title: 'Transcript', description: 'Upload or paste your interview transcript' },
  { id: 2, title: 'Sources', description: 'Attach supporting documents and references' },
  { id: 3, title: 'Key Points', description: 'Review and approve extracted insights' },
  { id: 4, title: 'Direction', description: 'Set tone, angle, and story approach' },
  { id: 5, title: 'Draft', description: 'Generate your story-driven article' },
  { id: 6, title: 'Review', description: 'Verify sources and export final draft' },
];

export const StoryGenerator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [storyData, setStoryData] = useState<StoryData>({
    transcript: '',
    sources: [],
    keyPoints: [],
    storyDirection: {
      tone: '',
      angle: '',
      length: '',
    },
    draft: '',
    sourceMapping: {},
  });

  const updateStoryData = (updates: Partial<StoryData>) => {
    setStoryData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return storyData.transcript.trim().length > 0;
      case 2:
        return storyData.sources.length > 0;
      case 3:
        return storyData.keyPoints.filter(point => point.status === 'VERIFIED').length > 0;
      case 4:
        return storyData.storyDirection.tone && storyData.storyDirection.angle;
      case 5:
        return storyData.draft.length > 0;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <TranscriptInput
            transcript={storyData.transcript}
            onTranscriptChange={(transcript) => updateStoryData({ transcript })}
          />
        );
      case 2:
        return (
          <SourcesAttachment
            sources={storyData.sources}
            onSourcesChange={(sources) => updateStoryData({ sources })}
            articleFocus={storyData.articleFocus}
          />
        );
      case 3:
        return (
          <KeyPointsReview
            transcript={storyData.transcript}
            sources={storyData.sources}
            keyPoints={storyData.keyPoints}
            onKeyPointsChange={(keyPoints) => updateStoryData({ keyPoints })}
            onArticleFocusChange={(articleFocus) => updateStoryData({ articleFocus })}
          />
        );
      case 4:
        return (
          <StoryDirection
            direction={storyData.storyDirection}
            onDirectionChange={(storyDirection) => updateStoryData({ storyDirection })}
          />
        );
      case 5:
        return (
          <DraftGeneration
            storyData={storyData}
            onDraftGenerated={(draft, sourceMapping) => 
              updateStoryData({ draft, sourceMapping })
            }
          />
        );
      case 6:
        return (
          <ReviewExport
            storyData={storyData}
            onDataUpdate={updateStoryData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header with Progress */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-primary"></div>
              <h1 className="text-2xl font-heading font-semibold text-foreground">
                Story Generator
              </h1>
            </div>
          </div>

          {/* Step Progress */}
          <div className="mb-8">
            <Progress value={(currentStep / steps.length) * 100} className="mb-6" />
            
            <div className="grid grid-cols-6 gap-4">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-colors">
                    {currentStep > step.id ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : currentStep === step.id ? (
                      <Circle className="w-5 h-5 text-primary" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className={`text-sm font-medium mb-1 ${
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-subtle hidden sm:block">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8 shadow-editorial">
          {renderStepContent()}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </div>

          <Button
            onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
            disabled={currentStep === steps.length || !canProceed()}
            className="flex items-center gap-2 bg-gradient-primary hover:bg-primary-hover"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};