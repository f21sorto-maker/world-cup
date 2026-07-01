import { useEffect, useState } from "react";
import { ensurePlayerDatabase, getPlayerPhotoUrlFromDatabase } from "../data/playerDatabase";

export function usePlayerPhotoUrl(playerName: string): string | undefined {
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    void ensurePlayerDatabase().then(() => {
      if (cancelled) return;
      setPhotoUrl(getPlayerPhotoUrlFromDatabase(playerName));
    });

    return () => {
      cancelled = true;
    };
  }, [playerName]);

  return photoUrl;
}
