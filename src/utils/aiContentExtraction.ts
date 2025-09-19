// AI-powered content extraction with 3-step pipeline: Gemini 2.5 Flash → Gemini 2.5 Flash → Gemini 2.5 Flash

export interface AIExtractedKeyPoint {
  text: string;
  relevanceScore: number;
  matchedKeywords: string[];
  source: string;
  reasoning: string;
}

// Fixed ExtractedKeywords interface to include mainThemes
export interface ExtractedKeywords {
  keywords: string[];
  phrases: string[];
}

// Draft Generation Interfaces and Types
export interface StoryDirection {
  tone: string;
  angle: string;
  length: string;
  customPrompt?: string;
  customTone?: string;
  customAngle?: string;
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

// ====================================================================================================
// =================================== STEP 1: KEYWORD EXTRACTION =====================================
// ====================================================================================================

/**
 * Step 1: Use Gemini 2.5 Flash to analyze user's focus and extract main keywords and key phrases
 */
export const extractKeywordsWithGemini = async (userFocus: string): Promise<ExtractedKeywords> => {
  const prompt = `You are an expert content strategist. Analyze the user's focus input and extract the main keywords and key phrases that represent their desired focus for the article.
USER'S ARTICLE FOCUS:
"${userFocus}"

INSTRUCTIONS:
1. Extract the most important individual keywords (single words) that capture the user's focus.
2. Extract key phrases (2-4 word combinations) that represent main concepts.
3. Identify the main themes that the user wants to emphasize.
4. Focus on terms that would be valuable for content analysis and article creation.
5. Avoid generic words unless they're essential to the context.
6. Ensure keywords and phrases clearly capture what the user wants to emphasize.

FORMAT YOUR RESPONSE AS JSON:
{
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "phrases": ["key phrase 1", "key phrase 2", "key phrase 3"]
}

Extract 8-15 keywords and 5-10 key phrases that best represent the user's desired focus.`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': 'AIzaSyDgLYmvcn7phh27gpRAnPYjsZWK-2ivVkA'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        keywords: parsed.keywords || [],
        phrases: parsed.phrases || []
      };
    } catch (parseError) {
      console.warn('Failed to parse Gemini response, using fallback');
      return extractKeywordsFallback(userFocus);
    }
  } catch (error) {
    console.warn('Gemini 2.5 Flash not available, using fallback keyword extraction');
    return extractKeywordsFallback(userFocus);
  }
};

/**
 * Fallback keyword extraction when Gemini fails
 */
const extractKeywordsFallback = (focus: string): ExtractedKeywords => {
  const text = focus.toLowerCase();
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'want', 'need',
    'like', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
  ]);
  
  const words = text.split(/\s+/)
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length >= 3 && !stopWords.has(word));
  
  const phrases = text.match(/\b\w+\s+\w+(?:\s+\w+)?\b/g) || [];
  
  return {
    keywords: [...new Set(words)].slice(0, 15),
    phrases: [...new Set(phrases)].slice(0, 10)
  };
};

// ====================================================================================================
// =================================== STEP 2: KEY POINT EXTRACTION ===================================
// ====================================================================================================

/**
 * Step 2: Use Gemini 2.5 Flash to extract key points using the extracted keywords
 */
export const extractKeyPointsWithGemini = async (
  content: string,
  source: string,
  userFocus: string,
  extractedKeywords: ExtractedKeywords,
  sourceType: 'transcript' | 'webResource'
): Promise<AIExtractedKeyPoint[]> => {
  const prompt = `You are an expert content analyst. Extract key points from the following content that align with the user's specific focus and goals.
USER'S ARTICLE FOCUS & GOALS:
"${userFocus}"

EXTRACTED KEYWORDS TO FOCUS ON:
Keywords: ${extractedKeywords.keywords.join(', ')}
Key Phrases: ${extractedKeywords.phrases.join(', ')}

CONTENT TO ANALYZE (Source: ${source}, Type: ${sourceType}):
"${content}"

INSTRUCTIONS: 
1. Extract detailed 5 -12 key points depending on source type: 
    - For transcription: Include quotes, dialogue, and speaker attributions. 
    - For web/resources: Include facts, statistics, and insights. 
2. Each key point MUST include at least one of the extracted keywords/phrases.
3. Deduplicate repeated sentences within the same source type. 
4. Provide reasoning for each key point's relevance. 
5. Focus only on content that supports the user’s stated focus and goals. Avoid irrelevant content. 
6. Prioritize key points containing multiple keywords/phrases for higher relevance. 
7. Include substantial and meaningful content (not just fragments).

FORMAT YOUR RESPONSE AS JSON:
{
  "keyPoints": [
    {
      "text": "Complete sentence or insight from the content with proper attribution if it's a quote",
      "matchedKeywords": ["keyword1", "phrase1"],
      "relevanceScore": 8,
      "reasoning": "Why this point is relevant to the user's focus"
    }
  ]
}

Relevance scores should be 1-10 based on how well the key point aligns with the user's focus and includes important keywords.`;
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': 'AIzaSyDgLYmvcn7phh27gpRAnPYjsZWK-2ivVkA'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    try {
      const parsedResult = JSON.parse(aiResponse);
      return parsedResult.keyPoints.map((point: any) => ({
        text: point.text,
        matchedKeywords: point.matchedKeywords || [],
        relevanceScore: point.relevanceScore || 5,
        source,
        reasoning: point.reasoning || 'Relevant to user focus'
      }));
    } catch (parseError) {
      console.warn('Failed to parse Gemini response as JSON, using fallback');
      return fallbackKeywordExtraction(content, source, [...extractedKeywords.keywords, ...extractedKeywords.phrases]);
    }
  } catch (error) {
    console.warn('Gemini 2.5 Flash not available, using fallback extraction');
    return fallbackKeywordExtraction(content, source, [...extractedKeywords.keywords, ...extractedKeywords.phrases]);
  }
};

