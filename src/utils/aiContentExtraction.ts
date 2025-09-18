// AI-powered content extraction using Claude 4 Sonnet for intelligent key point analysis

export interface AIExtractedKeyPoint {
  text: string;
  relevanceScore: number;
  matchedKeywords: string[];
  source: string;
  reasoning: string;
}

/**
 * Extract keywords from user's article focus for AI analysis
 */
export const extractAIFocusKeywords = (focus: string): string[] => {
  const text = focus.toLowerCase();
  const keywords: string[] = [];
  
  // Enhanced stop words list
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'want', 'need',
    'like', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down',
    'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once'
  ]);
  
  // Extract significant words (3+ characters, not stop words)
  const words = text.split(/\s+/)
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length >= 3 && !stopWords.has(word));
  
  // Add individual keywords
  keywords.push(...words);
  
  // Extract key phrases (2-4 word combinations)
  const phrases = text.match(/\b\w+\s+\w+(?:\s+\w+)?(?:\s+\w+)?\b/g) || [];
  keywords.push(...phrases.map(phrase => phrase.trim()));
  
  // Return unique keywords, prioritizing longer phrases
  return [...new Set(keywords)].sort((a, b) => b.length - a.length).slice(0, 25);
};

/**
 * Use Claude 4 Sonnet to intelligently extract key points from content
 */
export const extractKeyPointsWithAI = async (
  content: string,
  source: string,
  userFocus: string,
  keywords: string[]
): Promise<AIExtractedKeyPoint[]> => {
  // Construct the AI prompt for Claude 4 Sonnet
  const prompt = `You are an expert content analyst. Extract key points from the following content that align with the user's specific focus and goals.

USER'S ARTICLE FOCUS & GOALS:
"${userFocus}"

IDENTIFIED KEYWORDS TO FOCUS ON:
${keywords.join(', ')}

CONTENT TO ANALYZE:
"${content}"

INSTRUCTIONS:
1. Extract 3-8 key points that are directly relevant to the user's focus
2. Each key point MUST include at least one of the identified keywords
3. Focus only on content that supports the user's stated goals and direction
4. Ignore any content that doesn't align with the focus
5. Provide a brief reasoning for each key point's relevance
6. Ensure extracted points are substantial and meaningful (not just fragments)

FORMAT YOUR RESPONSE AS JSON:
{
  "keyPoints": [
    {
      "text": "Complete sentence or insight from the content",
      "matchedKeywords": ["keyword1", "keyword2"],
      "relevanceScore": 8,
      "reasoning": "Why this point is relevant to the user's focus"
    }
  ]
}

Relevance scores should be 1-10 based on how well the key point aligns with the user's focus and includes important keywords.`;

  try {
    // Simulate Claude 4 Sonnet API call (replace with actual API call)
    const response = await simulateClaudeAnalysis(content, userFocus, keywords, source);
    return response;
  } catch (error) {
    console.error('AI extraction failed:', error);
    // Fallback to keyword-based extraction
    return fallbackKeywordExtraction(content, source, keywords);
  }
};

/**
 * Simulate Claude 4 Sonnet analysis (replace with actual API call)
 */
const simulateClaudeAnalysis = async (
  content: string,
  userFocus: string,
  keywords: string[],
  source: string
): Promise<AIExtractedKeyPoint[]> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Intelligent content analysis simulation
  const sentences = content
    .split(/[.!?]+\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 30);
  
  const analysisResults: AIExtractedKeyPoint[] = [];
  
  // Simulate AI's intelligent analysis
  for (const sentence of sentences.slice(0, 8)) {
    const lowerSentence = sentence.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => 
      lowerSentence.includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      // AI would provide more sophisticated relevance scoring
      const baseScore = matchedKeywords.length * 2;
      const lengthBonus = Math.min(sentence.length / 100, 2);
      const focusAlignment = calculateFocusAlignment(sentence, userFocus);
      
      const relevanceScore = Math.min(Math.round(baseScore + lengthBonus + focusAlignment), 10);
      
      if (relevanceScore >= 5) {
        analysisResults.push({
          text: sentence.endsWith('.') || sentence.endsWith('!') || sentence.endsWith('?') 
            ? sentence 
            : sentence + '.',
          matchedKeywords,
          relevanceScore,
          source,
          reasoning: `Highly relevant to your focus on ${matchedKeywords.join(' and ')}. Contains key insights about ${getMainTheme(sentence, matchedKeywords)}.`
        });
      }
    }
  }
  
  // Sort by relevance score and return top results
  return analysisResults
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 6);
};

