# Design brief — Descuentos Perú

**Design Brief for Descuentos Perú Web App**

**MOOD**
The mood should reflect a vibrant, energetic marketplace with a sense of discovery and excitement akin to finding hidden treasures. Think of a bustling Peruvian market combined with the sleek efficiency of a loyalty program dashboard. References: Mercado Libre's warm, welcoming marketplace vibe combined with Tinder's immersive, engaging card interactions.

**COLOR ROLES**
- **Background**: bg-[#581845] - Deep and rich to create a sense of depth and focus.
- **Surface/Cards**: bg-[#DAF7A6] - Light and fresh, providing contrast against the dark background.
- **Primary CTA**: bg-[#FF5733] - Bright and eye-catching to draw immediate attention.
- **Accent**: text-[#900C3F] - Used sparingly for highlights or alerts.
- **Text**: text-[#FFFFFF] - Crisp and clear for maximum readability.
- **Muted**: text-[#FFC300] - Used for secondary information or muted text.

**TYPE**
- Titles: Big, bold, and assertive (e.g., font-bold, text-3xl) to command attention and convey hierarchy.
- Body: Medium weight, slightly smaller (e.g., font-medium, text-base) for readability and comfort.

**COMPONENT RECIPES**
- **Cards**: `rounded-3xl shadow-lg bg-[#DAF7A6] p-6`
- **Primary Button**: `bg-[#FF5733] text-[#FFFFFF] font-bold py-3 px-6 rounded-full shadow-md transition-transform transform hover:scale-105`
- **Secondary Button**: `bg-[#C70039] text-[#FFFFFF] font-medium py-2 px-5 rounded-full shadow-sm`
- **Chips/Badges**: `bg-[#FFC300] text-[#900C3F] font-semibold py-1 px-3 rounded-full`
- **Inputs**: `border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733]`
- **Bottom Tab Bar**: `bg-[#581845] text-[#FFFFFF] flex justify-around py-3 shadow-inner`

**MOTION**
- Subtle transitions: `transition-all duration-300 ease-in-out` for buttons and card hover states. Use `opacity-0` to `opacity-100` for fade-ins on screen transitions.

**PER-SCREEN LAYOUT**
- **/app (Descubrir)**: Full-bleed photo card stack. Each card covers the screen width with a gradient scrim at the bottom. Overlay title and discount percentage in large text on the scrim. Large circular buttons for like/pass at the corners.
- **/app/my-programs (Mis Programas)**: Grid layout of loyalty programs with card recipes. Each card shows program details and an edit button.
- **/app/set-location (Ubicación)**: Map at the top half, input fields below for entering or selecting location. Primary CTA at the bottom.
- **/app/create-offer (Create Offer)**: Form inputs stacked vertically with clear section dividers. Primary CTA at the bottom.
- **/app/create-merchant (Create Merchant)**: Similar to Create Offer, but with additional fields for merchant details.
- **/app/create-program (Create Program)**: Wizard-style stepper with progress indicators, using the accent color for active steps.

Ensure all elements contribute to a cohesive, branded experience that feels uniquely tailored to Peruvian loyalty programs.
