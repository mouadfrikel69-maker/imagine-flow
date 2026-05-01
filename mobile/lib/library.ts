/**
 * Per-user, per-feature local image/caption library.
 *
 * Images are written to the app's persistent FileSystem.documentDirectory
 * under `library/<uid>/<kind>/<id>.<ext>`. Metadata is kept as a single JSON
 * blob in AsyncStorage (`library:<uid>:<kind>`) — small, fast to load.
 *
 * Each user's data is keyed by their Firebase UID, so libraries are private
 * by construction (the device may have been used by multiple accounts).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

export type LibraryKind = "text-to-image" | "image-to-text";

export type ImageItem = {
  id: string;
  prompt: string;
  uri: string;          // file:// URI persisted on the device
  width?: number;
  height?: number;
  createdAt: number;    // epoch ms
};

export type CaptionItem = {
  id: string;
  caption: string;
  uri?: string;         // optional thumbnail of the source image
  createdAt: number;
};

export type LibraryItem = ImageItem | CaptionItem;

function metaKey(uid: string, kind: LibraryKind): string {
  return `library:${uid}:${kind}`;
}

function dirFor(uid: string, kind: LibraryKind): string {
  return `${FileSystem.documentDirectory}library/${uid}/${kind}/`;
}

async function ensureDir(path: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function loadLibrary<T extends LibraryItem>(
  uid: string,
  kind: LibraryKind
): Promise<T[]> {
  const raw = await AsyncStorage.getItem(metaKey(uid, kind));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function saveLibrary<T extends LibraryItem>(
  uid: string,
  kind: LibraryKind,
  items: T[]
): Promise<void> {
  await AsyncStorage.setItem(metaKey(uid, kind), JSON.stringify(items));
}

/** Save a generated image (data URL) to disk, prepend it to the library. */
export async function addGeneratedImage(
  uid: string,
  prompt: string,
  dataUrl: string,
  size?: { width: number; height: number }
): Promise<ImageItem> {
  const id = newId();
  const dir = dirFor(uid, "text-to-image");
  await ensureDir(dir);
  const ext = (dataUrl.match(/^data:image\/(\w+)/)?.[1] ?? "jpg").toLowerCase();
  const uri = `${dir}${id}.${ext}`;
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const item: ImageItem = {
    id,
    prompt,
    uri,
    width: size?.width,
    height: size?.height,
    createdAt: Date.now(),
  };
  const existing = await loadLibrary<ImageItem>(uid, "text-to-image");
  await saveLibrary<ImageItem>(uid, "text-to-image", [item, ...existing]);
  return item;
}

/** Save a caption (text) and optional source thumbnail. */
export async function addCaption(
  uid: string,
  caption: string,
  thumbnailDataUrl?: string
): Promise<CaptionItem> {
  const id = newId();
  let uri: string | undefined;
  if (thumbnailDataUrl) {
    const dir = dirFor(uid, "image-to-text");
    await ensureDir(dir);
    const ext = (
      thumbnailDataUrl.match(/^data:image\/(\w+)/)?.[1] ?? "jpg"
    ).toLowerCase();
    uri = `${dir}${id}.${ext}`;
    const base64 = thumbnailDataUrl.replace(/^data:image\/\w+;base64,/, "");
    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  const item: CaptionItem = { id, caption, uri, createdAt: Date.now() };
  const existing = await loadLibrary<CaptionItem>(uid, "image-to-text");
  await saveLibrary<CaptionItem>(uid, "image-to-text", [item, ...existing]);
  return item;
}

export async function removeItem(
  uid: string,
  kind: LibraryKind,
  id: string
): Promise<void> {
  const items = await loadLibrary<LibraryItem>(uid, kind);
  const target = items.find((x) => x.id === id);
  const next = items.filter((x) => x.id !== id);
  if (target?.uri) {
    try {
      await FileSystem.deleteAsync(target.uri, { idempotent: true });
    } catch {
      /* ignore */
    }
  }
  await saveLibrary(uid, kind, next);
}

export async function libraryStats(uid: string): Promise<{
  textToImage: number;
  imageToText: number;
}> {
  const [t2i, i2t] = await Promise.all([
    loadLibrary<ImageItem>(uid, "text-to-image"),
    loadLibrary<CaptionItem>(uid, "image-to-text"),
  ]);
  return { textToImage: t2i.length, imageToText: i2t.length };
}