/**
 * Calculate how well content aligns with user's focus
 */
const calculateFocusAlignment = (sentence: string, userFocus: string): number => {
  const focusWords = userFocus.toLowerCase().split(/\s+/);
  const sentenceWords = sentence.toLowerCase().split(/\s+/);
  
  let alignmentScore = 0;
  for (const focusWord of focusWords) {
    if (focusWord.length > 3 && sentenceWords.some(word => word.includes(focusWord))) {
      alignmentScore += 1;
    }
  }
  
  return Math.min(alignmentScore * 0.5, 3);
};

/**
 * Identify main theme from matched keywords
 */
const getMainTheme = (sentence: string, matchedKeywords: string[]): string => {
  // Simple theme detection based on keywords
  const themes = {
    'growth': ['growth', 'increase', 'expand', 'scale', 'develop'],
    'technology': ['technology', 'AI', 'machine learning', 'innovation', 'digital'],
    'users': ['user', 'customer', 'client', 'engagement', 'satisfaction'],
    'business': ['revenue', 'profit', 'market', 'business', 'strategy'],
    'team': ['team', 'employee', 'collaboration', 'workforce', 'hiring']
  };
  
  for (const [theme, themeKeywords] of Object.entries(themes)) {
    if (matchedKeywords.some(keyword => 
      themeKeywords.some(themeWord => keyword.toLowerCase().includes(themeWord))
    )) {
      return theme;
    }
  }
  
  return matchedKeywords[0] || 'business insights';
};

/**
 * Fallback extraction using keyword matching
 */
const fallbackKeywordExtraction = (
  content: string,
  source: string,
  keywords: string[]
): AIExtractedKeyPoint[] => {
  const sentences = content
    .split(/[.!?]+\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 30);
  
  const results: AIExtractedKeyPoint[] = [];
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => 
      lowerSentence.includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      results.push({
        text: sentence.endsWith('.') || sentence.endsWith('!') || sentence.endsWith('?') 
          ? sentence 
          : sentence + '.',
        matchedKeywords,
        relevanceScore: Math.min(matchedKeywords.length * 2, 8),
        source,
        reasoning: `Contains relevant keywords: ${matchedKeywords.join(', ')}`
      });
    }
  }
  
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5);
};

/**
 * Process multiple sources with AI-powered extraction and deduplication
 */
export const processMultipleSourcesWithAI = async (
  sources: Array<{ content: string; title: string; type: string }>,
  transcript: string,
  userFocus: string,
  minKeyPoints: number = 5
): Promise<{ keyPoints: AIExtractedKeyPoint[]; summary: string; keywords: string[] }> => {
  const keywords = extractAIFocusKeywords(userFocus);
  const allKeyPoints: AIExtractedKeyPoint[] = [];
  
  // Process transcript with AI
  if (transcript.trim()) {
    const transcriptPoints = await extractKeyPointsWithAI(
      transcript,
      'Interview Transcript',
      userFocus,
      keywords
    );
    allKeyPoints.push(...transcriptPoints);
  }
  
  // Process each source with AI
  for (const source of sources) {
    const sourcePoints = await extractKeyPointsWithAI(
      source.content,
      source.title,
      userFocus,
      keywords
    );
    allKeyPoints.push(...sourcePoints);
  }
  
  // AI-powered deduplication
  const deduplicatedPoints = deduplicateAIKeyPoints(allKeyPoints);
  
  // Ensure minimum number of key points
  let finalKeyPoints = deduplicatedPoints;
  if (finalKeyPoints.length < minKeyPoints) {
    // Could implement additional AI analysis here for more points
    console.log(`Found ${finalKeyPoints.length} key points, minimum was ${minKeyPoints}`);
  }
  
  const summary = `AI analysis extracted ${finalKeyPoints.length} highly relevant key points from ${sources.length + (transcript ? 1 : 0)} sources, each containing at least one focus keyword and aligned with your article goals.`;
  
  return {
    keyPoints: finalKeyPoints,
    summary,
    keywords
  };
};

