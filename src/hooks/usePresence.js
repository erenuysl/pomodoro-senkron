import { useEffect } from "react";
import { ref, onDisconnect, onValue, serverTimestamp, set } from "firebase/database";
import { rtdb } from "../firebase/config";
import { useAuth } from "./useAuth";

export function usePresence() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const statusRef = ref(rtdb, `status/${user.uid}`);

    // Kullanıcı online olduğunda durum yaz
    const handleOnline = async () => {
      await set(statusRef, {
        state: "online",
        lastChanged: serverTimestamp(),
      });
    };

    handleOnline();

    // Tarayıcı kapanınca offline yaz
    onDisconnect(statusRef).set({
      state: "offline",
      lastChanged: serverTimestamp(),
    });

    return () => {
      set(statusRef, {
        state: "offline",
        lastChanged: serverTimestamp(),
      });
    };
  }, [user]);
}