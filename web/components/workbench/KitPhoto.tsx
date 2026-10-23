'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';

/**
 * One part's photo slot.
 *
 * A photo committed to the site (public/workbench/kit/) always shows. Without
 * one, "Add photo" keeps a picture in this browser only, in IndexedDB, shrunk to
 * at most 1200 px: enough to look at, not enough to fill the disk. Nobody else
 * sees it, and it is not part of the site until it is sent and committed.
 */

const DB = 'sfs-kit';
const STORE = 'photos';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = run(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode'))), 'image/jpeg', 0.85));
}

export function KitPhoto({ id, name, photo }: { id: string; name: string; photo?: string }) {
  const [local, setLocal] = useState<string | null>(null);
  const [problem, setProblem] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (photo) return;
    let url: string | null = null;
    withStore<Blob | undefined>('readonly', (store) => store.get(id))
      .then((blob) => {
        if (blob) setLocal((url = URL.createObjectURL(blob)));
      })
      .catch(() => {});
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, photo]);

  async function add(file: File | undefined) {
    if (!file) return;
    try {
      const blob = await shrink(file);
      await withStore('readwrite', (store) => store.put(blob, id));
      setLocal(URL.createObjectURL(blob));
      setProblem(false);
    } catch {
      setProblem(true);
    }
  }

  async function remove() {
    await withStore('readwrite', (store) => store.delete(id)).catch(() => {});
    setLocal(null);
  }

  if (photo) {
    return (
      <figure className="kit-photo" data-kind="site">
        <img src={`/workbench/kit/${photo}`} alt={`Our ${name}`} loading="lazy" />
        <figcaption>Your photo</figcaption>
      </figure>
    );
  }

  return (
    <figure className="kit-photo" data-kind={local ? 'local' : 'empty'}>
      {local ? (
        <img src={local} alt={`Our ${name}, this browser only`} />
      ) : (
        <button type="button" className="kit-add" onClick={() => input.current?.click()}>
          <Icon name="camera" size={20} />
          Add photo
        </button>
      )}
      <figcaption>
        {local ? (
          <>
            This browser only
            <button type="button" onClick={remove}>
              Remove
            </button>
          </>
        ) : problem ? (
          'That file could not be read as a photo.'
        ) : (
          'No photo yet'
        )}
      </figcaption>
      <input ref={input} type="file" accept="image/*" hidden onChange={(event) => add(event.target.files?.[0])} />
    </figure>
  );
}
