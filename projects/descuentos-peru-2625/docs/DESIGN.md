# Design brief — Descuentos Perú

**Design Brief for Descuentos Perú Webapp**

**MOOD:**  
The visual identity for Descuentos Perú should reflect a vibrant and energetic marketplace, infused with the essence of bustling Peruvian streets. The user experience should feel dynamic and rewarding, akin to discovering hidden treasures in local markets. Reference the boldness of Latin American street art and the warmth of community markets.

**COLOR ROLES:**  
- **Background:** `bg-[#581845]` - Deep and rich to provide a sense of depth and sophistication.
- **Surface/Cards:** `bg-[#FFFFFF]` - Clean and clear to enhance readability and focus on content.
- **Primary CTA:** `bg-[#FF5733]` - Bright and inviting, encouraging user interaction.
- **Accent:** `bg-[#900C3F]` - Used sparingly to highlight important elements and navigation.
- **Text:** `text-[#FFFFFF]` - Crisp and easy to read against darker backgrounds.
- **Muted:** `text-[#C70039]` - For secondary information and details, slightly subdued yet noticeable.

**TYPE:**  
Adopt a bold typeface for titles to create a strong visual hierarchy, ensuring key information is immediately accessible. Use medium weight for subtitles and regular for body text to maintain readability.

**COMPONENT RECIPES:**  
- **Cards:** `rounded-3xl shadow-lg` - Rounded corners for a friendly feel, with shadow to create separation from the background.
- **Primary Button:** `px-4 py-2 rounded-full bg-[#FF5733] text-[#FFFFFF]` - Prominent and inviting.
- **Secondary Button:** `px-4 py-2 rounded-full bg-[#C70039] text-[#FFFFFF]` - For less critical actions.
- **Chips/Badges:** `px-2 py-1 rounded-full bg-[#900C3F] text-[#FFFFFF]` - For highlighting categories or statuses.
- **Inputs:** `border-2 border-[#900C3F] rounded-lg px-3 py-2` - Clear and accessible, with a focus on usability.
- **Bottom Tab Bar:** `flex justify-around bg-[#581845] text-[#FFFFFF]` - Consistent navigation with clear icons and labels.

**MOTION:**  
Implement subtle transitions such as `transition-all duration-200 ease-in-out` to smoothen hover states and card interactions, enhancing the tactile feel of the app.

**PER-SCREEN LAYOUT:**

- **/app (Descubrir):**  
  Immersive full-bleed photo card stack with gradient scrim overlays. Large titles and prices overlaid, with circular like/pass buttons. Encourage exploration with a swipe-style interaction.

- **/app/memberships (Mis Programas):**  
  Grid layout featuring cards for each membership. Use `rounded-3xl` and `shadow-lg` for each card, with logos prominently displayed.

- **/app/location (Ubicación):**  
  Map-centric view with location pins. Use `bg-[#C70039]` for active pins, with an overlay card detailing discounts nearby.

- **/app/merchants (Merchants):**  
  List view with `shadow-md` cards. Merchants' logos and brief descriptions should be emphasized.

- **/app/branches (Branches):**  
  Similar to Merchants, but with a focus on branch-specific information. Highlight branch-specific offers using `bg-[#900C3F]` badges.

- **/app/offers (Offers):**  
  Grid view with offers presented as cards. Use `rounded-3xl` and `shadow-lg`, with clear call-to-action buttons for each offer.

This design approach ensures that Descuentos Perú stands out as both a functional and visually appealing app, aligned with its mission of revealing discounts and offers in a vibrant and engaging manner.
