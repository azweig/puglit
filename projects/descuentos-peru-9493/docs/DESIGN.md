# Design brief — Descuentos Perú

**Design Brief for Descuentos Perú**

**MOOD:**
The visual identity for Descuentos Perú should be vibrant, energetic, and slightly playful, reflecting the excitement of discovering deals. Drawing inspiration from the dynamic and engaging interfaces of apps like TikTok and the rich, colorful designs of Latin American culture, the app should feel lively and inviting.

**COLOR ROLES:**
- **Background:** bg-[#FFFFFF] for a clean and neutral base.
- **Surface/Cards:** bg-[#FFCCBC] to provide a warm, approachable feel.
- **Primary CTA:** bg-[#FF5722] as the attention-grabbing call-to-action color.
- **Accent:** bg-[#4CAF50] for highlights and interactive elements.
- **Text:** text-[#212121] for strong readability.
- **Muted:** bg-[#FFC107] for secondary information and less prominent elements.

**TYPE:**
Utilize bold, large titles with a weight of 700 for a commanding presence, paired with medium-weight text for body copy. Use a sans-serif typeface to maintain clarity and modernity. Headings should be 24px, body text 16px, and captions 12px.

**COMPONENT RECIPES:**
- **Cards:** `rounded-3xl shadow-lg bg-[#FFCCBC] p-4` to create a soft, elevated feel.
- **Primary Button:** `bg-[#FF5722] text-white py-2 px-4 rounded-full shadow-md hover:bg-[#FF8A65] transition-all duration-300`.
- **Secondary Button:** `bg-[#FFC107] text-[#212121] py-2 px-4 rounded-full hover:bg-[#FFD54F] transition-all duration-300`.
- **Chips/Badges:** `bg-[#4CAF50] text-white text-xs px-2 py-1 rounded-full`.
- **Inputs:** `bg-white border border-[#FFCCBC] rounded-lg py-2 px-3 shadow-sm focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]`.
- **Bottom Tab Bar:** `bg-[#FFFFFF] flex justify-around items-center shadow-inner border-t border-[#FFCCBC] py-2`.

**MOTION:**
Implement subtle transitions for button hover states and card hover effects using `transition-transform duration-300 ease-in-out`. Use `transform scale-105` for interactive elements to create a sense of responsiveness.

**PER-SCREEN LAYOUT:**

- **/app (Descubrir):** Implement a full-bleed photo card stack. Each card should feature an image with a bottom gradient scrim overlay. Title and price should be overlaid in large, bold text. Include large, circular buttons for "Like" and "Pass" at the bottom corners.
  
- **/app/memberships (Mis Programas):** Display a grid of membership cards, each using the card component. Include a small badge for active memberships.

- **/app/location (Ubicación):** Use a map interface with interactive markers. A floating card at the bottom shows nearby offers using the card component.

- **/app/merchants (Merchants):** Present a list with merchant logos on the left and details on the right. Use the secondary button for "View Offers."

- **/app/branches (Branches):** Display branches in a card grid, showing key details like address and contact within each card.

- **/app/offers (Offers):** Use a card layout with vibrant imagery and a brief description. Primary buttons should prompt users to "Redeem" or "Save."
