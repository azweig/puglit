# Design brief — Promiedos

**DESIGN BRIEF FOR PROMIEDOS CLONE**

**MOOD**
The mood for Promiedos is dynamic, energetic, and engaging, reflecting the passion and intensity of Argentine football. Visual references include the bold, vibrant graphics of sports channels like ESPN and the dynamic, data-rich interfaces of apps like SofaScore.

**LAYOUT ARCHITECTURE**
- **Navigation**: Implement a sticky top bar with horizontal tabs to switch between key sections (e.g., "Partidos", "Torneos", "Tabla de Posiciones"). This keeps essential navigation within easy reach while maximizing vertical space for dense content.
- **Content Width**: Use full-width content for a comprehensive view of information, allowing users to see more data at a glance.
- **Home Screen Composition**: The home screen (Fútbol Argentino en Vivo) will feature a dense, scannable list of live matches with expandable cards for detailed views, ensuring users can quickly access live updates and scores.

**COLOR ROLES**
- **Background**: bg-[#581845]
- **Surface/Cards**: bg-[#FFC300]
- **Primary CTA**: bg-[#FF5733]
- **Accent**: text-[#900C3F]
- **Text**: text-[#FFFFFF]
- **Muted**: text-[#DAF7A6] for less critical information

**TYPE**
- Use bold, large titles for headings (text-3xl font-bold) to capture attention.
- Body text should be medium weight (text-base font-medium) for readability.
- Use italic styling for live updates to emphasize immediacy.

**COMPONENT RECIPES**
- **Cards**: bg-[#FFC300] p-4 shadow-md rounded-lg transition-transform transform hover:scale-105
- **Primary Button**: bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors
- **Secondary Button**: bg-[#C70039] text-[#FFFFFF] py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors
- **Chips/Badges**: bg-[#DAF7A6] text-[#581845] py-1 px-3 rounded-full
- **Inputs**: border-b-2 border-[#900C3F] focus:border-[#FF5733] text-[#FFFFFF] bg-transparent

**MOTION**
- Implement subtle transitions for hover states on buttons and cards (transition-transform, transition-colors) to enhance interactivity without overwhelming users.

**PER-SCREEN LAYOUT**
- **/** (Fútbol Argentino en Vivo): A dense list of live matches with expandable cards for match details. Include quick-action buttons for favorite matches.
- **/tournaments** (Torneos): A grid layout showcasing tournament logos and names. Clicking a tournament navigates to its standings.
- **/standings/[tournamentId]** (Tabla de Posiciones): A table layout with team rankings, points, and stats. Highlight the top teams with accent colors.
- **/match/[matchId]/goal-scorers** (Goleadores): A list of goal scorers with expandable details for each player.
- **/matches/create** (Create Match): A form layout with inputs for match details, using clearly defined sections.
- **/tournaments/create** (Create Tournament): Similar to Create Match, but with additional fields for tournament structure.
- **/standings/update** (Update Standings): A table interface for admins to update standings with inline editing capabilities.
- **/match/[matchId]/goal-scorers/add** (Add Goal Scorer): A simple form to add goal scorers, emphasizing quick input and submission.

This design ensures a cohesive, immersive experience that leverages the dynamic nature of Argentine football and the vibrant color palette.
