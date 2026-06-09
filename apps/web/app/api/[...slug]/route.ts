const API_URL = "http://api:3001";

async function handler(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  try {
    const { slug } = await params;
    const path = slug.join("/");
    const url = new URL(req.url);
    const fullUrl = `${API_URL}/api/${path}${url.search}`;

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = await req.text();
    }

    const response = await fetch(fullUrl, fetchOptions);
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error("API proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
