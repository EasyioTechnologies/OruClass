const API_URL = "http://api:3001";

export async function GET() {
  const response = await fetch(`${API_URL}/health`);
  const data = await response.json();
  return Response.json(data, { status: response.status });
}
