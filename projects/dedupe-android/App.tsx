import { useState, useCallback } from "react"
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert, ScrollView, StyleSheet } from "react-native"
import { StatusBar } from "expo-status-bar"
import * as MediaLibrary from "expo-media-library"
import * as FileSystem from "expo-file-system"
import * as Crypto from "expo-crypto"
import { findDuplicates, totalReclaimable, defaultDeletion, formatBytes, type Asset, type DupGroup } from "./lib/dedup"

const SCAN_CAP = 1000 // assets to scan per run (most-recent first)

export default function App() {
  const [phase, setPhase] = useState<"home" | "scanning" | "results">("home")
  const [progress, setProgress] = useState(0)
  const [groups, setGroups] = useState<DupGroup[]>([])
  const [reclaim, setReclaim] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const scan = useCallback(async () => {
    const perm = await MediaLibrary.requestPermissionsAsync()
    if (!perm.granted) { Alert.alert("Permiso necesario", "Dedupe necesita acceso a tus fotos para encontrar duplicados."); return }
    setPhase("scanning"); setProgress(0)
    const assets: Asset[] = []
    let after: MediaLibrary.AssetRef | undefined
    let scanned = 0
    while (scanned < SCAN_CAP) {
      const page = await MediaLibrary.getAssetsAsync({ first: 100, after, mediaType: ["photo", "video"], sortBy: [MediaLibrary.SortBy.creationTime] })
      for (const a of page.assets) {
        let size = 0, uri = a.uri
        try {
          const info = await MediaLibrary.getAssetInfoAsync(a)
          uri = info.localUri || a.uri
          const fi = await FileSystem.getInfoAsync(uri, { size: true })
          if (fi.exists && typeof fi.size === "number") size = fi.size
        } catch { /* skip unreadable */ }
        assets.push({ id: a.id, uri, filename: a.filename, size, kind: "image" })
        scanned++; setProgress(Math.min(1, scanned / SCAN_CAP))
      }
      if (!page.hasNextPage || !page.endCursor) break
      after = page.endCursor
    }
    // confirm size-collision candidates with a real content hash (cheap: only candidates)
    const bySize = new Map<number, Asset[]>()
    for (const a of assets) { if (!a.size) continue; const k = bySize.get(a.size) || []; k.push(a); bySize.set(a.size, k) }
    for (const [, arr] of bySize) {
      if (arr.length < 2) continue
      for (const a of arr) {
        try {
          const b64 = await FileSystem.readAsStringAsync(a.uri, { encoding: FileSystem.EncodingType.Base64, length: 65536, position: 0 })
          a.hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, String(a.size) + ":" + b64)
        } catch { /* fall back to size+name */ }
      }
    }
    const g = findDuplicates(assets)
    setGroups(g); setReclaim(totalReclaimable(g)); setPhase("results")
  }, [])

  const deleteDuplicates = useCallback(async () => {
    const ids = defaultDeletion(groups)
    if (!ids.length) return
    Alert.alert("Borrar duplicados", `Se borrarán ${ids.length} copias y se liberarán ${formatBytes(reclaim)}. Se conserva una de cada grupo.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: async () => {
        setDeleting(true)
        try { await MediaLibrary.deleteAssetsAsync(ids); Alert.alert("Listo", `Liberaste ${formatBytes(reclaim)}.`); setGroups([]); setReclaim(0); setPhase("home") }
        catch (e) { Alert.alert("Error", "No se pudieron borrar (revisá permisos).") }
        finally { setDeleting(false) }
      } },
    ])
  }, [groups, reclaim])

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <Text style={s.title}>🧹 Dedupe</Text>
      <Text style={s.sub}>Encontrá fotos y archivos duplicados y liberá espacio.</Text>

      {phase === "home" && (
        <View style={s.center}>
          <TouchableOpacity style={s.cta} onPress={scan}><Text style={s.ctaTxt}>Escanear mi teléfono</Text></TouchableOpacity>
          <Text style={s.hint}>Escanea hasta {SCAN_CAP} fotos/videos recientes, agrupa los idénticos y te deja borrar las copias conservando una.</Text>
        </View>
      )}

      {phase === "scanning" && (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#16c2b0" />
          <Text style={s.hint}>Escaneando… {Math.round(progress * 100)}%</Text>
        </View>
      )}

      {phase === "results" && (
        <>
          <View style={s.summary}>
            <Text style={s.bigNum}>{formatBytes(reclaim)}</Text>
            <Text style={s.hint}>recuperables · {groups.length} grupos de duplicados</Text>
          </View>
          {groups.length === 0 ? (
            <View style={s.center}><Text style={s.hint}>🎉 No encontramos duplicados.</Text></View>
          ) : (
            <FlatList
              data={groups}
              keyExtractor={(g) => g.fingerprint}
              contentContainerStyle={{ paddingBottom: 90 }}
              renderItem={({ item }) => (
                <View style={s.group}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {item.assets.map((a, i) => (
                      <View key={a.id} style={s.thumbWrap}>
                        <Image source={{ uri: a.uri }} style={s.thumb} />
                        {i === 0 && <View style={s.keep}><Text style={s.keepTxt}>conservar</Text></View>}
                      </View>
                    ))}
                  </ScrollView>
                  <Text style={s.groupMeta}>{item.assets.length} copias · libera {formatBytes(item.reclaimableBytes)}</Text>
                </View>
              )}
            />
          )}
          {groups.length > 0 && (
            <TouchableOpacity style={[s.cta, s.delete]} onPress={deleteDuplicates} disabled={deleting}>
              <Text style={s.ctaTxt}>{deleting ? "Borrando…" : `Borrar duplicados · liberar ${formatBytes(reclaim)}`}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b1020", paddingTop: 60, paddingHorizontal: 18 },
  title: { color: "#fff", fontSize: 30, fontWeight: "900" },
  sub: { color: "#94a3b8", marginTop: 4, marginBottom: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  cta: { backgroundColor: "#16c2b0", paddingVertical: 16, paddingHorizontal: 22, borderRadius: 14, alignItems: "center" },
  delete: { position: "absolute", left: 18, right: 18, bottom: 24, backgroundColor: "#e0524d" },
  ctaTxt: { color: "#04231f", fontWeight: "800", fontSize: 16 },
  hint: { color: "#94a3b8", textAlign: "center", paddingHorizontal: 20, lineHeight: 20 },
  summary: { backgroundColor: "#11193a", borderRadius: 16, padding: 16, marginBottom: 12 },
  bigNum: { color: "#16c2b0", fontSize: 34, fontWeight: "900" },
  group: { backgroundColor: "#11193a", borderRadius: 14, padding: 10, marginBottom: 10 },
  thumbWrap: { marginRight: 8 },
  thumb: { width: 84, height: 84, borderRadius: 8, backgroundColor: "#1e293b" },
  keep: { position: "absolute", bottom: 4, left: 4, backgroundColor: "#16c2b0", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  keepTxt: { color: "#04231f", fontSize: 10, fontWeight: "800" },
  groupMeta: { color: "#cbd5e1", marginTop: 8, fontWeight: "700" },
})