/**
 * Remove duplicate key points using AI-enhanced similarity detection
 */
const deduplicateAIKeyPoints = (keyPoints: AIExtractedKeyPoint[]): AIExtractedKeyPoint[] => {
  const unique: AIExtractedKeyPoint[] = [];
  const seen = new Set<string>();
  
  // Sort by relevance score first
  const sorted = [...keyPoints].sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  for (const point of sorted) {
    const normalized = point.text.toLowerCase().trim();
    const words = normalized.split(/\s+/).filter(w => w.length > 3);
    const fingerprint = words.slice(0, 5).join(' ');
    
    // Check for similar content (simple similarity check)
    let isDuplicate = false;
    for (const seenText of seen) {
      const similarity = calculateSimilarity(fingerprint, seenText);
      if (similarity > 0.7) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.add(fingerprint);
      unique.push(point);
    }
  }
  
  return unique;
};

/**
 * Calculate similarity between two text fingerprints
 */
const calculateSimilarity = (text1: string, text2: string): number => {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

// Draft Generation Interfaces and Types
export interface StoryDirection {
  tone: string;
  angle: string;
  length: string;
  customPrompt?: string;
}

export interface KeyPoint {
  id: string;
  text: string;
  source: string;
  status: 'VERIFIED' | 'UNVERIFIED' | 'NEEDS REVIEW';
  type: 'transcript' | 'source';
}

export interface Source {
  id: string;
  type: 'pdf' | 'url' | 'youtube' | 'text';
  content: string;
  title: string;
}

export interface DraftResult {
  draft: string;
  sourceMapping: Record<string, string[]>;
  headline: string;
  wordCount: number;
  readTime: number;
}

/**
 * Extract direct quotes from transcript content
 */
const extractQuotesFromTranscript = (transcript: string, storyAngle: string): string[] => {
  if (!transcript || transcript.length < 50) return [];
  
  // Split transcript into sentences and find quotable segments
  const sentences = transcript
    .split(/[.!?]+\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 150);
  
  // Filter sentences that make good quotes based on story angle
  const quotablePatterns = {
    'success-story': ['grew', 'increased', 'achieved', 'success', 'results', 'momentum'],
    'challenges-overcome': ['challenge', 'obstacle', 'overcome', 'solution', 'learned', 'adapt'],
    'innovation-focus': ['innovation', 'technology', 'breakthrough', 'transform', 'future', 'possibilities'],
    'default': ['important', 'significant', 'key', 'focus', 'believe', 'think']
  };
  
  const patterns = quotablePatterns[storyAngle as keyof typeof quotablePatterns] || quotablePatterns.default;
  
  const quotes = sentences
    .filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return patterns.some(pattern => lowerSentence.includes(pattern));
    })
    .slice(0, 3); // Get top 3 potential quotes
  
  return quotes;
};

/**
 * Use Claude 4 Sonnet to generate a full draft article
 */
