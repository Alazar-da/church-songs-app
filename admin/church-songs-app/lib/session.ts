import { Preferences } from "@capacitor/preferences";
import { Session } from "@supabase/supabase-js";

const SESSION_KEY = "church_songs_session";

export const saveSession = async (session: Session) => {
  await Preferences.set({
    key: SESSION_KEY,
    value: JSON.stringify(session),
  });
};

export const getStoredSession = async () => {
  const { value } = await Preferences.get({
    key: SESSION_KEY,
  });

  return value ? JSON.parse(value) : null;
};

export const clearSession = async () => {
  await Preferences.remove({
    key: SESSION_KEY,
  });
};