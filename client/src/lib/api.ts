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

export async function createPost(platform: string, content: string, mediaUrls?: string[], accountId?: string) {
  if (!accountId) {
    try {
      const accountsResult = await fetchZenrioAccounts();
      const accounts = Array.isArray(accountsResult) ? accountsResult : accountsResult?.accounts || accountsResult?.data || [];
      const matching = accounts.find((a: any) => a.platform === platform);
      if (matching) {
        accountId = matching._id || matching.id;
      }
    } catch {
      // proceed without accountId
    }
  }

  return zenrioFetch('posts', {
    method: 'POST',
    body: JSON.stringify({
      content,
      publishNow: true,
      mediaUrls,
      platforms: [{ platform, accountId }],
    }),
  });
}

export async function schedulePost(platform: string, content: string, scheduledAt: string, mediaUrls?: string[], accountId?: string) {
  return zenrioFetch('posts/schedule', {
    method: 'POST',
    body: JSON.stringify({ platform, content, scheduledAt, mediaUrls, accountId }),
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

// ── Post Management ──
export async function listPosts(platform?: string, status?: string, accountId?: string) {
  const params = new URLSearchParams();
  if (platform) params.set('platform', platform);
  if (status) params.set('status', status);
  if (accountId) params.set('accountId', accountId);
  const qs = params.toString();
  return zenrioFetch(`posts${qs ? `?${qs}` : ''}`);
}

export async function getPost(postId: string) {
  return zenrioFetch(`posts/${encodeURIComponent(postId)}`);
}

export async function editPost(postId: string, content: string, overrides: Record<string, unknown> = {}) {
  return zenrioFetch(`posts/${encodeURIComponent(postId)}`, {
    method: 'PUT',
    body: JSON.stringify({ content, ...overrides }),
  });
}

export async function deletePost(postId: string) {
  return zenrioFetch(`posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
  });
}

export async function unpublishPost(postId: string) {
  return zenrioFetch(`posts/${encodeURIComponent(postId)}/unpublish`, {
    method: 'POST',
  });
}

export async function retryPost(postId: string) {
  return zenrioFetch(`posts/${encodeURIComponent(postId)}/retry`, {
    method: 'POST',
  });
}

// ── Comments ──
export async function getPostComments(platform: string, postId: string) {
  return zenrioFetch(`comments?platform=${encodeURIComponent(platform)}&postId=${encodeURIComponent(postId)}`);
}

export async function hideComment(_postId: string, commentId: string) {
  return zenrioFetch(`comments/${encodeURIComponent(commentId)}/hide`, {
    method: 'POST',
  });
}

export async function likeComment(_postId: string, commentId: string) {
  return zenrioFetch(`comments/${encodeURIComponent(commentId)}/like`, {
    method: 'POST',
  });
}

export async function deleteComment(_postId: string, commentId: string) {
  return zenrioFetch(`comments/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
  });
}

// ── Conversations / DMs ──
export async function listConversations(platform?: string) {
  const qs = platform ? `?platform=${encodeURIComponent(platform)}` : '';
  return zenrioFetch(`conversations${qs}`);
}

export async function getConversationMessages(conversationId: string) {
  return zenrioFetch(`conversations/${encodeURIComponent(conversationId)}/messages`);
}

// ── Account ──
export async function getAccountHealth() {
  return zenrioFetch('accounts/health');
}

export async function getAccount(id: string) {
  return zenrioFetch(`accounts/${encodeURIComponent(id)}`);
}

export async function getAccountFollowerStats() {
  return zenrioFetch('accounts/follower-stats');
}

// ── Analytics ──
export async function getPostAnalytics(platform?: string) {
  const qs = platform ? `?platform=${encodeURIComponent(platform)}` : '';
  return zenrioFetch(`analytics/posts${qs}`);
}

export async function getDailyAnalytics(platform?: string) {
  const qs = platform ? `?platform=${encodeURIComponent(platform)}` : '';
  return zenrioFetch(`analytics/daily-metrics${qs}`);
}

export async function getBestPostingTime(platform?: string) {
  const qs = platform ? `?platform=${encodeURIComponent(platform)}` : '';
  return zenrioFetch(`analytics/best-time${qs}`);
}

// ── Media ──
export async function uploadMedia(url: string) {
  return zenrioFetch('media', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

// ── Queue ──
export async function listQueueSlots() {
  return zenrioFetch('queue');
}

export async function createQueueSlot(data: Record<string, unknown>) {
  return zenrioFetch('queue', {
    method: 'POST',
    body: JSON.stringify(data),
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

CRITICAL: When the user asks to "create a post", "make a post", "post something", "schedule a post", or similar, you MUST use the create_post or schedule_post action. Do NOT just list accounts — actually perform the posting action.

For create_post and schedule_post, always extract:
- The platform (linkedin, instagram, twitter, facebook, etc.) from the user's request
- The actual post content the user wants to publish
- The accountId if the user specifies which account to use (e.g., by username)

Respond with a JSON object:
{
  "action": "action_name",
  "platform": "platform_name (e.g., linkedin, instagram, twitter)",
  "content": "The actual post content to publish. Extract the user's message text exactly.",
  "metadata": {
    "accountId": "account_id_if_specified_or_omit",
    "mediaUrls": ["url1", "url2"]
  }
}

If the request doesn't require an action, respond with:
{
  "action": "general_chat",
  "content": "Brief analysis of what the user said"
}

IMPORTANT: You must extract the actual content the user wants to post. For example, if they say "create a post on linkedin saying Hello World", you should set content to "Hello World" and platform to "linkedin". Do NOT set content to the user's entire request.`;

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