# StoryForge: AI-Powered Article Drafting MVP

## Project Overview
StoryForge is an MVP that transforms an **interview transcript** plus **supporting sources** into a story-driven draft article with **human-in-the-loop (HITL) review**.

**Project URL:** [StoryForge MVP](https://lovable.dev/projects/dd1142d0-b67b-4ae3-b175-398d9332289b)

**Sample Sources for Testing:**
- [Meta Ray-Ban Display Hands-On – The Verge](https://www.theverge.com/tech/779566/meta-ray-ban-display-hands-on-smart-glasses-price-battery-specs)  
- [Meta AI Smart Glasses Connect – CNN](https://edition.cnn.com/2025/09/17/tech/meta-ai-smart-glasses-connect)  
- [Zuckerberg on Meta Ray-Ban Display – CNBC](https://www.cnbc.com/2025/09/17/zuckerberg-799-meta-ray-ban-display-glasses.html)  
- [Meta Ray-Ban Display AI Smart Glasses Demo – CNN](https://edition.cnn.com/2025/09/18/tech/meta-ray-ban-display-ai-smart-glasses-demo)  

**Interview Transcript:** [Inside Meta’s AI Glasses Master Plan](https://www.therundown.ai/p/inside-metas-ai-glasses-master-plan)  
*Also attached in the `/resources` folder.*

**Demo:** Available in `/Demo - Lahirunee Weerathunge`  
YouTube (unlisted): [Watch Demo](https://www.youtube.com/watch?v=64fE5FC1Zt4)

---

## Assumptions
- Transcript contains a clear **main character** whose quotes are essential.  
- Supporting sources can be **PDFs, web articles, or plain text**.  
- At least **one main-character quote** must connect to the article’s focus, goals, and chosen story angle.  
- Editors can **regenerate or edit article headlines** and approve key points interactively.  
- **Keywords and phrases** extracted from the user-provided focus drive draft relevance.  

---

## Architecture Overview
The system uses a **3-step AI-powered pipeline** with **Gemini 2.5 Flash**:

### Step 1: Keyword Extraction
- Extract main keywords, key phrases, and themes from the user-provided focus.  
- Fallback keyword extraction applies simple matching if AI fails.  

### Step 2: Key Point Extraction
- Extract **5–12 detailed key points** from transcript and supporting sources.  
- Points include **matched keywords, reasoning, and relevance scores**.  
- Deduplicate repeated or semantically similar points.  
- Human-in-the-loop: editors can review, reorder, or verify points.  

### Step 3: Draft Article Generation
- Generate draft based on **approved key points, story direction** (tone, angle, length), and user focus.  
- Include at least **one main-character quote** tied to the article’s focus and story angle.  
- Optional **headline regeneration** via Gemini 2.5 Flash with Save button updates draft dynamically.  
- Outputs:
  - Draft content  
  - Source mapping  
  - Headline  
  - Word count  
  - Estimated read time  

---

## Handling Key-Point Approval, Source Mapping, and Quote Checks
- **Key-Point Approval:** Editors can review automatically extracted key points, **approve** them before draft generation.  
- **Source Mapping:** Each key point and paragraph in the draft is linked to its original source, ensuring **transparency and traceability**.  
- **Quote Verification:** Main-character quotes are **checked against the transcript** to ensure accuracy and relevance to the article’s focus.  
- **HITL Interaction:** Editors can dynamically regenerate the draft or headlines, and updates reflect approved key points and verified quotes.

---

## Highlights
- Draft structure: **Introduction, Body, Conclusion**, with natural integration of quotes.  
- Headlines can be **regenerated or edited**, and saving updates the article automatically.  

---

## Trade-offs & Next Steps
**Trade-offs:**  
- Minimal UI; fallback logic for AI failures; time consuming when extracting key points.  

**Next Steps:**  
- Improve UI/UX for users.  
- Add enhanced AI-assisted suggestions for key-point extraction and draft generation.  
- Reorder and edit key points dynamically.

---

## How to Use
1. Paste/upload the interview transcript.  
2. Attach at least one supporting source (PDF, web source URLs, or text).  
3. Specify the user’s focus points or goals for the article.  
4. Extract key points automatically; users can approve points.  
5. Set story direction (tone, angle, length, optional custom instructions).  
6. Generate article draft referencing approved key points and story angle.  
7. Regenerate or edit headline; click **Save** to update the article dynamically.
8. Check main-character quotes for accuracy against transcript.  
9. Edit the article if needed.  
10. Export the final article as Markdown/PDF/TXT (optionally include provenance JSON).








