# Design brief — Descuentos Perú

**Design Brief for Descuentos Perú App**

**MOOD:**
Descuentos Perú should evoke the vibrant energy of Peruvian culture, reflecting the lively and dynamic nature of local markets and street scenes. The visual identity should feel warm, inviting, and adventurous, much like a bustling market filled with exciting discoveries. References include the colorful vibrancy of Peruvian textiles and the bustling nature of local marketplaces.

**COLOR ROLES:**
- Background: bg-[#581845]
- Surface/Cards: bg-[#FFC300]
- Primary CTA: bg-[#FF5733]
- Accent: bg-[#900C3F]
- Text: text-[#FFFFFF]
- Muted: text-[#C70039]

**TYPE:**
- Titles: Large, bold, and impactful to convey energy and excitement, using a weight like font-bold.
- Body: Clear and readable, with a medium weight for balance, using font-medium.
- Scale: Titles should be significantly larger than body text to create a visual hierarchy, e.g., text-2xl for titles and text-base for body text.

**COMPONENT RECIPES:**

- **Cards:** Use rounded-3xl for a soft, approachable look, with shadow-lg for depth. Background should be the surface color (bg-[#FFC300]) with text in text-[#FFFFFF].

- **Primary Button:** Rounded-full, bg-[#FF5733], text-[#FFFFFF], py-3 px-6, hover:bg-[#C70039] for interaction feedback.

- **Secondary Button:** Rounded-full, border border-[#FF5733], text-[#FF5733], py-2 px-5, hover:bg-[#FF5733] hover:text-[#FFFFFF].

- **Chips/Badges:** Rounded-full, text-xs, px-3 py-1, bg-[#900C3F], text-[#FFFFFF].

- **Inputs:** Rounded-lg, bg-[#581845], text-[#FFFFFF], placeholder-[#C70039], border-none, px-4 py-2.

- **Bottom Tab Bar:** Fixed bottom-0, bg-[#900C3F], text-[#FFFFFF], py-3, flex justify-around items-center.

**MOTION:**
- Subtle transitions using transition-all duration-300 for hover and focus states on buttons and cards.
- Use transform scale-105 on hover for cards to create an engaging interactive feel.

**PER-SCREEN LAYOUT:**

- **/app (Descubrir):** Full-bleed photo card stack with immersive experience. Cards should fill the screen width with a gradient scrim at the bottom. Overlay the title and price in large, bold text. Large circular like/pass buttons should be positioned centrally at the bottom.

- **/app/memberships (Mis Programas):** Grid layout with cards representing each membership. Use the card component recipe for consistency.

- **/app/location (Ubicación):** Map-centric design with location pins styled using accent color. Minimal text overlay to keep focus on the map.

- **/app/offers (Ofertas Cercanas):** List of offers with cards. Use a larger card size to emphasize the deals, with offer details overlaid in a bold font.

- **/app/merchants (Comerciantes):** Grid layout, each merchant represented by a card with their logo and a brief description.

- **/app/branches (Sucursales):** List view with each branch as a card. Include address and distance prominently.

This design approach ensures a cohesive, engaging, and visually appealing experience that encourages exploration and discovery.
