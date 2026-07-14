import Supermemory from "supermemory";
import { getSettings } from "./storage";

let client: Supermemory | null = null;

function getClient(): Supermemory | null {
  const settings = getSettings();
  if (!settings?.supermemoryApiKey) return null;
  if (!client) {
    client = new Supermemory({ apiKey: settings.supermemoryApiKey });
  }
  return client;
}

export async function retrieveMemoryContext(
  conversationId: string,
  query: string,
): Promise<string> {
  const c = getClient();
  if (!c) return "";

  try {
    const profile = await c.profile({
      containerTag: conversationId,
      q: query,
    });

    const staticProfile = (profile.profile.static || []).join("\n");
    const dynamicProfile = (profile.profile.dynamic || []).join("\n");
    const memories = (profile.searchResults?.results || [])
      .map((r: any) => r.memory)
      .filter(Boolean)
      .join("\n");

    return [staticProfile, dynamicProfile, memories]
      .filter(Boolean)
      .join("\n\n");
  } catch (error) {
    console.warn("Supermemory retrieve failed (non-critical)");
    return "";
  }
}

export async function storeMemory(
  conversationId: string,
  userMessage: string,
  aiResponse: string,
  action?: string,
): Promise<void> {
  const c = getClient();
  if (!c) return;

  try {
    await c.add({
      content: `User: ${userMessage}\nAssistant: ${aiResponse}`,
      containerTags: [conversationId],
      metadata: {
        ...(action ? { action } : {}),
        timestamp: Date.now().toString(),
      },
    });
  } catch (error) {
    console.warn('Supermemory store failed (non-critical)');
  }
}
