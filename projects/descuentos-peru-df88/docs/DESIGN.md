# Design brief — Descuentos Perú

**Design Brief for Descuentos Perú**

**MOOD + REFERENCES**
The visual identity of Descuentos Perú should evoke a sense of discovery and excitement akin to finding hidden gems. The mood is vibrant and modern, drawing inspiration from the dynamic energy of urban exploration and the anticipation of unlocking exclusive deals. References include the colorful and engaging interfaces of travel and exploration apps like Airbnb and the discovery-driven design of Foursquare.

**LAYOUT ARCHITECTURE**
- **Navigation:** Implement a sticky top bar with horizontal tabs for primary navigation. This setup facilitates easy switching between different sections of the app and keeps the essential navigation elements within reach.
- **Content Width:** Opt for a full-width content layout to maximize the real estate for showcasing deals and locations, enhancing the sense of immersion.
- **Home Screen Composition:** The home screen (/Descuentos Cercanos) should feature a dynamic, scannable list of nearby discounts. Use a card stack format to allow users to swipe through offers, enhancing engagement and interaction.

**COLOR ROLES**
- **Background:** bg-[#581845]
- **Surface/Cards:** bg-[#FFFFFF]
- **Primary CTA:** bg-[#FF5733]
- **Accent:** bg-[#900C3F]
- **Text:** text-[#FFFFFF]
- **Muted:** bg-[#C70039]
- **Highlight:** border-[#FFC300]

**TYPE**
- **Titles:** Bold and large (font-weight: 700, size: 24px) to make headlines and section titles stand out.
- **Body Text:** Medium weight (font-weight: 400, size: 16px) for readability.
- **Emphasis:** Use the highlight color (#FFC300) for key information or calls to action within text blocks.

**COMPONENT RECIPES**
- **Cards:** `bg-[#FFFFFF] p-4 rounded-lg shadow-md mb-4`
- **Primary Button:** `bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-full hover:bg-[#C70039] transition-colors duration-300`
- **Secondary Button:** `bg-transparent border-2 border-[#FF5733] text-[#FF5733] py-2 px-4 rounded-full hover:bg-[#FF5733] hover:text-[#FFFFFF] transition-colors duration-300`
- **Chips/Badges:** `bg-[#900C3F] text-[#FFFFFF] py-1 px-3 rounded-full text-sm`
- **Inputs:** `bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 mb-4 focus:border-[#FF5733] transition-colors duration-300`

**MOTION**
- Subtle hover effects on buttons and cards using `transition-transform` and `transition-colors`.
- Fade-in effect for card stacks with `opacity` transitions when swiping through offers.

**PER-SCREEN LAYOUT**
- **/Descuentos Cercanos:** Full-width card stack of offers with swipe interaction. Cards display a business name, discount details, and a CTA button.
- **/mis-programas:** Grid layout of loyalty programs. Each program displayed as a chip with program logo and name.
- **/establecer-ubicacion:** Map-centric layout with a search bar and list of recent locations. Use map pins for visual emphasis.
- **/crear-comerciante:** Form layout with step-by-step progression. Use input fields and buttons styled as per component recipes.
- **/crear-sucursal:** Similar to /crear-comerciante, but with location-based inputs (e.g., map integration).
- **/crear-oferta:** Card-based layout for offer creation with fields for offer details, validity, and associated programs.

This design brief outlines a cohesive and tailored visual identity for Descuentos Perú, ensuring a memorable and user-friendly experience.
