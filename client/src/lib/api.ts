import { getSettings } from './storage';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const ZENRIO_PROXY = '/api/zenrio'; // Proxied through Express server to avoid CORS

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  stream?: boolean;
}

export async function chatWithOpenRouter(messages: OpenRouterMessage[], systemPrompt?: string) {
  const settings = getSettings();
  if (!settings?.openRouterApiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const allMessages: OpenRouterMessage[] = [];
  if (systemPrompt) {
    allMessages.push({ role: 'system', content: systemPrompt });
  }
  allMessages.push(...messages);

  const model = settings.openRouterModel === 'custom' && settings.customModel
    ? settings.customModel
    : settings.openRouterModel;

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'SocialFlow AI',
    },
    body: JSON.stringify({
      model,
      messages: allMessages,
    } as OpenRouterRequest),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Helper to make Zenrio API calls through the CORS-free proxy
async function zenrioFetch(path: string, options: RequestInit = {}) {
  const settings = getSettings();
  const apiKey = settings?.zenrioApiKey;
  if (!apiKey) {
    throw new Error('Zenrio API key not configured');
  }

  const url = `${ZENRIO_PROXY}/${path.replace(/^\//, '')}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-zenrio-api-key': apiKey,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage: string;
    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.error || errorJson.message || errorBody;
    } catch {
      errorMessage = errorBody || `HTTP ${response.status}`;
    }
    throw new Error(`Zenrio API error (${response.status}): ${errorMessage}`);
  }

  // Handle 204 No Content (e.g., DELETE responses)
  if (response.status === 204) {
    return true;
  }

  return response.json();
}

// Zernio API functions (all proxied through Express to avoid CORS)
export async function fetchZenrioAccounts() {
  return zenrioFetch('accounts');
}

export async function getZernioProfiles() {
  return zenrioFetch('profiles');
}

export async function createZernioProfile(name: string) {
  return zenrioFetch('profiles', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description: 'Auto-created by SocialFlow AI',
    }),
  });
}

// Connect account: gets OAuth URL from Zernio (manages profile automatically)
export async function connectZenrioAccount(platform: string) {
  // Step 1: Get or create a default profile
  const profilesResult = await getZernioProfiles();
  const profiles = profilesResult.profiles || [];
  let profileId: string;

  if (profiles.length > 0) {
    profileId = profiles[0]._id;
  } else {
    const createResult = await createZernioProfile('SocialFlow AI');
    profileId = createResult.profile._id;
  }

  // Step 2: Get OAuth URL for the platform
  return zenrioFetch(`connect/${platform}?profileId=${encodeURIComponent(profileId)}`);
}

export async function disconnectZenrioAccount(accountId: string) {
  return zenrioFetch(`accounts/${accountId}`, {
    method: 'DELETE',
  });
}

export async function createPost(platform: string, content: string, mediaUrls?: string[]) {
  return zenrioFetch('posts', {
    method: 'POST',
    body: JSON.stringify({ platform, content, mediaUrls }),
  });
}

export async function schedulePost(platform: string, content: string, scheduledAt: string, mediaUrls?: string[]) {
  return zenrioFetch('posts/schedule', {
    method: 'POST',
    body: JSON.stringify({ platform, content, scheduledAt, mediaUrls }),
  });
}

export async function publishPost(postId: string) {
  return zenrioFetch(`posts/${postId}/publish`, {
    method: 'POST',
  });
}

export async function getComments(platform: string, postId: string) {
  return zenrioFetch(`comments?platform=${encodeURIComponent(platform)}&postId=${encodeURIComponent(postId)}`);
}

export async function replyToComment(commentId: string, message: string) {
  return zenrioFetch(`comments/${commentId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function replyToDM(conversationId: string, message: string) {
  return zenrioFetch(`messages/${conversationId}`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

// AI Agent system prompt for analyzing user requests
export const AGENT_SYSTEM_PROMPT = `You are SocialFlow AI Agent, an intelligent social media management assistant.
Your role is to analyze user requests and determine what action needs to be taken.

Available actions:
- create_post: Create a new social media post
- schedule_post: Schedule a post for later
- publish_post: Publish a scheduled post
- get_comments: Retrieve comments on a post
- reply_comment: Reply to a comment
- reply_dm: Reply to a direct message
- list_accounts: List connected accounts
- connect_account: Connect a new social media account
- disconnect_account: Disconnect a social media account
- general_chat: General conversation that doesn't require any action

Respond with a JSON object:
{
  "action": "action_name",
  "platform": "platform_name (if applicable)",
  "content": "extracted content or user message",
  "metadata": {}
}

If the request doesn't require an action, respond with:
{
  "action": "general_chat",
  "content": "Brief analysis of what the user said"
}`;

// Response AI system prompt for generating user-friendly responses
export const RESPONSE_SYSTEM_PROMPT = `You are SocialFlow AI, a friendly and professional social media management assistant. 
Your responses should be:
- Natural and conversational
- Informative but concise
- Professional yet approachable
- Helpful and action-oriented

When an action was completed successfully, explain what happened in a clear, friendly way.
When responding to general chat (no action needed), be helpful and engaging.
Always maintain a premium, assistant-like tone similar to ChatGPT.`;