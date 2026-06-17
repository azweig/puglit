# Design brief — Promiedos

**MOOD**
The visual identity should evoke the intensity and passion of Argentine football. It should feel dynamic and energetic, capturing the essence of live football experiences. References include the vivid color palette of ESPN's sports coverage and the clean, data-focused layout of the Premier League's official app.

**LAYOUT ARCHITECTURE**
Opt for a sticky top bar with horizontal tabs and full-width content to create a dense, scannable live list/table. This structure supports the fast-paced updates and quick access needed for live sports data. The top bar will house navigation tabs for quick switching between matches, standings, and scorers. Content will be full-width to maximize information display, with a focused, single-column layout for easy readability.

**COLOR ROLES**
- Background: bg-[#FFFFFF]
- Surface/Cards: bg-[#FF6347] (shade1) for highlights, bg-[#FF7F50] (shade2) for less prominent data
- Primary CTA: bg-[#FF4500] (primary)
- Accent: text-[#FFD700] for highlights and key information
- Text: text-[#000000]
- Muted: text-[#808080] for less important info

**TYPE**
Use a bold typeface for titles and headings, reflecting the excitement of the sport. Headings: font-bold text-2xl. Subheadings: font-semibold text-xl. Body: font-normal text-lg for easy readability.

**COMPONENT RECIPES**
- **Cards:** bg-[#FF6347] shadow-md rounded-lg p-4
- **Primary Button:** bg-[#FF4500] text-[#FFFFFF] font-bold rounded-lg px-6 py-2 hover:bg-[#FF7F50] transition-colors
- **Secondary Button:** bg-[#FFFFFF] text-[#FF4500] border border-[#FF4500] rounded-lg px-6 py-2 hover:bg-[#FF6347] hover:text-[#FFFFFF] transition-colors
- **Chips/Badges:** bg-[#FFD700] text-[#000000] rounded-full px-3 py-1 text-sm
- **Inputs:** bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 focus:border-[#FF4500] focus:outline-none

**MOTION**
Apply subtle transitions for interactive elements: transition-colors, transition-transform for hover states (e.g., scale-105 on hover for buttons).

**PER-SCREEN LAYOUT**
- **/** (Fútbol Argentino en Vivo): A full-width list of live matches, each as a card with match details, live status, and action buttons.
- **/matches** (Partidos del Día): A dense list of today's matches, sorted by time, with quick info and a toggle for live updates.
- **/standings** (Tablas de Posiciones): A full-width table, sortable by columns, showing team rankings with visual emphasis on top positions.
- **/scorers** (Goleadores): A list view showcasing top scorers, with player photos, goals scored, and team logos.
- **Create Screens (/app/create-match, etc.):** Form-centric layouts with clear, full-width input fields and prominent action buttons at the bottom.

Design with the goal of providing a swift, immersive experience that keeps users engaged in the dynamic world of Argentine football.
