export async function readBackendResponse(res: Response) {
  const text = await res.text();

  if (!text) {
    return { data: null, text: "" };
  }

  try {
    return { data: JSON.parse(text), text };
  } catch {
    return { data: null, text };
  }
}
