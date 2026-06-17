# Design brief — Promiedos

**DESIGN BRIEF FOR PROMIEDOS CLONE**

**MOOD:**
The visual identity for Promiedos Clone should evoke the adrenaline and passion of Argentine football. Think of the vibrant energy of a packed stadium and the intensity of a last-minute goal. References include the lively interfaces of ESPN's ScoreCenter app and the dynamic presentation of OneFootball.

**LAYOUT ARCHITECTURE:**
- **Navigation:** Use a fixed top bar with horizontal tabs for primary navigation, providing quick access to key sections: "Fútbol Argentino en Vivo," "Torneos," "Tabla de Posiciones," "Goleadores," and "Resultados Históricos."
- **Content:** Full-width content areas allow for dense, scannable lists and tables, essential for quickly digesting live scores and standings.
- **Home Screen Composition:** The homepage (Fútbol Argentino en Vivo) should feature a dynamic, auto-updating live match list with expandable match details beneath each item.

**COLOR ROLES:**
- **Background:** bg-[#581845]
- **Surface/Cards:** bg-[#C70039]
- **Primary CTA:** bg-[#FF5733]
- **Accent:** border-[#900C3F]
- **Text:** text-[#FFFFFF]
- **Muted:** text-[#FFC300]

**TYPE:**
- Use bold, large titles (700 weight) for headings, emphasizing critical information like match scores or standings.
- Body text should be medium weight (500), ensuring readability in dense data displays.

**COMPONENT RECIPES:**
- **Cards:** bg-[#C70039] p-4 rounded-lg shadow-md
- **Primary Button:** bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-full hover:bg-[#FFC300] transition duration-200
- **Secondary Button:** bg-transparent border-2 border-[#FF5733] text-[#FF5733] py-2 px-4 rounded-full hover:bg-[#FF5733] hover:text-[#FFFFFF] transition duration-200
- **Chips/Badges:** bg-[#900C3F] text-[#FFFFFF] py-1 px-3 rounded-full text-sm
- **Inputs:** border-2 border-[#FFC300] bg-transparent text-[#FFFFFF] p-2 rounded-md focus:outline-none focus:border-[#FF5733]

**MOTION:**
- Use subtle transitions for hover effects and state changes with a duration of 200ms, ensuring a responsive and engaging user experience.

**PER-SCREEN LAYOUT:**
- **/** Fútbol Argentino en Vivo: A dynamic list with collapsible match details, live scores prominently displayed.
- **/tournaments** Torneos: A grid layout showcasing tournament logos and names, tapping into detail screens.
- **/tournament/[id]/standings** Tabla de Posiciones: A dense table view with sortable columns for team rankings.
- **/tournament/[id]/goal-scorers** Goleadores: A list format highlighting top scorers with expandable player stats.
- **/matches/new** Create New Match: A form with step-by-step inputs, each step as a separate card.
- **/tournaments/new** Create New Tournament: A similar card-based, step-by-step form.
- **/tournament/[id]/standings/update** Update Standings: Editable table format for quick data entry.
- **/tournament/[id]/goal-scorers/update** Update Goal Scorers: Inline editable list for scoring updates.

This design approach ensures that the app feels like a live sports broadcast, capturing the excitement and immediacy of Argentine football.
