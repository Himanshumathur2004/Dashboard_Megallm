# Plan: Real-time Draft Streaming

## Problem
When "Draft" is clicked, the UI shows "..." and nothing appears until ALL drafts are generated. Users want to see each draft as soon as it's created.

## Root Cause
1. **X/Twitter `draft-comments.js`** writes all drafts at once at the end (other platforms already save incrementally via `appendDraftsToFile()`)
2. **Frontend `doDraft()`** waits for the full HTTP response before refreshing — it doesn't poll for new drafts during generation

## Changes

### 1. Fix X/Twitter incremental saving (`tools/x-assistant/draft-comments.js`)
- Add `appendDraftsToFile()` helper (same pattern used by Reddit/Dev.to/HN/Bluesky)
- Call it after each tweet's drafts are generated (inside the for loop), instead of writing all at once at the end
- Return the total count at the end

### 2. Frontend polling during draft generation (`tools/unified-assistant/server.js` — the `doDraft()` JS function)
- After clicking "Draft", start a polling interval (every 3s) that fetches `/api/${platform}/drafts` and re-renders the drafts list
- Stop polling when the POST `/api/${platform}/draft` call completes
- Show a progress indicator ("Generating... X drafts so far") during generation

### 3. Backend: Add a progress endpoint (optional enhancement in `server.js`)
- Add `GET /api/${platform}/draft-progress` that returns current draft count + whether generation is in progress
- Alternatively, just poll the existing `/api/${platform}/drafts` endpoint (simpler, no new endpoint needed)

## Implementation Details

### File 1: `tools/x-assistant/draft-comments.js`
- Add `appendDraftsToFile(newDrafts)` function (copy from reddit-assistant)
- In `draftComments()`, call `appendDraftsToFile(postDrafts)` after each tweet's loop iteration
- Remove the final `writeFile(DRAFTS_FILE, ...)` at the end
- Return total count like other platforms

### File 2: `tools/unified-assistant/server.js` (frontend JS only)
- Modify `doDraft()`:
  - Start a `setInterval` that calls `loadDraftsOnly()` every 3 seconds
  - `loadDraftsOnly()` fetches `/api/${platform}/drafts` and re-renders
  - Update the button to show "Generating... X drafts" with count
  - When the POST completes, clear the interval and do a final load
