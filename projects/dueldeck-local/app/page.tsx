"use client";
// This is the homepage of DuelDeck

import { useState } from 'react';

const [deckList, setDeckList] = useState([]);

const fetchDeckList = async () => {
  try {
    const response = await fetch('/api/decks');
    if (!response.ok) {
      throw new Error('Failed to fetch deck list');
    }
    const data = await response.json();
    setDeckList(data);
  } catch (error: any) {
    console.error('Error fetching deck list:', error);
  }
};

useEffect(() => {
  fetchDeckList();
}, []);

const DeckItem = ({ card }) => {
  return <div className='card-container'>
      <img src={card.image} alt={card.name} className='card-image' />
      <h2>{card.name}</h2>
      {/* Add more details here */} 
    </div>
};

const App = () => {
  return (
    <div className='container'>
      <header className='header'>
        <h1>DuelDeck</h1>
      </header>
      <main>
        <section className='deck-list'>
          {deckList.map((card) => ( <DeckItem key={card.id} card={card} />))}
        </section>
      </main>
    </div>
  );
};

export default App;
