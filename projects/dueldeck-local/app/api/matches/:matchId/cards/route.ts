//app/api/matches/:matchId/cards/route.ts

import { getAuthUser } from '@/lib/auth';
const u = await getAuthUser(request);

if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

const matchId = decodeURIComponent(req.params.matchId);
const pool = require('/lib/db');
const { rows } = await pool.query('SELECT cards.* FROM cards WHERE match_id=$1', [matchId]);

return NextResponse.json({ data: rows });