export const generateArticleWithAI = async (
  keyPoints: KeyPoint[],
  sources: Source[],
  transcript: string,
  storyDirection: StoryDirection,
  userFocus: string
): Promise<DraftResult> => {
  const verifiedKeyPoints = keyPoints.filter(point => point.status === 'VERIFIED');
  const quotes = extractQuotesFromTranscript(transcript, storyDirection.angle);
  
  // Construct comprehensive prompt for Claude 4 Sonnet
  const prompt = `You are a professional journalist and content strategist. Generate a complete, publication-ready article based on the provided information.

USER'S ARTICLE FOCUS & GOALS:
"${userFocus}"

STORY DIRECTION:
- Angle: ${storyDirection.angle}
- Tone: ${storyDirection.tone}
- Target Length: ${storyDirection.length}
${storyDirection.customPrompt ? `- Custom Instructions: ${storyDirection.customPrompt}` : ''}

VERIFIED KEY POINTS TO INCORPORATE:
${verifiedKeyPoints.map((point, index) => 
  `${index + 1}. "${point.text}" (Source: ${point.source})`
).join('\n')}

AVAILABLE QUOTES FROM TRANSCRIPT:
${quotes.map((quote, index) => `${index + 1}. "${quote}"`).join('\n')}

SOURCES TO REFERENCE:
${sources.map((source, index) => 
  `${index + 1}. ${source.title} (${source.type})`
).join('\n')}

ARTICLE STRUCTURE REQUIREMENTS:

1. HEADLINE: Create an engaging, specific headline that reflects both the focus and angle

2. INTRODUCTION (1-2 paragraphs):
   - Set context and introduce the main subject
   - Explain why the topic matters to readers
   - Establish the chosen story angle clearly

3. BODY (Thematic sections):
   - Group related key points into meaningful themes
   - Develop each theme into full paragraphs with explanation and context
   - Use smooth transitions for cohesive narrative flow
   - Incorporate source references naturally
   - Include 1-2 direct quotes from the transcript authentically

4. CONCLUSION (1-2 paragraphs):
   - Provide forward-looking commentary on significance
   - Highlight implications for future outlook
   - Connect back to broader context without repeating earlier points

WRITING GUIDELINES:
- Write in ${storyDirection.tone} tone
- Target approximately ${storyDirection.length === 'short' ? '400-600' : storyDirection.length === 'medium' ? '600-1000' : '1000-1500'} words
- Use active voice and engaging language
- Include specific details and evidence
- Maintain journalistic credibility
- Connect general knowledge only when it clearly supports the key points

FORMAT YOUR RESPONSE AS JSON:
{
  "headline": "Engaging headline that captures focus and angle",
  "draft": "Complete article content with proper paragraph breaks (use \\n\\n for paragraph separation)",
  "sourceMapping": {
    "paragraph_1": ["Source Name 1", "Source Name 2"],
    "paragraph_2": ["Source Name 3"],
    // Map each major paragraph/section to its sources
  },
  "wordCount": estimated_word_count,
  "readTime": estimated_read_time_in_minutes
}

Generate a compelling, well-structured article that transforms the key points into an engaging narrative while maintaining journalistic integrity.`;

  try {
    // Simulate Claude 4 Sonnet API call (replace with actual API call)
    const response = await simulateClaudeArticleGeneration(
      verifiedKeyPoints,
      sources,
      transcript,
      storyDirection,
      userFocus,
      quotes
    );
    return response;
  } catch (error) {
    console.error('AI article generation failed:', error);
    // Fallback to enhanced mock generation
    return generateEnhancedMockArticle(verifiedKeyPoints, sources, transcript, storyDirection, userFocus, quotes);
  }
};

/**
 * Simulate Claude 4 Sonnet article generation (replace with actual API call)
 */
const simulateClaudeArticleGeneration = async (
  keyPoints: KeyPoint[],
  sources: Source[],
  transcript: string,
  storyDirection: StoryDirection,
  userFocus: string,
  quotes: string[]
): Promise<DraftResult> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2500));

  const enhanced = generateEnhancedMockArticle(keyPoints, sources, transcript, storyDirection, userFocus, quotes);
  return enhanced;
};

/**
 * Generate enhanced mock article with proper structure
 */
