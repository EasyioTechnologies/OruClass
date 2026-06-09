const API_URL = "http://api:3001";

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/health`);
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
