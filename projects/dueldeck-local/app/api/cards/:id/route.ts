// app/api/cards/:id/route.ts

import { getAuthUser } from '@/lib/auth';
const u = await getAuthUser(request);

if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

// SQL
const pool = require('./lib/db');
const { rows } = await pool.query('SELECT * FROM cards WHERE id=$1', [v]);

return NextResponse.json(rows);