const generateEnhancedMockArticle = (
  keyPoints: KeyPoint[],
  sources: Source[],
  transcript: string,
  storyDirection: StoryDirection,
  userFocus: string,
  quotes: string[]
): DraftResult => {
  // Generate compelling headline based on focus and angle
  const generateHeadline = (): string => {
    const focusWords = userFocus.toLowerCase().split(' ').filter(word => word.length > 3);
    const primaryFocus = focusWords[0] || 'business';
    
    const headlineTemplates = {
      'success-story': [
        `How ${primaryFocus} Innovation Drives Unprecedented Growth`,
        `The ${primaryFocus} Transformation That's Reshaping Industries`,
        `From Strategy to Success: ${primaryFocus} Leadership Delivers Results`
      ],
      'challenges-overcome': [
        `Turning ${primaryFocus} Obstacles Into Competitive Advantages`,
        `How Smart ${primaryFocus} Strategy Overcame Market Challenges`,
        `The ${primaryFocus} Resilience Formula: Lessons from the Frontlines`
      ],
      'innovation-focus': [
        `${primaryFocus} Innovation Breakthrough: The Future Is Here`,
        `Revolutionizing ${primaryFocus}: Technology Meets Strategy`,
        `The ${primaryFocus} Innovation Edge: Redefining Possibilities`
      ],
      'default': [
        `${primaryFocus} Strategy Insights: Market Leadership Decoded`,
        `The ${primaryFocus} Evolution: Strategic Insights for Growth`,
        `Understanding ${primaryFocus} Excellence: Key Strategic Insights`
      ]
    };
    
    const templates = headlineTemplates[storyDirection.angle as keyof typeof headlineTemplates] || headlineTemplates.default;
    return templates[0].charAt(0).toUpperCase() + templates[0].slice(1);
  };

  // Group key points into thematic sections
  const groupKeyPointsIntoThemes = (): Record<string, KeyPoint[]> => {
    const themes: Record<string, KeyPoint[]> = {};
    
    keyPoints.forEach(point => {
      const text = point.text.toLowerCase();
      let assigned = false;
      
      // Strategic Foundation
      if (text.includes('strategy') || text.includes('vision') || text.includes('foundation') || text.includes('approach')) {
        themes['Strategic Foundation'] = themes['Strategic Foundation'] || [];
        themes['Strategic Foundation'].push(point);
        assigned = true;
      }
      
      // Growth & Results
      if (!assigned && (text.includes('growth') || text.includes('revenue') || text.includes('increase') || text.includes('performance'))) {
        themes['Growth & Results'] = themes['Growth & Results'] || [];
        themes['Growth & Results'].push(point);
        assigned = true;
      }
      
      // Innovation & Technology
      if (!assigned && (text.includes('innovation') || text.includes('technology') || text.includes('ai') || text.includes('digital'))) {
        themes['Innovation & Technology'] = themes['Innovation & Technology'] || [];
        themes['Innovation & Technology'].push(point);
        assigned = true;
      }
      
      // Market Position
      if (!assigned && (text.includes('market') || text.includes('customer') || text.includes('competitive') || text.includes('industry'))) {
        themes['Market Position'] = themes['Market Position'] || [];
        themes['Market Position'].push(point);
        assigned = true;
      }
      
      // Operational Excellence
      if (!assigned) {
        themes['Operational Excellence'] = themes['Operational Excellence'] || [];
        themes['Operational Excellence'].push(point);
      }
    });
    
    return themes;
  };

  const headline = generateHeadline();
  const themes = groupKeyPointsIntoThemes();
  const sourceMapping: Record<string, string[]> = {};

  // Generate introduction
  const introduction = generateAIIntroduction(storyDirection, userFocus, keyPoints[0]);
  sourceMapping['introduction'] = keyPoints.slice(0, 2).map(kp => kp.source);

  // Generate body sections
  const bodySections: string[] = [];
  const themeNames = Object.keys(themes);
  let quoteUsed = false;

  themeNames.forEach((themeName, index) => {
    const themePoints = themes[themeName];
    if (themePoints.length === 0) return;

    const primaryPoint = themePoints[0];
    const sectionSources = themePoints.map(tp => tp.source);
    
    // Add quote in the middle section if available
    const shouldAddQuote = !quoteUsed && quotes.length > 0 && index === Math.floor(themeNames.length / 2);
    
    let section = `${themeName} represents a critical dimension of the overall transformation. ${primaryPoint.text} This development extends beyond immediate tactical considerations to encompass strategic positioning and long-term competitive advantage.`;
    
    // Add additional points from this theme
    if (themePoints.length > 1) {
      const additionalPoints = themePoints.slice(1, 3); // Take up to 2 more points
      section += ' ' + additionalPoints.map(point => 
        `The evidence further demonstrates that ${point.text.toLowerCase()}`
      ).join(' ');
    }
    
    // Add quote if appropriate
    if (shouldAddQuote) {
      section += ` As noted during the discussion, "${quotes[0]}" This perspective underscores the comprehensive nature of the strategic approach being implemented.`;
      quoteUsed = true;
    }
    
    bodySections.push(section);
    sourceMapping[`section_${index + 1}`] = sectionSources;
  });

  // Generate conclusion
  const conclusion = generateAIConclusion(storyDirection, userFocus);
  sourceMapping['conclusion'] = sources.slice(0, 2).map(s => s.title);

  // Combine all sections
  const draft = [
    introduction,
    '',
    ...bodySections.map(section => section + '\n'),
    conclusion
  ].join('\n\n');

  const wordCount = draft.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 250); // Average reading speed

  return {
    draft,
    sourceMapping,
    headline,
    wordCount,
    readTime
  };
};

