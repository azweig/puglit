// app/api/matches/:id/route.ts

import { getAuthUser } from '@/lib/auth';
const u = await getAuthUser(request);

if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

// SQL queries
const pool = require('/lib/db');
const { rows } = await pool.query('SELECT * FROM matches WHERE id=$1', [matchId]);

return NextResponse.json(rows);
