# Dedupe — Android (Expo)

A **native** Android app (Expo / React Native) that scans the phone's photos/files,
groups duplicates, and lets you delete copies to free space. Native because a web
browser can't scan Android storage.

- `lib/dedup.ts` — pure, tested duplicate-detection (hash + size/name fallback)
- `App.tsx` — scan UI (expo-media-library + expo-file-system + expo-crypto)
- `scripts/test-dedup.mjs` — `npm run test` → 10/10
- **RUN.md** — run on a phone (Expo Go) or emulator

Built by [Puglit](https://puglit.com). All code original.
