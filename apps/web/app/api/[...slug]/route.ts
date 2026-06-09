const API_URL = "http://api:3001";

export async function handler(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join("/");
  const url = `${API_URL}/${path}${req.url.includes("?") ? `?${req.url.split("?")[1]}` : ""}`;

  const response = await fetch(url, {
    method: req.method,
    headers: req.headers,
    body: req.method === "GET" ? undefined : req.body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
