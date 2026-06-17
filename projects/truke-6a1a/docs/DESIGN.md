# Design brief — Truke

**DESIGN BRIEF FOR TRUKE**

**MOOD**
The Truke app should evoke a sense of playful exploration, warmth, and trust, akin to a friendly swap meet or community exchange. Visual inspiration is drawn from Tinder's card-swiping engagement and the inviting, approachable design of platforms like OLX or eBay. The experience should feel personal, interactive, and community-driven.

**COLOR ROLES**
- **Background**: #F4F4F4 (bg-[#F4F4F4]) — A clean canvas that ensures content stands out.
- **Surface/Cards**: #FFFFFF (bg-white) — Pure white for card surfaces to maintain clarity and focus.
- **Primary CTA**: #FF6F61 (bg-[#FF6F61]) — Vibrant and inviting, this color draws immediate attention to key actions.
- **Accent**: #F5A623 (bg-[#F5A623]) — Used sparingly for highlights or small interactive elements.
- **Text**: #333333 (text-[#333333]) — Dark and readable, ensuring all information is accessible.
- **Muted**: #7BAAF7 (text-[#7BAAF7]) — For secondary information that should not overpower primary content.

**TYPE**
- **Headlines**: Big, bold, and engaging (font-bold, text-2xl) to capture attention.
- **Body Text**: Comfortable and easy to read (font-medium, text-base).
- **Subtext/Details**: Smaller, lighter weight (font-light, text-sm) for less crucial information.

**COMPONENT RECIPES**
- **Cards**: `rounded-3xl shadow-lg p-4` — Emphasize a tactile, inviting feel.
- **Primary Button**: `bg-[#FF6F61] text-white rounded-full px-6 py-3 shadow-md hover:bg-[#FF9E80] transition-colors duration-200`
- **Secondary Button**: `bg-[#4A90E2] text-white rounded-full px-4 py-2 shadow hover:bg-[#7BAAF7] transition-colors duration-200`
- **Chips/Badges**: `bg-[#F5A623] text-white rounded-full px-3 py-1 text-sm`
- **Inputs**: `border border-[#CCCCCC] rounded-lg px-4 py-2 focus:border-[#4A90E2] transition-all duration-200`
- **Bottom Tab Bar**: `bg-white shadow-md fixed bottom-0 w-full flex justify-around py-3`

**MOTION**
- **Transitions**: Use subtle transitions (`transition-all duration-200`) for hover states and card swipes to enhance the tactile experience without overwhelming the user.

**PER-SCREEN LAYOUT**

- **/app (Descubrir)**
  - **Layout**: Full-bleed photo card stack.
  - **Components**: Cards with title/price overlaid on a gradient scrim, large circular like/pass buttons at the bottom.
  - **Interactions**: Swipe left/right for interactions.

- **/app/publicar (Publicar)**
  - **Layout**: Step-by-step item listing form.
  - **Components**: Large input fields, photo upload section, primary button for submission.
  - **Interactions**: Simple transition between form fields.

- **/app/matches (Matches)**
  - **Layout**: Grid of matched items.
  - **Components**: Cards with item thumbnail, brief description, and action buttons.
  - **Interactions**: Tap to view more details or start a chat.

- **/app/matches/[matchId] (Chat)**
  - **Layout**: Modern bubble thread.
  - **Components**: Speech bubbles with alternating colors, input field fixed at the bottom.
  - **Interactions**: Smooth scroll through messages, subtle focus animation on message input.

This design language ensures Truke is engaging, intuitive, and distinctly its own, perfectly blending marketplace functionality with the thrill of discovery.
