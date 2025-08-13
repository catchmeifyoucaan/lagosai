export const generateOpenAIImage = async (prompt: string, apiKey: string): Promise<{ url?: string; b64?: string; }> => {
  const endpoint = 'https://api.openai.com/v1/images/generations';
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      response_format: 'url'
    })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(()=>({ error: { message: resp.statusText }}));
    throw new Error(`OpenAI Image Error: ${resp.status} ${err.error?.message || resp.statusText}`);
  }
  const data = await resp.json();
  const item = data?.data?.[0];
  if (item?.url) return { url: item.url };
  if (item?.b64_json) return { b64: item.b64_json };
  throw new Error('OpenAI image response missing url/b64');
};