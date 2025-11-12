# Camera Timestamp vs HD Preferences – Org Resolution Notes

## Summary
- Camera now resolves the job’s organization before loading preferences. It fetches the job document to read `orgId`, fetches that organization if it differs from the current context, and then loads user preferences keyed to that org.
- Timestamp behavior mirrors HD: default to organization toggle, override with the member’s preference if present.

## Comparison with HD Flow
- Both flows use the same three data sources: `jobchat` for `orgId`, `organizations` for org-level toggles, and `userPreferences` for per-member overrides.
- HD maps the result to capture resolution (`hd` vs `standard`), while timestamps map to the watermark toggle.
- The camera previously trusted `currentOrganization`; resolving the job’s org fixes mismatches when the user is working inside another org’s job.

## Observations / Risks
- The camera duplicates logic that ideally belongs in `OrganizationContext`: it performs its own “job → org” lookup and short-term caching.
- Each camera launch issues up to two extra Appwrite reads (job + org) before capture. User preferences are reloaded as well, so total reads can be three per session.
- Reads are cheap at current scale, but repeated round-trips can add latency if the user hops into the camera frequently.

## Optimization Ideas
- Centralize job→organization resolution in `OrganizationContext` (or pass it via navigation) so other screens reuse the result.
- Cache org toggles per job in memory to avoid re-fetching on every entry.
- If latency or cost becomes an issue, denormalize the key org flags (hd/timestamp) onto the job document so the camera only needs one read, with periodic validation against the org record.

