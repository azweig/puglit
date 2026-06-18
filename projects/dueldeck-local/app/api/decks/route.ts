// app/api/decks/route.ts

import { NextRequest, NextResponse } from 'next/server';

// ... (rest of your imports)

const pool = require('../lib/db');
const getAuthUser = require('../lib/auth');
const config = require('../domain.config');

// ... (other imports)

const { createDeck } = require('../lib/decks'); // Assuming you have a function to create a deck

const router = useRouter(); // Import router from next

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // ... (validation and input handling)
    const newDeck = await createDeck(request.body, user.userId);
    return NextResponse.json({ data: newDeck });
  } catch (error: any) {
    console.error('Error creating deck:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
