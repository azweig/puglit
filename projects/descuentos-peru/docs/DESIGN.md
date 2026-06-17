# Design brief — Descuentos Perú

**DESIGN BRIEF FOR DESCUENTOS PERÚ**

**MOOD**
The visual identity for Descuentos Perú should evoke a sense of excitement and discovery, akin to unearthing hidden treasures in the urban landscape. The aesthetic should be vibrant and dynamic, drawing inspiration from the bustling markets of Peru and the cultural richness of its cities. Reference the boldness of local street art and the vibrant energy of a traditional Peruvian festival.

**COLOR ROLES**
- Background: #581845 (bg-[#581845]) — Deep and rich, setting a dramatic backdrop.
- Surface/Cards: #FFC300 (bg-[#FFC300]) — Warm and inviting, enhancing readability and focus.
- Primary CTA: #FF5733 (bg-[#FF5733]) — Energetic and attention-grabbing for primary actions.
- Accent: #900C3F (bg-[#900C3F]) — Used sparingly for highlights and interactive elements.
- Text: #FFFFFF (text-[#FFFFFF]) — Crisp and clear against the vibrant palette.
- Muted: #C70039 (text-[#C70039]) — For secondary information and less prominent text.

**TYPE**
- Titles: Large, bold, and confident. Use a weighty sans-serif for clarity and impact, e.g., text-3xl font-bold.
- Body: Maintain readability with a medium sans-serif, e.g., text-base font-medium.
- Smaller text (e.g., captions): Utilize a lighter weight for a delicate touch, e.g., text-sm font-light.

**COMPONENT RECIPES**
- **Cards**: rounded-3xl, shadow-lg, bg-[#FFC300], text-[#FFFFFF], p-6
- **Primary Button**: bg-[#FF5733], text-[#FFFFFF], rounded-full, px-6 py-3, text-lg font-semibold, hover:bg-[#C70039]
- **Secondary Button**: bg-transparent, border-2 border-[#FF5733], text-[#FF5733], rounded-full, px-6 py-3, text-lg font-semibold, hover:border-[#C70039], hover:text-[#C70039]
- **Chips/Badges**: bg-[#900C3F], text-[#FFFFFF], rounded-full, px-3 py-1, text-sm font-medium
- **Inputs**: bg-[#FFC300], text-[#581845], rounded-lg, px-4 py-2, placeholder-[#C70039], border-none, focus:ring-2 focus:ring-[#FF5733]
- **Bottom Tab Bar**: bg-[#581845], text-[#FFFFFF], flex justify-around, py-2, border-t-2 border-[#900C3F]

**MOTION**
Implement subtle transitions such as:
- Hover on buttons: transition-all duration-200 ease-in-out
- Card hover: transform scale-105 transition-transform duration-150 ease-in-out
- Tab switch: transition-opacity duration-150 ease-in-out

**PER-SCREEN LAYOUT**
- **/app (Descubrir)**: Full-bleed photo card stack with immersive swipe functionality. Overlay titles and discounts over a gradient scrim (from transparent to bg-[#581845]) at the bottom of each card. Large circular buttons for like/pass actions at the lower corners.
  
- **/app/loyalty-programs (Programas de Lealtad)**: Grid layout showcasing loyalty programs. Each card should include program logos, a brief description, and a CTA button. Ensure spacing allows for a clean, organized view.

- **/app/location (Ubicación)**: Display a map (styled with a custom mapbox layer to match the palette) at the top half. Below, list nearby discounts in a card format, prioritizing those most relevant to the user's location.

This design should not only guide users in a functional manner but also immerse them in the vibrant world of Peruvian savings and rewards.
