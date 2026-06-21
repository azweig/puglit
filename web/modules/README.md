# Puglit Module Registry — el directorio vivo de componentes

Los agentes LEEN este directorio (vía `lib/module-registry.ts`), entienden qué módulos existen
y los REUSAN en vez de regenerar. Si falta un módulo, el swarm lo CREA acá. Si encuentra un bug,
sube la mejora acá (versionada). Cada módulo es una carpeta:

```
modules/<name>/
  module.json   # { name, category, description, whenToUse, env, deps, gateway, files[] }
  <code files>  # el código a inyectar en la app generada
```

Los módulos BUILTIN (telegram/email/whatsapp/slack/discord/teams/apprise/nango) viven en
lib/connectors.ts + lib/integrations.ts. Los que el swarm crea/mejora viven acá (override por
nombre). El registro une ambos.
