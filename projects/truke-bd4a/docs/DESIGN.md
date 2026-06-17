# Design brief — Truke

**DESIGN BRIEF FOR TRUKE APP**

**MOOD + REFERENCES:**
Truke should evoke the excitement and serendipity of discovering hidden treasures, akin to a vibrant flea market. The interface should feel playful yet trustworthy, drawing inspiration from Tinder's card-stack immersion and the warm, community-focused aesthetic of OLX. The mood is energetic and inviting, fostering a sense of connection and discovery.

**LAYOUT ARCHITECTURE:**
- **Navigation:** Implement a swipe-focused full-bleed layout, with a floating bottom action bar for primary interactions (like, pass, message). This structure suits the nature of Truke, emphasizing item discovery and interaction.
- **Content Width:** Full-bleed to maximize the visual impact of item images and create an immersive experience.
- **Home Screen Composition:** The home screen (/app - Descubrir) features a large, prominent card stack showcasing item photos. Each card should occupy most of the screen to focus attention on the item details.

**COLOR ROLES:**
- **Background:** bg-[#F7F7F7]
- **Surface/Cards:** bg-white
- **Primary CTA (like, message):** bg-[#FF6F61]
- **Accent (highlight special items or offers):** bg-[#F5A623]
- **Text:** text-[#333333]
- **Muted (secondary text/icons):** text-gray-600

**TYPE:**
- **Titles:** Bold, large (text-2xl font-bold) to draw attention to key information like item names.
- **Body Text:** Medium weight (text-base font-medium) for readability, ensuring details are clear without overwhelming the user.

**COMPONENT RECIPES:**
- **Cards:** `bg-white shadow-lg rounded-lg p-4`
- **Primary Button:** `bg-[#FF6F61] text-white font-bold py-2 px-4 rounded-full`
- **Secondary Button:** `bg-transparent border border-[#4A90E2] text-[#4A90E2] font-medium py-2 px-4 rounded-full`
- **Chips/Badges:** `bg-[#FF9E80] text-white text-sm py-1 px-2 rounded-full`
- **Inputs:** `border border-gray-300 rounded-md py-2 px-3`

**MOTION:**
- **Transitions:** Smooth transitions for card swipes and button presses, using `transition duration-300 ease-in-out`. Subtle scale effect on button hover (`hover:scale-105`).

**PER-SCREEN LAYOUT:**
- **/app (Descubrir):** Full-bleed card stack with swipe interactions. Floating action buttons at the bottom for like and pass.
- **/app/publicar (Publicar):** Simple form layout with inputs for item details. Use a centered column with cards for input groups. Primary button for submission.
- **/app/matches (Matches):** List view with small card previews of matched items. Each entry should include item image and short description, with a secondary button to initiate chat.
- **/app/chat/[matchId] (Chat):** Modern chat bubble thread. Use speech bubble styles with alternating colors for sender and receiver. Keep the interface clean and focused on the conversation.

This design emphasizes a seamless, engaging user experience tailored to Truke's unique product offering, enhancing both the visual and interactive aspects of the app.
