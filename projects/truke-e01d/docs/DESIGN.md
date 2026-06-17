# Design brief — Truke

### Design Brief for Truke

#### MOOD
Truke should evoke a sense of excitement and discovery akin to finding hidden treasures. The visual identity should be playful yet trustworthy, merging the dynamic swipe interaction of Tinder with the warm, community-driven vibe of platforms like OLX or eBay. References include Tinder's card-stack immersion and Depop's vibrant and engaging marketplace aesthetics.

#### COLOR ROLES
- **Background**: `bg-[#F5F5F5]` - Light and neutral to keep the focus on items.
- **Surface/Cards**: `bg-white` - Clean and clear, ensuring items stand out.
- **Primary CTA**: `bg-[#FF5733]` - Energetic and inviting, guiding user actions.
- **Accent**: `bg-[#900C3F]` - Used sparingly for highlights or alerts.
- **Text**: `text-[#333333]` - Strong and legible, ensuring readability.
- **Muted**: `text-gray-500` - For secondary information, non-intrusive.

#### TYPE
- **Titles**: Big, bold, and engaging. Use `font-bold text-2xl` for standout headlines.
- **Body**: `font-medium text-base` for clear, consistent communication.
- **Labels/Chips**: `font-semibold text-sm` for concise, at-a-glance info.

#### COMPONENT RECIPES
- **Cards**: `rounded-3xl shadow-lg overflow-hidden` - Create a tactile feel with soft edges and depth.
- **Primary Button**: `bg-[#FF5733] text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-[#e04c30] transition-colors`
- **Secondary Button**: `bg-transparent border-2 border-[#C70039] text-[#C70039] font-bold py-2 px-4 rounded-full hover:bg-[#C70039] hover:text-white transition-colors`
- **Chips/Badges**: `bg-[#900C3F] text-white py-1 px-2 rounded-full text-sm shadow-sm`
- **Inputs**: `border border-gray-300 rounded-lg py-2 px-3 text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF5733]`
- **Bottom Tab Bar**: `bg-white border-t border-gray-200 fixed bottom-0 w-full flex justify-around py-2`

#### MOTION
- **Card Swipes**: `transition-transform duration-300 ease-in-out` - For smooth, responsive dragging.
- **Button Hover**: `transition-colors duration-150` - Subtle color shifts to indicate interactivity.
- **Tab Selection**: `transition-all duration-200` - Smooth indicator movement for active tab.

#### PER-SCREEN LAYOUT

- **/app (Descubrir)**
  - Full-bleed photo card stack with `bg-gradient-to-t from-[#FF5733] to-transparent` overlay.
  - Large circular like/pass buttons `fixed bottom-16 left-1/4 right-1/4 flex justify-between`.

- **/app/publicar (Publicar Item)**
  - Centered form with `max-w-md mx-auto mt-8 space-y-4`.
  - Utilize inputs and primary button styles for consistency.

- **/app/matches (Mis Matches)**
  - Grid of item cards `grid grid-cols-2 gap-4 p-4`.
  - Highlight matched items with a `border-[#FF5733]`.

- **/app/chat/[matchId] (Chat)**
  - Modern bubble thread `space-y-2 p-4`.
  - Alternate bubble colors for sender/receiver `bg-[#FF5733] text-white` and `bg-gray-200 text-[#333333]`.

This design framework ensures Truke is visually distinctive, engaging, and intuitive, enhancing the user experience of discovering and exchanging used items.
