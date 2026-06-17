# Design brief — Descuentos Perú

**Design Brief for Descuentos Perú In-App Screens**

**MOOD:**
The mood of Descuentos Perú is dynamic and vibrant, reflecting the bustling energy of Peruvian markets and the excitement of discovering discounts. The design should evoke a sense of exploration and delight, akin to finding hidden treasures in local markets. References include the immersive, swipe-driven discovery experience of Tinder and the warm, trust-building interfaces of OLX and eBay.

**COLOR ROLES:**
- **Background:** bg-[#581845]
- **Surface/Cards:** bg-[#900C3F]
- **Primary CTA:** bg-[#FF5733]
- **Accent:** bg-[#C70039]
- **Text:** text-[#FFFFFF]
- **Muted:** text-opacity-70
- **Highlight:** bg-[#FFC300]

**TYPE:**
- **Titles:** Big, bold, and confident, using a weight of 700. Scale for headings: text-3xl
- **Body:** Clean and legible, with a medium weight of 500. Scale for body text: text-base
- **Labels/Chips:** Small and distinct, weight 600. Scale: text-sm

**COMPONENT RECIPES:**
- **Cards:** class="rounded-3xl shadow-lg bg-[#900C3F] p-6 text-[#FFFFFF]"
- **Primary Button:** class="rounded-full bg-[#FF5733] text-[#FFFFFF] py-3 px-6 font-bold hover:bg-[#C70039] transition-colors duration-300"
- **Secondary Button:** class="rounded-full bg-transparent border-2 border-[#FF5733] text-[#FF5733] py-3 px-6 font-medium hover:bg-[#FF5733] hover:text-[#FFFFFF] transition-colors duration-300"
- **Chips/Badges:** class="rounded-full bg-[#FFC300] text-[#581845] px-3 py-1 font-semibold"
- **Inputs:** class="rounded-lg bg-[#581845] text-[#FFFFFF] py-2 px-4 border border-opacity-50 focus:border-[#FF5733] transition-all duration-300"
- **Bottom Tab Bar:** class="fixed bottom-0 w-full bg-[#900C3F] text-[#FFFFFF] flex justify-around py-3"

**MOTION:**
Use subtle transitions for hover states (e.g., transition-colors, transition-transform, duration-300). Cards should have a slight scale effect on hover (transform scale-105), and buttons should change color smoothly when interacted with.

**PER-SCREEN LAYOUT:**

- **/app (Descubrir):** Full-bleed photo card stack with immersive, large images. Overlay title and price on a gradient scrim at the bottom of each card. Large circular buttons for like/pass on each side of the card.

- **/app/programs (Mis Programas):** Grid layout with cards for each program. Cards should include the program name, points, and a small icon. Use chips to show status (active, expiring).

- **/app/location (Ubicación):** Map view with pins for nearby discounts. Cards at the bottom show details when a pin is selected, with a swipe-up gesture to reveal more.

- **/app/merchants (Merchants):** List view of merchants, each item in a card with a merchant logo, name, and distance. Use accent colors to highlight new or featured merchants.

- **/app/branches (Branches):** Similar to Merchants, but with additional info like opening hours and address. Include a search bar at the top.

- **/app/offers (Offers):** A grid of offer cards, each with an image, description, and quick action buttons (save, share). Use the highlight color to indicate limited-time offers.

Ensure these designs are cohesive, vibrant, and reflective of the Peruvian marketplace experience, inviting users to explore and discover discounts effortlessly.
