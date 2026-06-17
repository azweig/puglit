# Design brief — Promiedos

**Design Brief for Promiedos App**

**MOOD:**  
The visual identity for the Promiedos app should capture the excitement and passion of Argentine football. This involves a dynamic, energetic aesthetic with a modern, tech-forward feel, akin to sports broadcasting graphics. The mood should be bold and engaging, similar to ESPN's sports dashboards and the La Liga football app, which are both visually rich and information-dense.

**COLOR ROLES:**  
- **Background:** `bg-[#581845]` - A deep, vibrant hue that sets a dramatic stage, ensuring strong contrast for readability.
- **Surface/Cards:** `bg-[#DAF7A6]` - Light, fresh surfaces for cards to pop against the background.
- **Primary CTA:** `bg-[#FF5733]` - A bright, eye-catching color for primary actions.
- **Accent:** `bg-[#900C3F]` - Used sparingly to draw attention to key elements or alerts.
- **Text:** `text-[#FFFFFF]` - Crisp white for maximum readability against dark and light surfaces.
- **Muted:** `text-[#C70039]` - For secondary information, providing a softer contrast.

**TYPE:**  
Use bold, heavy-weight type for titles and headers to convey urgency and importance (e.g., `font-bold`, `text-3xl` for titles). Body text should be `text-base` with a medium weight to maintain readability.

**COMPONENT RECIPES:**  
- **Cards:** `rounded-3xl shadow-lg bg-[#DAF7A6] p-4`
- **Primary Button:** `bg-[#FF5733] text-[#FFFFFF] font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200`
- **Secondary Button:** `bg-[#C70039] text-[#FFFFFF] font-medium py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200`
- **Chips/Badges:** `bg-[#FFC300] text-[#900C3F] font-medium py-1 px-3 rounded-full`
- **Inputs:** `bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]`
- **Bottom Tab Bar:** `flex justify-around bg-[#581845] text-[#FFFFFF] py-2`

**MOTION:**  
Utilize subtle transitions for hover states and component appearances. For example, `transition-all duration-200` for buttons and cards to enhance interactivity without overwhelming the user.

**PER-SCREEN LAYOUT:**

- **/app (Partidos en Vivo):**  
  A dense, scannable list format. Each match displays as a card with teams, scores, and live updates. Use `grid grid-cols-1 gap-4` for arrangement, emphasizing real-time updates with `bg-[#FF5733]` badges for live matches.

- **/app/matches/create (Create Match):**  
  Form layout with inputs stacked `flex flex-col space-y-4`. Use a primary button for submission at the bottom.

- **/app/tournaments/create (Create Tournament):**  
  Similar to matches, with additional sections for tournament details. Use `bg-[#DAF7A6]` cards to separate sections.

- **/app/standings/create (Create Standings):**  
  Utilize a table-like format with `flex flex-col` for teams and points, highlighting inputs with `bg-[#FFFFFF]`.

- **/app/goal-scorers/create (Create Goal Scorer):**  
  Simple list format for inputting scorers, using `bg-[#DAF7A6]` cards for each entry.

This design direction ensures an immersive, user-centric experience that aligns with the passionate culture of Argentine football.
