# Design brief — Promiedos

**DESIGN BRIEF: Promiedos — Clon de Promiedos: Fútbol Argentino en Vivo**

**MOOD:**  
The visual identity should evoke the excitement and passion of Argentine football, while maintaining a professional and organized feel. Reference the energetic style of ESPN with the clean, structured layout of BBC Sport. The look should be dynamic yet easy to navigate, reflecting the fast-paced nature of live sports.

**LAYOUT ARCHITECTURE:**  
- **Navigation:** Use a sticky top bar with horizontal tabs to allow quick access between sections. This keeps navigation intuitive and prominent.
- **Content Width:** Full-width for immersive live updates, with a centered content approach for detailed views like standings or scorers.
- **Home Screen (/app - Partidos en Vivo):** A dense, scannable live list of matches. Each match as a card with prominent team names, scores, and live updates. Grouped by time slots for easy scanning.

**COLOR ROLES:**  
- **Background:** `bg-[#FFFFFF]`
- **Surface/Cards:** `bg-[#F0F0F0]`
- **Primary CTA:** `bg-[#1E90FF]`
- **Accent:** `bg-[#FF4500]`
- **Text:** `text-[#000000]`
- **Muted:** `text-[#808080]`

**TYPE:**  
- **Headers:** Big, bold titles (e.g., 700 weight, 32px size) to capture attention and convey urgency.
- **Body Text:** Medium weight (e.g., 400 weight, 16px size) for readability.

**COMPONENT RECIPES:**  
- **Cards:** `bg-[#F0F0F0] text-[#000000] p-4 rounded-lg shadow-md`
- **Primary Button:** `bg-[#1E90FF] text-[#FFFFFF] py-2 px-4 rounded-md hover:bg-[#104E8B]`
- **Secondary Button:** `bg-[#FFD700] text-[#000000] py-2 px-4 rounded-md hover:bg-[#DAA520]`
- **Chips/Badges:** `bg-[#FF4500] text-[#FFFFFF] px-2 py-1 rounded-full`
- **Inputs:** `border border-[#C0C0C0] p-2 rounded-md focus:border-[#1E90FF]`

**MOTION:**  
Subtle transitions for hover states and page transitions: `transition-all duration-200 ease-in-out`

**PER-SCREEN LAYOUT:**

- **/app (Partidos en Vivo):** Full-width list view with cards for each match. Live scores and updates prominently displayed. Group by time slots.

- **/app/tournaments (Torneos):** Centered content with a grid layout. Each tournament as a card with a brief overview and CTA to view details.

- **/app/standings (Tabla de Posiciones):** Centered table with columns for team, played, won, drawn, lost, and points. Use stripes or alternating row colors for readability.

- **/app/scorers (Goleadores):** List view, with each scorer as a card. Include player photo, goals, and team.

- **/app/matches/create (Create Match):** Form with labeled inputs and dropdowns. Use primary buttons for submission.

- **/app/tournaments/create (Create Tournament):** Similar form structure to Create Match. Include sections for tournament name, start date, and teams.

- **/app/standings/create (Create Standings):** Form with clear inputs for team names and initial points.

- **/app/scorers/create (Create Scorer):** Form to add player details and goals scored. Use a simple, clean layout to avoid errors.

This design brief ensures a cohesive and engaging user experience tailored to the excitement of live Argentine football.
