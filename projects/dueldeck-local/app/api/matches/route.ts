app/api/matches/route.ts
import { getAuthUser } from '@/lib/auth';
const u = await getAuthUser(request);
if (!u) return NextResponse.json({ error: "Unauthorized" });