/**
 * Use Gemini 2.5 Flash to intelligently extract key points from content (Legacy function for compatibility)
 */
export const extractKeyPointsWithAI = async (
  content: string,
  source: string,
  userFocus: string,
  keywords: string[]
): Promise<AIExtractedKeyPoint[]> => {
  const extractedKeywords: ExtractedKeywords = {
    keywords: keywords.filter(k => !k.includes(' ')),
    phrases: keywords.filter(k => k.includes(' '))
  };
  
  return extractKeyPointsWithGemini(content, source, userFocus, extractedKeywords, 'webResource');
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

// ====================================================================================================
// =================================== STEP 3: ARTICLE GENERATION ===================================
// ====================================================================================================

/**
 * Generates a creative headline for an article using Gemini 2.5 Flash.
 */
export const generateHeadlineWithGemini = async (
  keyPoints: KeyPoint[],
  userFocus: string,
  storyDirection: StoryDirection,
  sources: Source[]
): Promise<string> => {
  const verifiedKeyPoints = keyPoints.filter(point => point.status === 'VERIFIED');
  const fallbackHeadline = `Insights on ${userFocus}`;

  const keyPointsSummary = verifiedKeyPoints.slice(0, 5).map(point => point.text).join('\n');
  const sourceTitles = sources.map(source => source.title).join(', ');

  const prompt = `You are a world-class creative headline writer. Generate a single, compelling, and highly creative headline for an article based on the following information. Do not use a pre-defined story angle template. Instead, use your creative ability to craft a unique headline that captures the essence of the user's goals, story direction, and the key points.
USER'S ARTICLE FOCUS & GOALS:
"${userFocus}"

STORY DIRECTION:
- Angle: ${storyDirection.angle === 'other' && storyDirection.customAngle ? storyDirection.customAngle : storyDirection.angle}
- Tone: ${storyDirection.tone === 'other' && storyDirection.customTone ? storyDirection.customTone : storyDirection.tone}
- Target Length: ${storyDirection.length}

KEY POINTS TO FEATURE:
${keyPointsSummary}

SOURCES AVAILABLE:
${sourceTitles}

HEADLINE REQUIREMENTS:
1. Must be clear, specific, and highly creative.
2. Should reflect the user's focus and the chosen story angle.
3. Keep it concise (under 80 characters).
4. Use active voice and compelling language.
5. Connect to the most important key points.
6. Match the ${storyDirection.tone === 'other' && storyDirection.customTone ? storyDirection.customTone : storyDirection.tone} tone.
7. Be imaginative and unique, not based on a standard template.

Return only the headline text (no quotes, no JSON formatting).`;
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': 'AIzaSyDgLYmvcn7phh27gpRAnPYjsZWK-2ivVkA'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const headline = data.candidates[0].content.parts[0].text.trim();
    return headline.replace(/^["']|["']$/g, '').trim();
  } catch (error) {
    console.warn('Gemini headline generation failed, using fallback.');
    return fallbackHeadline;
  }
};

/**
 * Step 3: Use Gemini 2.5 Flash to generate a full draft article based on approved key points
 */
export const generateArticleWithGemini = async (
  keyPoints: KeyPoint[],
  sources: Source[],
  transcript: string,
  storyDirection: StoryDirection,
  userFocus: string
): Promise<DraftResult> => {
  const verifiedKeyPoints = keyPoints.filter(point => point.status === 'VERIFIED');
  const quotes = extractQuotesFromTranscript(transcript, storyDirection.angle);
  
  const headline = await generateHeadlineWithGemini(
    keyPoints,
    userFocus,
    storyDirection,
    sources
  );
  
  const prompt = `You are a skilled article writer. Generate a coherent, well-structured article that follows these specific rules:
USER'S ARTICLE FOCUS & GOALS:
"${userFocus}"

HEADLINE TO USE:
"${headline}"

STORY DIRECTION:
- Angle: ${storyDirection.angle === 'other' && storyDirection.customAngle ? storyDirection.customAngle : storyDirection.angle}
- Tone: ${storyDirection.tone === 'other' && storyDirection.customTone ? storyDirection.customTone : storyDirection.tone}
- Target Length: ${storyDirection.length}
${storyDirection.customPrompt ? `- Custom Instructions: ${storyDirection.customPrompt}` : ''}

APPROVED KEY POINTS TO INCORPORATE:
${verifiedKeyPoints.map((point, index) =>
  `${index + 1}. "${point.text}" (Source: ${point.source})`
).join('\n')}

AVAILABLE QUOTES FROM TRANSCRIPT:
${quotes.map((quote, index) => `${index + 1}. "${quote}"`).join('\n')}

SOURCES TO REFERENCE:
${sources.map((source, index) =>
  `${index + 1}. ${source.title} (${source.type})`
).join('\n')}

ARTICLE WRITING RULES:

1. HEADLINE:
    - Create a bold, creative headline that reflects the article's focus input and the selected Story Angle.
    - Make it BOLD using **headline text** format.

2. INTRODUCTION:
    - Write a captivating introduction that hooks readers right away.
    - Avoid dry or generic openings.
    - Draw readers in immediately with creative, engaging content.

3. FLOW:
    - Ensure the article has a smooth, logical flow.
    - Each section should transition naturally into the next.
    - Avoid a list-like or disjointed feel.
    - Create seamless narrative progression from start to finish.

4. TONE:
    - Use the selected Writing Tone (${storyDirection.tone === 'other' && storyDirection.customTone ? storyDirection.customTone : storyDirection.tone}).
    - If multiple tones are selected, blend them seamlessly throughout the article.
    - Maintain consistency from headline to conclusion.

5. STORY ANGLE:
    - Follow the chosen Story Angle (${storyDirection.angle === 'other' && storyDirection.customAngle ? storyDirection.customAngle : storyDirection.angle}).
    - Use it to guide the framing and perspective of the entire article.
    - Incorporate the angle naturally into every section.

6. KEY POINTS:
    - You may rephrase, condense, or expand key points creatively.
    - Do not repeat them word-for-word.
    - Weave them naturally into the narrative without being mechanical.

7. QUOTES & MENTIONS:
    - If transcript includes phrases like "in our interview…" or "we are going to tell…", rewrite them smoothly.
    - Attribute insights directly to specific person, company, or team (e.g., "In an interview with Mark Zuckerberg…").
    - Quotes should feel natural and integrated, not dropped in mechanically.
    - Make attributions flow seamlessly within the narrative.

8. READER-CENTRIC:
    - Keep focus on how the subject affects people, industries, or everyday life.
    - Frame content according to the story angle's perspective.
    - Make the content relevant and impactful for readers.

9. AVOID REPETITION:
    - Do not overuse phrases like "this development reflects broader strategic initiatives".
    - Vary word choice and enrich the narrative with synonyms, explanations, or examples.
    - Each paragraph should offer unique commentary and perspective.
    - Eliminate redundant information while preserving important details.

10. CREATIVITY + PROFESSIONALISM:
    - Balance engaging storytelling with clear, professional writing.
    - Keep it inspiring, polished, and easy to read.
    - Make the article both informative and compelling.

STRUCTURE REQUIREMENTS:
- Introduction (1-2 paragraphs): Creative hook that draws readers in, sets context, introduces main subject.
- Body (3-5 thematic sections): Develop themes with smooth transitions, natural quote integration, varied language.
- Conclusion (1-2 paragraphs): Forward-looking insights without repetition, broader implications.

TARGET LENGTH: ${storyDirection.length === 'short' ? '400-600' : storyDirection.length === 'medium' ? '600-1000' : '1000-1500'} words

FORMAT YOUR RESPONSE AS JSON:
{
  "draft": "Complete article content with proper paragraph breaks (use \\n\\n for paragraph separation)",
  "sourceMapping": {
    "paragraph_1": ["Source Name 1", "Source Name 2"],
    "paragraph_2": ["Source Name 3"]
  },
  "wordCount": estimated_word_count,
  "readTime": estimated_read_time_in_minutes
}

Focus on producing a coherent, engaging, and readable article rather than a list of points.`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': 'AIzaSyDgLYmvcn7phh27gpRAnPYjsZWK-2ivVkA'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    try {
      const parsedResult = JSON.parse(aiResponse);
      return {
        draft: parsedResult.draft,
        sourceMapping: parsedResult.sourceMapping || {},
        headline,
        wordCount: parsedResult.wordCount || 800,
        readTime: parsedResult.readTime || 4
      };
    } catch (parseError) {
      console.warn('Failed to parse Gemini response as JSON, using fallback');
      throw parseError;
    }
  } catch (error) {
    console.warn('Gemini 2.5 Flash not available, using fallback article generation');
    return generateEnhancedMockArticle(verifiedKeyPoints, sources, transcript, storyDirection, userFocus, quotes, headline);
  }
};

