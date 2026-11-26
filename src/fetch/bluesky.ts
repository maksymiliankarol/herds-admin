// Step 1b: read the newest posts of a Bluesky account through the public API (no login needed).
import { z } from "zod";

const POSTS = 3; // how many of the newest posts are read from each account

const Feed = z.object({
  feed: z.array(
    z.object({
      post: z.object({ uri: z.string(), record: z.object({ text: z.string().default("") }) }),
      reason: z.unknown().optional(), // set for reposts and pinned posts
    }),
  ),
});

// `profileUrl` looks like https://bsky.app/profile/<handle>
export async function getBlueskyPosts(profileUrl: string): Promise<{ url: string; page: string }[]> {
  const { hostname, pathname } = new URL(profileUrl);
  const handle = pathname.split("/")[2];
  if (hostname !== "bsky.app" || !pathname.startsWith("/profile/") || !handle) {
    throw new Error(`Not a Bluesky profile URL: ${profileUrl}`);
  }

  const api = new URL("https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed");
  api.search = new URLSearchParams({ actor: handle, filter: "posts_no_replies", limit: "20" }).toString();

  const res = await fetch(api, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Bluesky failed (HTTP ${res.status})`);

  return Feed.parse(await res.json())
    .feed.filter((item) => !item.reason && item.post.record.text) // own, non-empty posts only
    .slice(0, POSTS) // the API returns the newest first
    .map(({ post }) => ({
      url: `https://bsky.app/profile/${handle}/post/${post.uri.split("/").pop()}`,
      page: post.record.text,
    }));
}