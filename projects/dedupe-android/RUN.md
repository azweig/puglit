# Dedupe (Android nativo, Expo) — correr y probar

App **nativa** (Expo / React Native) que escanea las fotos/archivos del teléfono,
agrupa los duplicados y te deja borrarlos para liberar espacio. Es nativa porque un
navegador web no puede escanear el almacenamiento de un Android.

## Probar la lógica (sin teléfono)
El núcleo de detección de duplicados es código puro y testeable:
```bash
npm run test     # node scripts/test-dedup.mjs  → 10/10
```

## Correr la app (en tu teléfono o emulador)
```bash
npm install
npx expo start            # abre Metro + QR
```
- **En tu teléfono**: instalá **Expo Go** (Play Store) y escaneá el QR.
- **En emulador**: con un AVD de Android corriendo, apretá `a` (o `npm run android`).
- En la app: tocá **"Escanear mi teléfono"** → da permiso de fotos → ves los grupos de
  duplicados con miniaturas y el espacio recuperable → **"Borrar duplicados"** conserva
  una copia de cada grupo y borra el resto.

> Nota honesta: el escaneo/borrado real requiere un dispositivo/emulador con fotos y
> permiso de Media Library (no se puede ejecutar como una URL web). La lógica de
> deduplicación sí está verificada por test automático.

## Cómo detecta duplicados
`lib/dedup.ts`: agrupa por **hash de contenido** (sha256) cuando hay candidatos del
mismo tamaño, con fallback a tamaño+nombre normalizado (cubre copias renombradas como
`foto (1).jpg`). Conserva una por grupo; calcula los bytes recuperables.
