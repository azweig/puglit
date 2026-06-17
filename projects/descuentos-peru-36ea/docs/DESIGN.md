# Design brief — Descuentos Perú

**DESIGN BRIEF: Descuentos Perú**

**MOOD:**
The visual identity should evoke a sense of excitement and discovery, akin to finding hidden treasures. Think vibrant and dynamic — similar to the energy of a bustling Peruvian market combined with the sleekness of a modern loyalty app. Reference: The vibrancy of Mercado Libre with the sleek structure of Airbnb's experiences.

**COLOR ROLES:**
- **Background:** bg-[#F5F5F5]
- **Surface/Cards:** bg-[#FFC300]
- **Primary CTA:** bg-[#FF5733]
- **Accent:** bg-[#900C3F]
- **Text:** text-[#333333]
- **Muted:** text-opacity-50

**TYPE:**
Adopt a bold, expressive typography for titles (e.g., 700 weight, 32px) to convey immediacy and importance, paired with a medium weight for body text (e.g., 400 weight, 16px) for readability.

**COMPONENT RECIPES:**
- **Cards:** `rounded-3xl shadow-lg p-4 bg-[#FFC300]`
- **Primary Button:** `bg-[#FF5733] text-white py-3 px-6 rounded-full shadow-md hover:bg-opacity-90 transition`
- **Secondary Button:** `bg-[#C70039] text-white py-2 px-4 rounded-full shadow-sm hover:bg-opacity-90 transition`
- **Chips/Badges:** `bg-[#900C3F] text-white text-xs py-1 px-3 rounded-full`
- **Inputs:** `border border-[#900C3F] rounded-lg px-4 py-2 focus:border-[#FF5733] focus:ring focus:ring-[#FF5733]/50 transition`
- **Bottom Tab Bar:** `fixed bottom-0 w-full flex justify-around bg-[#FFC300] py-3 shadow-inner`

**MOTION:**
Employ subtle CSS transitions for hover states and focus actions, e.g., `transition-all duration-300 ease-in-out`. Use `transform` for small scale or translate effects on interactions for a lively feel.

**PER-SCREEN LAYOUT:**

- **/app (Descubrir):** 
  - Full-bleed photo card stack, `h-screen bg-cover`, with gradient scrim overlay (`bg-gradient-to-t from-[#900C3F] to-transparent`) overlaid with title and subtitle in large, bold text.
  - Large circular buttons for like/pass, `absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-4`.

- **/app/memberships (Mis Programas):**
  - Grid layout of membership cards, `grid grid-cols-2 gap-4 p-4`, with each card styled as per card component.

- **/app/location (Ubicación):**
  - Map view with overlay for list of nearby offers, `flex flex-col`, with map taking `2/3` screen and list `1/3`, cards in list styled as per card component.

- **/app/merchants/create (Create Merchant):**
  - Form layout, `flex flex-col space-y-4 p-6`, using input components for fields.

- **/app/branches/create (Create Branch):**
  - Similar to Create Merchant, with additional map input for branch location, `flex flex-col space-y-4 p-6`.

- **/app/offers/create (Create Offer):**
  - Form layout, `flex flex-col space-y-4 p-6`, with inputs and a preview card at the bottom showing offer details.

Ensure that each screen maintains a balance of vibrancy and usability, keeping user interaction fluid and intuitive.
