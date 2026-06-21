# Poner la app detrás de Cloudflare (capa 1 — DDoS volumétrico real)

Esto es **config de infra (gratis)**, no código. Da la protección DDoS que ningún módulo da solo.
Los módulos `cloudflare` (Turnstile/realIP/purge) + `cache` + el rate-limit del spine son las capas 2-4.

## 1. DNS por Cloudflare (el paso clave)
1. Crear cuenta gratis en cloudflare.com → **Add site** → tu dominio.
2. Cloudflare te da 2 nameservers → cambialos en tu registrar (GoDaddy/Namecheep/etc.).
3. En **DNS**, los records de tu app → **nube naranja ON** (proxied). Eso pone a Cloudflare
   DELANTE: todo el tráfico pasa por su red antes de llegar a tu server → absorbe el DDoS.

## 2. WAF + DDoS (Security)
- **Security → WAF**: activar las **Managed Rules** (gratis).
- **Security → DDoS**: protección L3/L4/L7 automática (siempre ON en proxied).
- Bajo ataque: **Security → Settings → "I'm Under Attack" mode** → challenge a todos.
- **Rate Limiting Rules**: ej. 100 req/min por IP a `/api/*` (capa extra a la del spine).

## 3. Turnstile (captcha — módulo `cloudflare`)
1. **Turnstile → Add site** → te da **Site Key** (frontend) + **Secret Key**.
2. `web/.env.local`: `TURNSTILE_SECRET=...` (+ la site key en el front).
3. El widget en el form manda un token → `POST /api/turnstile/verify` (ya generado) lo valida.

## 4. Cache purge (módulo `cloudflare`)
1. **My Profile → API Tokens → Create** (permiso `Zone.Cache Purge`).
2. `.env.local`: `CLOUDFLARE_API_TOKEN=...` + `CLOUDFLARE_ZONE_ID=...` (está en el Overview del dominio).
3. `purgeCache()` invalida el cache tras un deploy.

## 5. Extras gratis que ya tenés con esto
- **SSL/TLS** automático (Full/Strict).
- **CDN + cache** estático en el borde (HTML/JS/imágenes).
- **R2** (storage S3-compatible sin egress) → encaja con el módulo `storage` (`S3_ENDPOINT` = tu R2).
- **Bot Fight Mode** (Security → Bots) — gratis.

## Orden de capas (defensa real)
```
Internet → [1 Cloudflare edge: WAF+DDoS+cache] → [2 Turnstile] → [3 rate-limit] → [4 cache] → app
```
Sin la capa 1, las 2-4 solas no frenan un DDoS volumétrico. Con la 1, ya estás cubierto.
