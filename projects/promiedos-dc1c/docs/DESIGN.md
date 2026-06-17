# Design brief — Promiedos

**Design Brief for Promiedos Clone**

**MOOD:**
The visual identity should evoke the excitement and passion of Argentine football. It should be dynamic, energetic, and immersive, reflecting the intensity of live matches and the tradition of local leagues. References include the bold energy of ESPN's sports apps and the immersive, card-based browsing experience of Tinder.

**COLOR ROLES:**
- **Background:** #FFFFFF (bg-[#FFFFFF]) - Clean and neutral to allow content to stand out.
- **Surface/Cards:** #CCCCCC (bg-[#CCCCCC]) - Provides a subtle contrast for content areas.
- **Primary CTA:** #FF0000 (bg-[#FF0000]) - Bold and attention-grabbing, perfect for call-to-action elements.
- **Accent:** #FFD700 (bg-[#FFD700]) - Used sparingly for highlights and emphasis.
- **Text:** #000000 (text-[#000000]) - Strong contrast for readability.
- **Muted:** #CCCCCC (text-[#CCCCCC]) - For secondary information or less important text.

**TYPE:**
- **Headlines:** Bold and large to capture attention, using a weight of 700.
- **Body:** Medium weight (400-500) for readability, slightly smaller than headlines.
- **Scale:** Use a clear hierarchy, with large titles and smaller subtitles.

**COMPONENT RECIPES:**
- **Cards:** `rounded-3xl shadow-md bg-[#CCCCCC] p-6 mb-4`
- **Primary Button:** `bg-[#FF0000] text-[#FFFFFF] rounded-full py-2 px-6`
- **Secondary Button:** `bg-[#FFFFFF] text-[#FF0000] border-2 border-[#FF0000] rounded-full py-2 px-6`
- **Chips/Badges:** `bg-[#FFD700] text-[#000000] rounded-full px-3 py-1`
- **Inputs:** `border-2 border-[#CCCCCC] rounded-lg py-2 px-4 w-full`
- **Bottom Tab Bar:** `bg-[#FFFFFF] shadow-inner flex justify-around py-3`

**MOTION:**
- Use subtle CSS transitions for hover effects and button presses (e.g., `transition-all duration-200 ease-in-out`).
- Cards should have a slight hover elevation (`transform hover:scale-105`).

**PER-SCREEN LAYOUT:**

- **/app (Partidos en Vivo):** 
  - Immersive full-screen card stack. Each card represents a live match with a full-bleed background image.
  - Overlay gradient scrim with match details (teams, time, score) in bold text.
  - Large circular buttons for like/pass actions positioned centrally at the bottom.

- **/app/matches/create (Create Match):**
  - Form layout with inputs for match details.
  - Primary CTA button at the bottom for submission.

- **/app/leagues/create (Create League):**
  - Similar to Create Match, use form inputs with clear labels.
  - Include a section for selecting league logo (file upload).

- **/app/players/create (Create Player):**
  - Use a card layout for each player input section.
  - Include photo upload and dropdowns for team selection.

- **/app/fixtures/create (Create Fixture):**
  - Grid layout for selecting teams and match dates.
  - Use chips for quick selections of existing teams.

Ensure all screens maintain a consistent look and feel, emphasizing the vibrant and dynamic nature of Argentine football.
