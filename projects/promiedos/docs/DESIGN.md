# Design brief — Promiedos

**DESIGN BRIEF FOR PROMIEDOS CLONE**

**MOOD:**  
This app should evoke the fervor and excitement of Argentine football, with a dynamic, energetic, and passionate vibe. The visual identity should capture the essence of a live sports broadcast, with bold elements and vibrant contrasts that reflect the intensity of the game. Reference the visual impact of ESPN's live sports graphics and the immersive feel of the FIFA app's match center.

**COLOR ROLES:**  
- **Background:** `bg-[#FFFFFF]` — Crisp and clean to ensure content stands out.
- **Surface/Cards:** `bg-[#FFCC00]` — Warm, inviting, and energetic, reminiscent of stadium lights.
- **Primary CTA:** `bg-[#FF0000]` — Bold and urgent, drawing immediate attention.
- **Accent:** `bg-[#000000]` — Used sparingly for emphasis and contrast.
- **Text:** `text-[#000000]` — Strong and clear, ensuring readability.
- **Muted:** `text-[#333333]` — For secondary information and less critical content.

**TYPE:**  
- Use big, bold titles for headlines (`font-bold`, `text-3xl`) to convey urgency and importance.
- Medium weight (`font-medium`) for subheadings and important information (`text-xl`).
- Regular weight (`font-normal`) for body text (`text-base`) to maintain readability.

**COMPONENT RECIPES:**  
- **Cards:** `rounded-3xl shadow-lg p-6 bg-[#FFCC00]` — Rounded for a modern look, with a subtle shadow for depth.
- **Primary Buttons:** `bg-[#FF0000] text-[#FFFFFF] rounded-full py-2 px-4 font-bold hover:bg-opacity-90 transition-all`
- **Secondary Buttons:** `bg-[#FFFFFF] text-[#FF0000] border border-[#FF0000] rounded-full py-2 px-4 font-medium hover:bg-[#FFCC00] transition-all`
- **Chips/Badges:** `bg-[#FFCC00] text-[#000000] rounded-full px-3 py-1 text-sm font-medium`
- **Inputs:** `border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all`
- **Bottom Tab Bar:** `bg-[#FFFFFF] border-t border-[#333333] flex justify-around items-center py-3`

**MOTION:**  
Subtle transitions for hover states and focus (`transition-all duration-200 ease-in-out`). Cards and buttons should have a slight scale effect on interaction to mimic the excitement of a live match.

**PER-SCREEN LAYOUT:**

- **/app (Partidos en Vivo):**  
  Immersive full-bleed photo card stack. Each card with a gradient scrim overlay, displaying match title and time. Large circular like/pass buttons (`bg-[#FF0000]` for like, `bg-[#000000]` for pass) at the bottom corners.

- **/app/matches/create (Create Match):**  
  Form-centric layout with inputs and primary button at the bottom. Use cards for each section of the form to separate content.

- **/app/tournaments/create (Create Tournament):**  
  Similar to match creation, but with emphasis on tournament details. Use badges to highlight key info.

- **/app/standings/create (Create Standings):**  
  Table format with clear, bold headings and alternating card colors for rows to enhance readability.

- **/app/goal-scorers/create (Create Goal Scorer):**  
  Focus on player stats with large, bold typography for player names and scores. Use chips for team names and positions.

Ensure all elements maintain a cohesive look that aligns with the high-energy, sports-focused theme.
