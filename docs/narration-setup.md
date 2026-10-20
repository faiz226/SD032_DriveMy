# Question narration

The browser sends visible question or revealed explanation text to `/api/speech` only after the learner presses Listen. The endpoint verifies the Supabase session, consumes a persistent daily quota, and calls Fish Audio. It never retrieves answers or sends account details to Fish Audio. Simulator narration is excluded from this change.

Required server environment variables:

- `FISH_AUDIO_API_KEY`: existing secret; never prefix it with `VITE_`.
- `FISH_AUDIO_VOICE_ID`: a public or owned voice model selected for English and Bahasa Melayu narration.
- `FISH_AUDIO_MODEL`: optional; defaults to `s2.1-pro-free`. Unknown values are rejected to avoid an implicit paid-model fallback.
- Existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used for session verification and the authenticated quota RPC.

Apply `supabase/migrations/20261020000100_speech_quota.sql` before enabling audio. The service fails closed if the quota function is absent. Each account can request 30 generations per UTC day, including failed provider attempts. Requests are capped at 2,500 characters, 25 seconds of provider waiting, and 5 MB of output. No service-role key is required. Old quota rows can be removed periodically by an administrator under the application's retention policy.

Vite serves the endpoint locally using `.env.local`. On Vercel, add these values to project environment settings; local secrets are not deployed. The API route is excluded from the SPA rewrite, and CSP permits same-origin and blob audio.

The voice ID and database migration must be configured before live playback can be verified. Check pronunciation in both languages with an approved voice. Browser playback can be cancelled; the already-started provider request may still consume quota. No automatic replay or background prefetching occurs.

Source: [Fish Audio text-to-speech API](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech), checked 20 October 2026.

Selected voice (confirmed by the user): 马来女 by zmt, `d86ace6338db45488803f59874909bf4`. Set as `FISH_AUDIO_VOICE_ID` in the local environment. The user confirmed the supplied Malay sample; English narration remains to be auditioned.


## Local verification, 20 October 2026

A direct provider smoke test with the selected voice and `s2.1-pro-free` returned HTTP 200 and MP3 audio for a short Malay/English sample. The key was read only by the server-side test and was not printed. This verifies provider access, not the complete authenticated app path or English pronunciation.

Playback now detaches old media callbacks and ignores late playback failures and cancelled request responses. The full suite passed 148 tests in 17 files with one worker.

The user refreshed the Supabase CLI login, but remote database initialization timed out before the migration could run. The linked project matches the app configuration. No migration or deployment has been performed; narration remains unavailable until the quota migration is applied. Do not run a blanket migration push because unrelated local migrations are present.
