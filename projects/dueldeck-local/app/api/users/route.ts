// Define a type for the user data response
interface UserResponse {
  id: number;
  name: string;
  email: string;
}

const getUserData = async (request: NextRequest) => {
  try {
    const u = await getAuthUser(request);
    if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    // Get user data based on the provided ID
    const { id } = request.params;
    const [user] = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user); // Return user data as JSON
  } catch (error: any) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const response = await getUserData(request);
  return response;
}