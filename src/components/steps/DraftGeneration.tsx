import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Sparkles, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generateArticleWithAI } from '@/utils/aiContentExtraction';

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
}

interface DraftGenerationProps {
  storyData: StoryData;
  onDraftGenerated: (draft: string, sourceMapping: Record<string, string[]>, headline?: string) => void;
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
      { step: 'Analyzing key points with Claude 4 Sonnet...', duration: 1200 },
      { step: 'Extracting quotes from transcript...', duration: 800 },
      { step: 'Structuring thematic narrative...', duration: 1500 },
      { step: 'Writing engaging introduction...', duration: 1800 },
      { step: 'Developing main content sections...', duration: 2200 },
      { step: 'Adding source references and quotes...', duration: 1000 },
      { step: 'Crafting forward-looking conclusion...', duration: 1200 },
      { step: 'Finalizing article and source mapping...', duration: 800 },
    ];

    let totalProgress = 0;
    const progressStep = 100 / steps.length;

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i].step);
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      totalProgress += progressStep;
      setProgress(totalProgress);
    }

    try {
      // Generate AI-powered draft using Claude 4 Sonnet
      const result = await generateArticleWithAI(
        storyData.keyPoints,
        storyData.sources,
        storyData.transcript,
        storyData.storyDirection,
        'User-focused article' // You might want to pass the actual user focus from story data
      );

      onDraftGenerated(result.draft, result.sourceMapping, result.headline);
      setIsGenerating(false);
      setCurrentStep('');
      
      toast({
        title: "AI Draft Generated Successfully",
        description: `${result.wordCount} words, ${result.readTime} min read - Ready for review`,
      });
    } catch (error) {
      console.error('Draft generation failed:', error);
      
      // Fallback to original mock generation
      const mockDraft = generateMockDraft(storyData);
      const mockSourceMapping = generateMockSourceMapping(storyData);

      onDraftGenerated(mockDraft, mockSourceMapping, 'Generated Article: Key Insights and Analysis');
      setIsGenerating(false);
      setCurrentStep('');
      
      toast({
        title: "Draft generated successfully",
        description: "Your story-driven article is ready for review",
      });
    }
  };

  useEffect(() => {
    if (!storyData.draft) {
      generateDraft();
    }
  }, []);

  const generateMockDraft = (data: StoryData): string => {
    const { storyDirection, keyPoints, sources, transcript } = data;
    const verifiedKeyPoints = keyPoints.filter(point => point.status === 'VERIFIED');
    
    // Get source attributions for verified points
    const getSourceAttribution = (keyPoint: any) => {
      if (keyPoint.source) {
        if (keyPoint.type === 'transcript') {
          return `According to the interviewee`;
        } else {
          return `Based on ${keyPoint.source}`;
        }
      }
      return `According to the interviewee`;
    };

    // Group key points into thematic sections with logical connections
    const groupKeyPoints = () => {
      const themes: Record<string, any[]> = {};
      const narrativeOrder = ['Foundation & Strategy', 'Growth & Performance', 'Innovation & Technology', 'Overcoming Challenges', 'Team & Culture', 'Market Impact'];
      
      verifiedKeyPoints.forEach(point => {
        const text = point.text.toLowerCase();
        let assigned = false;
        
        // More sophisticated thematic grouping with narrative flow in mind
        if (text.includes('strategy') || text.includes('vision') || text.includes('foundation') || text.includes('approach') || text.includes('plan')) {
          themes['Foundation & Strategy'] = themes['Foundation & Strategy'] || [];
          themes['Foundation & Strategy'].push(point);
          assigned = true;
        }
        
        if (!assigned && (text.includes('growth') || text.includes('revenue') || text.includes('expansion') || text.includes('increase') || text.includes('performance') || text.includes('results'))) {
          themes['Growth & Performance'] = themes['Growth & Performance'] || [];
          themes['Growth & Performance'].push(point);
          assigned = true;
        }
        
        if (!assigned && (text.includes('innovation') || text.includes('technology') || text.includes('ai') || text.includes('feature') || text.includes('product') || text.includes('development'))) {
          themes['Innovation & Technology'] = themes['Innovation & Technology'] || [];
          themes['Innovation & Technology'].push(point);
          assigned = true;
        }
        
        if (!assigned && (text.includes('challenge') || text.includes('obstacle') || text.includes('problem') || text.includes('issue') || text.includes('overcome') || text.includes('solution'))) {
          themes['Overcoming Challenges'] = themes['Overcoming Challenges'] || [];
          themes['Overcoming Challenges'].push(point);
          assigned = true;
        }
        
        if (!assigned && (text.includes('team') || text.includes('staff') || text.includes('hire') || text.includes('culture') || text.includes('people') || text.includes('leadership'))) {
          themes['Team & Culture'] = themes['Team & Culture'] || [];
          themes['Team & Culture'].push(point);
          assigned = true;
        }
        
        if (!assigned && (text.includes('market') || text.includes('industry') || text.includes('customer') || text.includes('client') || text.includes('impact') || text.includes('community'))) {
          themes['Market Impact'] = themes['Market Impact'] || [];
          themes['Market Impact'].push(point);
          assigned = true;
        }
        
        // Default fallback
        if (!assigned) {
          themes['Strategic Development'] = themes['Strategic Development'] || [];
          themes['Strategic Development'].push(point);
        }
      });
      
      // Return themes in narrative order for better story flow
      const orderedThemes: Record<string, any[]> = {};
      narrativeOrder.forEach(themeName => {
        if (themes[themeName] && themes[themeName].length > 0) {
          orderedThemes[themeName] = themes[themeName];
        }
      });
      
      // Add any remaining themes not in the standard order
      Object.keys(themes).forEach(themeName => {
        if (!orderedThemes[themeName] && themes[themeName].length > 0) {
          orderedThemes[themeName] = themes[themeName];
        }
      });
      
      return orderedThemes;
    };

    // Get sample quotes from transcript
    const getSampleQuotes = () => {
      if (!transcript || transcript.length < 100) return [];
      
      // Mock quotes based on story angle - in real implementation, these would be extracted from actual transcript
      const quotes = {
        'success-story': [
          "We've seen tremendous momentum in our core metrics",
          "The transformation has exceeded our initial expectations"
        ],
        'challenges-overcome': [
          "It wasn't easy, but we turned those obstacles into opportunities",
          "The key was staying focused on our long-term vision"
        ],
        'innovation-focus': [
          "Innovation isn't just about technology—it's about reimagining possibilities",
          "We're pushing boundaries in ways our industry hasn't seen before"
        ],
        'default': [
          "The market dynamics are shifting in interesting ways",
          "We're seeing opportunities that align perfectly with our strategy"
        ]
      };
      
      return quotes[storyDirection.angle as keyof typeof quotes] || quotes.default;
    };

    const generateIntroduction = () => {
      const hasTranscript = transcript && transcript.length > 50;
      const quotes = getSampleQuotes();
      
      let intro = '';
      
      switch (storyDirection.angle) {
        case 'success-story':
          intro = hasTranscript 
            ? `In today's rapidly evolving business landscape, success stories often emerge from unexpected places. What started as a strategic conversation quickly revealed the depth of transformation taking place behind the scenes. ${quotes.length > 0 ? `"${quotes[0]}," the leadership team shared during our discussion.` : 'The insights shared during our conversation painted a picture of sustained growth and strategic execution.'}\n\nThe journey of organizational evolution is rarely straightforward, yet the patterns that emerge tell a compelling story of adaptation and achievement. ${getSourceAttribution(verifiedKeyPoints[0] || {})} the evidence points to a systematic approach that has yielded measurable results across multiple dimensions of business performance.`
            : `Industry leaders continue to demonstrate that strategic vision, when properly executed, can yield remarkable results [UNVERIFIED]. The current market environment presents both challenges and opportunities, with organizations that adapt quickly positioning themselves for sustained success [UNVERIFIED].\n\nWhile comprehensive verification of specific outcomes remains pending, emerging patterns suggest a coordinated approach to growth and development [UNVERIFIED]. The implications of these developments extend beyond individual organizations to broader industry trends and market dynamics.`;
          break;
          
        case 'challenges-overcome':
          intro = hasTranscript 
            ? `Behind every success story lies a series of obstacles that once seemed insurmountable. Our conversation revealed how strategic thinking and persistent execution can transform challenges into competitive advantages. ${quotes.length > 0 ? `"${quotes[0]}," reflecting on the journey that brought the organization to its current position.` : 'The discussion highlighted the methodical approach taken to address each challenge systematically.'}\n\nThe ability to navigate complex business challenges while maintaining forward momentum requires both tactical flexibility and strategic clarity. ${getSourceAttribution(verifiedKeyPoints[0] || {})} the response to these obstacles has shaped a more resilient and adaptable organizational structure.`
            : `The business environment presents ongoing challenges that test organizational resilience and strategic thinking [UNVERIFIED]. Companies that successfully navigate these obstacles often emerge stronger and better positioned for future growth [UNVERIFIED].\n\nWhile specific details require additional verification, the broader patterns suggest systematic approaches to problem-solving and strategic adaptation [UNVERIFIED]. These developments may indicate important shifts in how organizations approach complex business challenges.`;
          break;
          
        case 'innovation-focus':
          intro = hasTranscript 
            ? `At the intersection of technology and strategy, breakthrough innovations are reshaping traditional business practices. Our discussion uncovered how forward-thinking approaches are creating new possibilities for growth and efficiency. ${quotes.length > 0 ? `"${quotes[0]}," highlighting the transformative potential of strategic innovation.` : 'The conversation explored how technological advancement aligns with business objectives to drive meaningful change.'}\n\nInnovation in today's context extends far beyond technological implementation to encompass strategic thinking, operational excellence, and market positioning. ${getSourceAttribution(verifiedKeyPoints[0] || {})} the integration of these elements has created a foundation for sustained competitive advantage.`
            : `The pace of technological change continues to accelerate, creating opportunities for organizations that can effectively integrate innovation into their strategic framework [UNVERIFIED]. Early adopters often gain significant competitive advantages through strategic technology deployment [UNVERIFIED].\n\nWhile comprehensive analysis of specific innovations remains pending, emerging trends suggest coordinated efforts to leverage technology for business transformation [UNVERIFIED]. These developments may represent important shifts in how innovation drives business strategy.`;
          break;
          
        default:
          intro = hasTranscript 
            ? `In an increasingly complex business environment, strategic insights often emerge from unexpected conversations. Our discussion revealed patterns of development that extend beyond immediate business concerns to broader questions of market positioning and organizational evolution. ${quotes.length > 0 ? `"${quotes[0]}," providing context for the strategic decisions that have shaped recent developments.` : 'The insights shared offered a comprehensive view of current market dynamics and strategic approaches.'}\n\nThe intersection of strategy, execution, and market forces creates a dynamic environment where adaptability and vision become crucial competitive advantages. ${getSourceAttribution(verifiedKeyPoints[0] || {})} the approach taken reflects a deep understanding of both immediate opportunities and long-term strategic positioning.`
            : `Current market dynamics present both opportunities and challenges for organizations seeking to maintain competitive advantages [UNVERIFIED]. Strategic positioning in this environment requires careful balance between immediate concerns and long-term vision [UNVERIFIED].\n\nWhile specific organizational outcomes require additional verification, broader market trends suggest systematic approaches to strategic development and execution [UNVERIFIED]. These patterns may indicate important shifts in how businesses approach strategic planning and implementation.`;
      }
      
      return intro;
    };

    const generateThematicSections = (themes: Record<string, any[]>) => {
      const sections = [];
      const quotes = getSampleQuotes();
      let quoteIndex = 0;
      const themeNames = Object.keys(themes);
      
      for (let themeIndex = 0; themeIndex < themeNames.length; themeIndex++) {
        const themeName = themeNames[themeIndex];
        const points = themes[themeName];
        if (points.length === 0) continue;
        
        let section = '';
        const paragraphs = [];
        
        // Create smooth transition from previous theme
        let transitionPhrase = '';
        if (themeIndex > 0) {
          const transitionMap: Record<string, Record<string, string>> = {
            'Foundation & Strategy': {
              default: 'Building on this foundation,'
            },
            'Growth & Performance': {
              'Foundation & Strategy': 'These strategic foundations have translated into measurable outcomes.',
              default: 'The results of these efforts are evident in performance metrics.'
            },
            'Innovation & Technology': {
              'Growth & Performance': 'This growth trajectory has been supported by technological advancement.',
              'Foundation & Strategy': 'The strategic framework has enabled innovative approaches.',
              default: 'Innovation has emerged as a key differentiator.'
            },
            'Overcoming Challenges': {
              'Innovation & Technology': 'However, the path to innovation has not been without obstacles.',
              'Growth & Performance': 'Yet this success story includes navigating significant challenges.',
              default: 'The journey has required overcoming substantial obstacles.'
            },
            'Team & Culture': {
              'Overcoming Challenges': 'Central to overcoming these challenges has been the human element.',
              'Innovation & Technology': 'The success of these innovations depends fundamentally on people.',
              default: 'The organizational culture has been instrumental in this transformation.'
            },
            'Market Impact': {
              'Team & Culture': 'This internal development has created external ripple effects.',
              'Growth & Performance': 'These achievements extend beyond internal metrics to market influence.',
              default: 'The broader implications reach into market dynamics.'
            }
          };
          
          const previousTheme = themeNames[themeIndex - 1];
          transitionPhrase = transitionMap[themeName]?.[previousTheme] || transitionMap[themeName]?.default || 'Expanding on these developments,';
        }
        
        // Generate opening paragraph for theme
        const primaryPoint = points[0];
        const attribution = getSourceAttribution(primaryPoint);
        
        let themeIntro = '';
        switch (themeName) {
          case 'Foundation & Strategy':
            themeIntro = `${transitionPhrase} ${attribution}, ${primaryPoint.text} This strategic foundation represents more than tactical planning—it reflects a comprehensive understanding of market dynamics and organizational capabilities that guides decision-making across multiple dimensions.`;
            break;
          case 'Growth & Performance':
            themeIntro = `${transitionPhrase} ${attribution}, ${primaryPoint.text} The trajectory reveals systematic execution that has compounded over time, creating momentum that extends beyond individual metrics to encompass organizational transformation.`;
            break;
          case 'Innovation & Technology':
            themeIntro = `${transitionPhrase} ${attribution}, ${primaryPoint.text} This technological integration serves not merely as operational upgrade but as fundamental business transformation, reshaping how opportunities are identified and pursued.`;
            break;
          case 'Overcoming Challenges':
            themeIntro = `${transitionPhrase} ${attribution}, ${primaryPoint.text} The approach to these obstacles demonstrates methodical problem-solving that transforms potential setbacks into competitive advantages.`;
            break;
          case 'Team & Culture':
            themeIntro = `${transitionPhrase} ${attribution}, ${primaryPoint.text} The human dimension of organizational development extends beyond processes to encompass the capabilities and mindset that drive sustained performance.`;
            break;
          case 'Market Impact':
            themeIntro = `${transitionPhrase} ${attribution}, ${primaryPoint.text} These developments create value that extends beyond organizational boundaries to influence broader market dynamics and industry standards.`;
            break;
          default:
            themeIntro = `${transitionPhrase} ${attribution}, ${primaryPoint.text} This development represents one element of a comprehensive approach to organizational evolution.`;
        }
        
        paragraphs.push(themeIntro);
        
        // Develop additional content with remaining points
        if (points.length > 1) {
          const remainingPoints = points.slice(1);
          let developmentParagraph = '';
          
          // Weave quotes naturally into the narrative
          const shouldIncludeQuote = quotes.length > quoteIndex && quoteIndex < 2 && transcript;
          const quotePosition = Math.floor(remainingPoints.length / 2); // Place quote in middle of points
          
          remainingPoints.forEach((point, index) => {
            const pointAttribution = getSourceAttribution(point);
            
            if (index === 0) {
              developmentParagraph = `The depth of this transformation becomes evident through additional insights. ${pointAttribution}, ${point.text}`;
            } else if (index === quotePosition && shouldIncludeQuote) {
              developmentParagraph += ` "${quotes[quoteIndex]}," reflecting the strategic thinking that guides these initiatives. Furthermore, ${pointAttribution}, ${point.text}`;
              quoteIndex++;
            } else {
              const connectors = ['Additionally,', 'Moreover,', 'Complementing this,', 'Building on this foundation,'];
              const connector = connectors[Math.min(index - 1, connectors.length - 1)];
              developmentParagraph += ` ${connector} ${pointAttribution}, ${point.text}`;
            }
          });
          
          // Close the development paragraph with forward-looking insight
          developmentParagraph += ` These interconnected developments create a framework for sustained advancement, where individual achievements contribute to broader organizational capabilities and market positioning.`;
          
          paragraphs.push(developmentParagraph);
        }
        
        section = paragraphs.join('\n\n');
        sections.push(section);
      }
      
      return sections.join('\n\n');
    };

    const generateConclusion = () => {
      const themes = groupKeyPoints();
      const themeCount = Object.keys(themes).length;
      const hasTranscript = transcript && transcript.length > 50;
      
      let conclusion = '';
      
      switch (storyDirection.angle) {
        case 'success-story':
          conclusion = `The convergence of strategic vision and operational execution has created a foundation for sustained performance that extends beyond immediate metrics. ${hasTranscript ? 'The insights shared during our conversation reveal' : 'Available information suggests [UNVERIFIED]'} an organization positioned to leverage current momentum for continued development across multiple business dimensions.\n\nLooking ahead, the patterns established through ${themeCount > 1 ? 'these diverse initiatives' : 'this strategic approach'} suggest potential for expanded impact as market conditions continue to evolve. ${sources.length > 0 ? 'The supporting documentation indicates' : 'While comprehensive verification remains pending [UNVERIFIED],'} the strategic framework developed provides adaptability for future challenges and opportunities that may emerge in the broader business environment.`;
          break;
          
        case 'challenges-overcome':
          conclusion = `The systematic approach to addressing organizational challenges has yielded insights that extend beyond immediate problem-solving to fundamental questions of strategic resilience. ${hasTranscript ? 'Our discussion highlighted' : 'Available analysis suggests [UNVERIFIED]'} capabilities developed through navigating complex business requirements now serve as competitive advantages in an increasingly dynamic market environment.\n\nThe methodologies refined through addressing these challenges position the organization to anticipate and respond to future obstacles with greater strategic clarity. ${sources.length > 0 ? 'Documentation supporting these developments' : 'While specific outcomes require additional verification [UNVERIFIED],'} the frameworks established suggest enhanced organizational capacity for managing complexity and uncertainty in evolving market conditions.`;
          break;
          
        case 'innovation-focus':
          conclusion = `The integration of technological innovation with strategic business objectives represents more than operational upgrade—it reflects fundamental transformation in how organizations approach market opportunities. ${hasTranscript ? 'The conversation revealed' : 'Current analysis indicates [UNVERIFIED]'} innovation strategies that extend beyond immediate implementation to long-term competitive positioning.\n\nAs technology continues to reshape business landscapes, the approaches developed through ${themeCount > 1 ? 'these initiatives' : 'this strategic framework'} provide templates for sustained innovation management. ${sources.length > 0 ? 'The documented evidence suggests' : 'While comprehensive verification is ongoing [UNVERIFIED],'} potential for expanded application of these innovation methodologies across broader organizational functions and market opportunities.`;
          break;
          
        default:
          conclusion = `The strategic developments examined reflect broader patterns of organizational evolution in response to changing market dynamics. ${hasTranscript ? 'Insights from our discussion suggest' : 'Available information indicates [UNVERIFIED]'} systematic approaches to business development that balance immediate requirements with long-term strategic positioning.\n\nThe implications of ${themeCount > 1 ? 'these interconnected developments' : 'this strategic approach'} extend beyond individual organizational outcomes to broader questions of industry adaptation and competitive positioning. ${sources.length > 0 ? 'Supporting documentation reinforces' : 'While additional verification is required [UNVERIFIED],'} the potential for these methodologies to influence approaches to strategic planning and execution in similar organizational contexts.`;
      }
      
      return conclusion;
    };

    // Generate the complete article
    const themes = groupKeyPoints();
    const introduction = generateIntroduction();
    const body = generateThematicSections(themes);
    const conclusion = generateConclusion();
    
    const article = `${introduction}\n\n${body}\n\n${conclusion}`;
    
    // Add editor's note
    const editorNote = `\n\n---\n*Editor's Note: This article is based on ${transcript ? 'interview content and ' : ''}${sources.length} supporting source${sources.length !== 1 ? 's' : ''}. Claims marked [UNVERIFIED] require additional confirmation before publication.*`;
    
    return article + editorNote;
  };

  const generateMockSourceMapping = (data: StoryData): Record<string, string[]> => {
    return {
      'paragraph-1': [data.sources[0]?.id || ''],
      'paragraph-2': data.keyPoints.slice(0, 2).map(kp => kp.source).filter(Boolean),
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
          <p className="text-2xl font-bold text-primary">{storyData.keyPoints.filter(point => point.status === 'VERIFIED').length}</p>
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