export const perplexityChat = async (apiKey: string, model: string, system: string, user: string): Promise<string> => {
  const resp = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(()=>({ error: { message: resp.statusText }}));
    throw new Error(`Perplexity Chat Error: ${resp.status} ${err.error?.message || resp.statusText}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Perplexity invalid chat content');
  return content;
};

export const perplexityGenerateImage = async (_apiKey: string, _prompt: string): Promise<{ url?: string; b64?: string; }> => {
  throw new Error('Perplexity image generation not implemented in this environment');
};

export const perplexityGenerateVideo = async (_apiKey: string, _prompt: string): Promise<{ url: string; } > => {
  throw new Error('Perplexity video generation not implemented in this environment');
};