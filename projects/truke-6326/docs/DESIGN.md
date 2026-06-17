# Design brief — Truke

**Design Brief for Truke:**

**MOOD + References:**
Truke is a vibrant, engaging platform that combines the dynamic interaction style of Tinder with the trust and warmth of a marketplace like OLX. The mood should be playful yet reliable, encouraging users to feel excited about exchanging items. References include the immersive card-swiping experience of Tinder and the user-friendly, community-focused design of OLX.

**LAYOUT ARCHITECTURE:**
- **Navigation:** Adopt a minimal full-bleed wrapper with a floating action button (FAB) for adding new items. This setup emphasizes the swipe interaction central to Truke's functionality.
- **Content Width:** Full-bleed for an immersive experience, allowing users to focus on item images without distractions.
- **Home Screen Composition:** The home screen (/) features a card stack for items, with prominent like/pass swipe functionality. The FAB is positioned at the bottom center for easy item publication access.

**COLOR ROLES:**
- **Background:** bg-[#F5F7FA]
- **Surface/Cards:** bg-white (use #FFFFFF for clear distinction)
- **Primary CTA:** bg-[#FF6F61] for key actions like "Match" or "Post Item"
- **Accent:** bg-[#50E3C2] for secondary highlights
- **Text:** text-[#4A4A4A]
- **Muted/Secondary Text:** text-gray-600
- **Error:** bg-[#D0021B]
- **Warning:** bg-[#F8E71C]

**TYPE:**
- **Titles:** Big, bold sans-serif for primary headings (text-2xl font-bold)
- **Body:** Clean, readable sans-serif (text-base font-medium)
- **Emphasis Text:** Italics or bold where necessary (italic or font-semibold)

**COMPONENT RECIPES:**
- **Cards:** bg-white shadow-md rounded-lg p-4 mb-4 (hover:shadow-lg transition-shadow)
- **Primary Button:** bg-[#FF6F61] text-white py-2 px-4 rounded-full (hover:bg-[#e65c52] transition-bg)
- **Secondary Button:** border-2 border-[#4A90E2] text-[#4A90E2] py-2 px-4 rounded-full (hover:bg-[#e3f4ff] transition-bg)
- **Chips/Badges:** bg-[#50E3C2] text-white text-xs px-2 py-1 rounded-full
- **Inputs:** border border-gray-300 rounded-lg py-2 px-3 focus:border-[#4A90E2]

**MOTION:**
- **Card Swipe:** Smooth transition for card movement (transition-transform)
- **Button Hover:** Slight scale-up on hover (transform scale-105)

**PER-SCREEN Layout:**
- **/** (Truke - Intercambia y Regala): Full-bleed card stack. Each card shows item image, brief description, and swipe controls (like/pass).
- **/publicar** (Publicar Item): Centered form with input fields and a "Post" button. Use card layout for input sections.
- **/matches** (Mis Matches): List of matched items with thumbnail images and quick access to chat. Use card layout for consistency.
- **/chat/[matchId]** (Chat): Bubble thread layout for conversations. Each bubble uses rounded corners, with different colors for sent (bg-[#FF6F61]) and received messages (bg-[#F5F7FA]).

This design language ensures Truke feels like a lively, user-focused app, distinctively tailored to its purpose of item exchange through engaging interactions.