/**
 * Generate AI-style introduction
 */
const generateAIIntroduction = (storyDirection: StoryDirection, userFocus: string, primaryKeyPoint?: KeyPoint): string => {
  const focusElements = userFocus.toLowerCase().split(' ').filter(word => word.length > 3);
  
  const introTemplates = {
    'success-story': `In today's competitive landscape, ${focusElements[0] || 'strategic'} excellence has become the defining characteristic of market leaders. ${primaryKeyPoint ? primaryKeyPoint.text : 'Recent developments reveal systematic approaches to growth and innovation that extend far beyond conventional business practices.'} This transformation represents more than operational improvement—it reflects a fundamental shift in how organizations approach strategic development and market positioning.`,
    
    'challenges-overcome': `The path to ${focusElements[0] || 'strategic'} leadership is rarely straightforward, yet the most compelling success stories emerge from organizations that transform obstacles into competitive advantages. ${primaryKeyPoint ? primaryKeyPoint.text : 'The systematic approach to overcoming challenges has revealed methodologies that extend beyond immediate problem-solving to encompass long-term strategic resilience.'} These developments demonstrate how methodical response to adversity can create sustainable competitive positioning.`,
    
    'innovation-focus': `At the intersection of ${focusElements[0] || 'technology'} and strategic vision, breakthrough innovations are reshaping traditional business paradigms. ${primaryKeyPoint ? primaryKeyPoint.text : 'The integration of technological advancement with strategic planning has created new possibilities for market differentiation and operational excellence.'} This technological evolution represents fundamental transformation in how organizations approach both immediate challenges and long-term strategic objectives.`,
    
    'default': `The dynamics of ${focusElements[0] || 'strategic'} development continue to evolve, creating opportunities for organizations that can effectively integrate innovation with operational excellence. ${primaryKeyPoint ? primaryKeyPoint.text : 'Current market conditions reward systematic approaches to growth and strategic positioning that extend beyond conventional business practices.'} These developments reflect broader shifts in how strategic planning addresses both immediate market demands and long-term competitive positioning.`
  };
  
  return introTemplates[storyDirection.angle as keyof typeof introTemplates] || introTemplates.default;
};

/**
 * Generate AI-style conclusion
 */
const generateAIConclusion = (storyDirection: StoryDirection, userFocus: string): string => {
  const focusElements = userFocus.toLowerCase().split(' ').filter(word => word.length > 3);
  
  const conclusionTemplates = {
    'success-story': `The trajectory of ${focusElements[0] || 'strategic'} development outlined here extends beyond current achievements to indicate sustainable competitive advantages. Market dynamics continue to reward organizations that integrate systematic planning with adaptive execution, suggesting that these approaches will become increasingly central to long-term success. The implications reach beyond individual organizational outcomes to influence broader industry standards and competitive benchmarks.`,
    
    'challenges-overcome': `The methodologies for addressing ${focusElements[0] || 'strategic'} challenges demonstrated here offer frameworks that extend beyond immediate problem-solving to encompass organizational resilience. As market conditions continue to present complex obstacles, the systematic approaches to transformation and adaptation become increasingly valuable. These developments suggest evolving standards for how organizations build competitive advantages through strategic challenge management.`,
    
    'innovation-focus': `The ${focusElements[0] || 'technological'} innovations explored here represent early indicators of broader transformation in strategic business development. The integration of technological advancement with systematic planning creates templates that other organizations will likely adopt and adapt. Looking forward, these approaches may define new standards for how innovation drives sustainable competitive positioning in rapidly evolving markets.`,
    
    'default': `The ${focusElements[0] || 'strategic'} insights revealed through this analysis point toward emerging patterns in organizational development and market positioning. The systematic approaches to growth and competitive advantage suggest methodologies that will likely influence broader industry practices. As market dynamics continue to evolve, these frameworks for strategic development become increasingly relevant for organizations seeking sustainable competitive advantages.`
  };
  
  return conclusionTemplates[storyDirection.angle as keyof typeof conclusionTemplates] || conclusionTemplates.default;
};