# Design brief — DuelDeck

## DESIGN BRIEF: DuelDeck

**DIRECTION:** Fast, trustworthy, and playful. Imagine a Yu-Gi-Oh! card catalog, but with the slickness of online gameplay.  We're aiming for a vibrant yet grounded aesthetic that's both familiar and modern.  Think "vintage RPG" meets "online marketplace." 


**LAYOUT ARCHITECTURE:**

* **Nav + Page Skeleton:**
    * **Fixed Left Sidebar + Top Header (data/dashboard):**  This is the core of DuelDeck. We will use a fixed left sidebar to house essential information like your deck, search filters, and a quick-access menu for common actions. 
    * **Sticky Top Bar + Horizontal Tabs: ** For exploring your decks and browsing cards, we'll utilize a sticky top bar with horizontal tabs that allow easy navigation between sections (e.g., Decks, Marketplace, Shop).

**COLOR TOKENS:**

* **Backgrounds:**  [bg- #7C3AED]
* **Card Surfaces/Text:** [bg- #201410] 	[text- #FFFFFF]
* **Primary CTA Buttons:** [button- #7C3AED] 
* **Accent Color:** [accent- #F56890]
* **Ink (primary text):**  [text- #FFFFFF]
* **Muted Text:** [text- #D4D4D4]
* **Border:** [border- #201410]
 
**TYPE SCALE:**

* **Titles:**  [text-3xl font-extrabold tracking-tight, bold]
* **Section Headers:** [text-lg text-bold] 
* **Body Text:** [text-base text-black/70]
* **Meta (small):** [text-xs text-black/50]

**COMPONENT RECIPES:**

* **Card:** `bg-[#201410] rounded-full shadow-sm` 
* **Primary Button:**  `button bg-[#7C3AED] hover:bg-[#5E302A] text-white` 
* **Secondary/Ghost Button:** `ghost-button bg-[#D4D4D4] hover:bg-[#B9B9B9]` 
* **Chip/Badge:**  `chips bg-accent-tinted-chip shadow-sm` 
* **Input:**  `input bg-[#201410] border-none` 
* **Nav Item (Active+Idle):** `nav-item hover:bg-[#7C3AED]` 

**MOTION:**

* **Transitions:**  `transition-colors/transform duration-200` for smooth transitions between states.


**PER-SCREEN Layout:**

**1. Dashboard/Deck View:**
    * **State:** Loading = Skeleton block (animate-pulse bg-black/5 rounded) with placeholder; Empty - Icon illustration and title; Error - Red-tinted banner; Populated - Detailed card list with a horizontal grid layout. 
    * **Interaction:**  Tap for details; Swipe to move cards between decks (similar to "like" or pass feature in Yu-Gi-Oh!).

**2. Search/Filter View:**
    * **State:** Loading = Skeleton block; Empty - Filter icon, search input placeholder; Error = Dismissible banner; Populated - Dynamic filtering results list with a clean, scannable format. 
    * **Interaction:**  Tap to filter and refine the search results (similar to how card filters work in Yu-Gi-Oh!).

**3. Marketplace/Shop View:**
    * **State:** Loading = Skeleton block; Empty - Image placeholder; Error - Red-tinted banner; Populated - Interactive grid or list of cards with detailed information, similar to the "Deck Builder" feature in Yu-Gi-Oh! 
    * **Interaction:**  Tap to view card details and add it to your deck.

**4. Chat/Multiplayer View:**
    * **State:** Loading = Skeleton block; Empty - Bubble icon; Error = Dismissible banner; Populated - Animated chat bubbles, with a focus on the user interface. 


**NOTES:** 

* The visual language of DuelDeck leans heavily into its Yu-Gi-Oh! inspiration. This means bold colors, dynamic card designs, and a playful use of animation to bring the "battle" aspect to life. 
* The app's core is about exploration and discovery.  We should avoid generic admin/CRUD looks. Instead, focus on visual cues that give users a sense of control and excitement as they explore their deck building options.




