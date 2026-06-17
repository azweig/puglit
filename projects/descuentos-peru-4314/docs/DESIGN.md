# Design brief — Descuentos Perú

**MOOD + References:**
The visual identity for Descuentos Perú should feel vibrant, dynamic, and welcoming, reflecting the excitement of discovering discounts and offers. The mood should resonate with the bustling energy of Peruvian markets and the vibrancy of local culture. References include the colorful and engaging interfaces of apps like Hopper (for its playful yet functional UI) and Airbnb (for its clean, intuitive navigation mixed with vibrant imagery).

**LAYOUT ARCHITECTURE:**
- **Navigation:** Employ a fixed top bar with horizontal tabs for primary navigation, ensuring quick access to key features such as Descubrir, Mis Programas, Ubicación, Merchants, Branches, and Offers. This is paired with a sticky bottom navigation for quick access to frequently used features (e.g., home, search, profile).
- **Content Width:** Utilize a full-width layout to maximize space for displaying content like maps and lists of offers.
- **Home Screen Composition:** The home screen (Descubrir) should present a vibrant hero image or carousel of top offers, followed by a dynamic grid of personalized offers based on user memberships and location.

**COLOR ROLES:**
- **Background:** bg-[#F5F5F5]
- **Surface/Cards:** bg-[#FFC300]
- **Primary CTA:** bg-[#FF5733]
- **Accent:** text-[#900C3F]
- **Text:** text-[#333333]
- **Muted:** text-[#DAF7A6] for success messages, text-[#FF5733] for warnings.

**TYPE:**
- **Titles:** Use big, bold titles with a weight of 700, scaling up to 32px for primary headers.
- **Body Text:** Maintain readability with a medium weight (500) at 16px.
- **Accent Text:** Use italics or underline for emphasis on offers or important details.

**COMPONENT RECIPES:**
- **Cards:** `rounded-lg shadow-md bg-[#FFC300] p-4 mb-4`
- **Primary Button:** `bg-[#FF5733] text-white py-2 px-4 rounded-md hover:bg-[#C70039]`
- **Secondary Button:** `bg-transparent border border-[#C70039] text-[#C70039] py-2 px-4 rounded-md hover:bg-[#900C3F] hover:text-white`
- **Chips/Badges:** `bg-[#FF5733] text-white text-sm py-1 px-2 rounded-full`
- **Inputs:** `border border-[#C70039] rounded-md p-2 focus:outline-none focus:border-[#FF5733]`

**MOTION:**
- **Transitions:** Use subtle transitions for hover effects on buttons and cards, e.g., `transition duration-200 ease-in-out`.
- **Page Transitions:** Apply a fade-in effect for page loads, `transition-opacity duration-300`.

**PER-SCREEN LAYOUT:**
- **/app (Descubrir):** Hero carousel at the top, followed by a grid of offers with filter options.
- **/app/memberships (Mis Programas):** List view of memberships with icons and brief descriptions.
- **/app/location (Ubicación):** Interactive map with pins for nearby offers, sidebar for filter options.
- **/app/merchants (Merchants):** Grid view of merchants with logos and discount percentages.
- **/app/branches (Branches):** List of branches with distance indicators.
- **/app/offers (Offers):** Detailed list view of offers, prioritized by user preference and location.
