# Design brief — Truke

**MOOD + REFERENCES:**
The visual identity of Truke should evoke a playful yet trustworthy atmosphere, similar to Tinder's immersive card-stack experience but with the warmth and trust of OLX or eBay. The app should feel like a vibrant bazaar where exploration leads to serendipitous exchanges.

**LAYOUT ARCHITECTURE:**
- **Navigation:** Utilize a bottom tab bar for navigation, allowing quick access to primary sections: Descubrir, Publicar, Mis Matches, and Chat. This keeps the focus on interaction and discovery.
- **Content Width:** Full-bleed design for Descubrir to maintain an immersive experience. Centered content for Publicar, Mis Matches, and Chat to encourage focus on specific tasks.
- **Home Screen Composition:** Descubrir features a full-bleed card stack for swiping through items, with large, tappable like/pass buttons overlaid on each card.

**COLOR ROLES:**
- Background: `bg-[#FFFFFF]`
- Surface/Cards: `bg-[#F5A623]`
- Primary CTA: `bg-[#FF6F61]`
- Accent: `text-[#F8E71C]`
- Text: `text-[#4A4A4A]`
- Muted: `text-[#7ED321]`

**TYPE:**
- Titles: Big, bold, and welcoming. Use `font-bold text-2xl` for section headers.
- Body: `font-medium text-base` for readability.
- Subtle elements: `font-normal text-sm` for secondary information.

**COMPONENT RECIPES:**
- **Cards:** `bg-[#F5A623] shadow-lg rounded-lg p-4 mb-4 transition-transform transform hover:scale-105`
- **Primary Button:** `bg-[#FF6F61] text-[#FFFFFF] font-bold py-2 px-4 rounded-full transition-colors hover:bg-opacity-90`
- **Secondary Button:** `bg-[#4A90E2] text-[#FFFFFF] font-medium py-2 px-4 rounded-full transition-colors hover:bg-opacity-90`
- **Chips/Badges:** `bg-[#F8E71C] text-[#4A4A4A] font-semibold py-1 px-3 rounded-full`
- **Inputs:** `border border-[#4A4A4A] rounded-lg p-2 text-[#4A4A4A] focus:border-[#FF6F61]`

**MOTION:**
- Subtle scale transitions on hover for cards (`transition-transform transform hover:scale-105`).
- Fade-in transitions for page content (`transition-opacity duration-300 ease-in-out`).

**PER-SCREEN LAYOUT:**
- **/app (Descubrir):** Full-bleed card stack with large like/pass buttons at the bottom of each card. Encourage exploration with a swipe interaction.
- **/app/publicar (Publicar Objeto):** Centered layout with a prominent form interface. Use large input fields and clear CTAs for submitting items.
- **/app/matches (Mis Matches):** Centered list of matches, each with an image thumbnail and brief description. Use a grid layout for a snapshot view.
- **/app/chat/[matchId] (Chat):** Modern bubble thread design. Messages are in chat bubbles, alternating colors for sender/receiver. 

This design approach ensures a cohesive and engaging experience that aligns with the playful yet functional nature of Truke.