/**
 * Main article generation function using the 3-step pipeline
 */
export const generateArticleWithAI = async (
  keyPoints: KeyPoint[],
  sources: Source[],
  transcript: string,
  storyDirection: StoryDirection,
  userFocus: string
): Promise<DraftResult> => {
  return generateArticleWithGemini(keyPoints, sources, transcript, storyDirection, userFocus);
};


// ====================================================================================================
// ===================================== HELPER FUNCTIONS =============================================
// ====================================================================================================

/**
 * Remove duplicate key points using AI-enhanced similarity detection
 */
const deduplicateAIKeyPoints = (keyPoints: AIExtractedKeyPoint[]): AIExtractedKeyPoint[] => {
  const unique: AIExtractedKeyPoint[] = [];
  const seen = new Set<string>();
  
  const sorted = [...keyPoints].sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  for (const point of sorted) {
    const normalized = point.text.toLowerCase().trim();
    const words = normalized.split(/\s+/).filter(w => w.length > 3);
    const fingerprint = words.slice(0, 5).join(' ');
    
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

/**
 * Extract direct quotes from transcript content
 */
const extractQuotesFromTranscript = (transcript: string, storyAngle: string): string[] => {
  if (!transcript || transcript.length < 50) return [];
  
  const sentences = transcript
    .split(/[.!?]+\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 150);
  
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
    .slice(0, 3);
  
  return quotes;
};

/**
 * Process multiple sources with AI-powered extraction and deduplication using 3-step pipeline
 */
export const processMultipleSourcesWithAI = async (
  sources: Array<{ content: string; title: string; type: string }>,
  transcript: string,
  userFocus: string,
  minKeyPoints: number = 5
): Promise<{
  transcriptKeyPoints: AIExtractedKeyPoint[];
  webResourceKeyPoints: AIExtractedKeyPoint[];
  summary: string;
  keywords: string[];
}> => {
  const extractedKeywords = await extractKeywordsWithGemini(userFocus);
  const allKeywords = [...extractedKeywords.keywords, ...extractedKeywords.phrases];

  const transcriptKeyPoints: AIExtractedKeyPoint[] = [];
  const webResourceKeyPoints: AIExtractedKeyPoint[] = [];

  if (transcript.trim()) {
    const points = await extractKeyPointsWithGemini(
      transcript,
      'Interview Transcript',
      userFocus,
      extractedKeywords,
      'transcript'
    );
    transcriptKeyPoints.push(...points);
  }

  for (const source of sources) {
    const points = await extractKeyPointsWithGemini(
      source.content,
      source.title,
      userFocus,
      extractedKeywords,
      'webResource'
    );
    webResourceKeyPoints.push(...points);
  }

  const dedupTranscription = deduplicateAIKeyPoints(transcriptKeyPoints);
  const dedupResources = deduplicateAIKeyPoints(webResourceKeyPoints);

  const summary = `AI extracted ${dedupTranscription.length} key points from transcription and ${dedupResources.length} key points from web/resources using Gemini 2.5 Flash.`;

  return {
    transcriptKeyPoints: dedupTranscription,
    webResourceKeyPoints: dedupResources,
    summary,
    keywords: allKeywords
  };
};

/**
 * Enhanced mock article generation with proper structure
 */
const generateEnhancedMockArticle = (
  keyPoints: KeyPoint[],
  sources: Source[],
  transcript: string,
  storyDirection: StoryDirection,
  userFocus: string,
  quotes: string[],
  providedHeadline?: string
): DraftResult => {
  const verifiedKeyPoints = keyPoints.filter(point => point.status === 'VERIFIED');
  
  const headline = providedHeadline || `Insights on ${userFocus}`; // Use a simple fallback
  
  const introduction = generateIntroduction();
  const body = generateBody();
  const conclusion = generateConclusion();
  
  const fullArticle = `**${headline}**\n\n${introduction}\n\n${body}\n\n${conclusion}`;
  const wordCount = fullArticle.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);
  
  const sourceMapping = generateSourceMapping();
  
  return {
    draft: fullArticle,
    sourceMapping,
    headline,
    wordCount,
    readTime
  };
  
  function generateIntroduction(): string {
    const hasQuotes = quotes.length > 0;
    const sampleQuote = hasQuotes ? quotes[0] : '';
    
    switch (storyDirection.angle) {
      case 'success-story':
        return `In today's rapidly evolving business landscape, success stories often emerge from strategic vision combined with precise execution. ${hasQuotes ? `"${sampleQuote}," reflecting the momentum that has characterized recent developments.` : 'The insights from recent developments reveal a systematic approach to growth that extends beyond traditional metrics.'}\n\nThis transformation represents more than incremental progress—it demonstrates how strategic alignment with market dynamics can create sustainable competitive advantages. The evidence points to a comprehensive approach that balances innovation with operational excellence, positioning the organization for continued expansion in an increasingly complex marketplace.`;
      
      case 'challenges-overcome':
        return `Behind every breakthrough lies a series of obstacles that once seemed insurmountable. ${hasQuotes ? `"${sampleQuote}," highlighting the mindset that transforms challenges into competitive advantages.` : 'The approach to overcoming significant challenges has revealed patterns of resilience and strategic thinking.'}\n\nThe ability to navigate complex business challenges while maintaining forward momentum requires both tactical flexibility and strategic clarity. These experiences have shaped a more resilient organizational structure, demonstrating how systematic problem-solving can create lasting value and competitive differentiation.`;
      
      case 'innovation-focus':
        return `At the intersection of technology and strategy, breakthrough innovations are reshaping traditional business practices. ${hasQuotes ? `"${sampleQuote}," emphasizing the transformative potential of strategic innovation.` : 'The integration of innovative approaches has created new possibilities for growth and efficiency.'}\n\nInnovation in today's context extends far beyond technological implementation to encompass strategic thinking, operational excellence, and market positioning. This comprehensive approach has established a foundation for sustained competitive advantage through continuous adaptation and strategic foresight.`;
      
      default:
        return `In an increasingly complex business environment, strategic insights often emerge from the intersection of vision, execution, and market understanding. ${hasQuotes ? `"${sampleQuote}," providing context for the strategic decisions that have shaped recent developments.` : 'The patterns that emerge from recent developments offer valuable insights into strategic positioning and market dynamics.'}\n\nThe convergence of strategic planning, operational excellence, and market awareness creates opportunities for organizations that can effectively balance immediate concerns with long-term vision. These insights reveal approaches that extend beyond traditional business practices to encompass broader questions of competitive advantage and sustainable growth.`;
    }
  }
  
  function generateBody(): string {
    if (verifiedKeyPoints.length === 0) {
      return 'The analysis of available information is ongoing, with comprehensive insights pending verification of key data points. Strategic development continues across multiple dimensions, with particular attention to market positioning and operational efficiency.';
    }
    
    const bodyText = verifiedKeyPoints.map(point => {
        const attribution = point.type === 'transcript' ? 'According to the discussion' : `Based on ${point.source}`;
        return `${attribution}, ${point.text} This development reflects broader strategic initiatives that align with market opportunities and organizational capabilities.`;
    }).join('\n\n');
    
    return bodyText;
  }
  
  function generateConclusion(): string {
    return `Looking ahead, these developments position the organization for continued growth and market leadership. The strategic framework established through these initiatives creates a foundation for adapting to future market dynamics while maintaining competitive advantages.\n\nThe implications extend beyond immediate business outcomes to broader questions of industry evolution and market positioning. As these strategies continue to evolve, they will likely influence best practices across the sector, demonstrating the value of comprehensive strategic thinking in an increasingly complex business environment.`;
  }
  
  function generateSourceMapping(): Record<string, string[]> {
    const sourceNames = sources.map(s => s.title);
    if (transcript) sourceNames.push('Interview Transcript');
    
    return {
      'paragraph_1': sourceNames.slice(0, 2),
      'paragraph_2': sourceNames.slice(1, 3),
      'paragraph_3': sourceNames
    };
  }
};