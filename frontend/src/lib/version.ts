// 版號（建置時從 VERSION 來，見 vite.config.ts）和「有沒有看過這一版」
export const APP_VERSION = __APP_VERSION__;
export const BUILD_SHA = __BUILD_SHA__;
export const BUILD_DATE = __BUILD_DATE__;

const SEEN_KEY = 'nszpc-admin-seen-version';
const listeners = new Set<() => void>();

const readSeen = (): string | null => {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
};

const writeSeen = (version: string) => {
  try {
    localStorage.setItem(SEEN_KEY, version);
  } catch {
    // 存不了就每次都當作看過
  }
};

// 第一次來的人不用看 NEW，直接記下目前的版號
let seen = readSeen();
if (seen === null) {
  seen = APP_VERSION;
  writeSeen(APP_VERSION);
}

/** 給 useSyncExternalStore 用：上次看過的版號跟現在不一樣就顯示 NEW */
export const versionSeen = {
  hasUnseen: () => seen !== APP_VERSION,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  markSeen() {
    if (seen === APP_VERSION) return;
    seen = APP_VERSION;
    writeSeen(APP_VERSION);
    listeners.forEach((listener) => listener());
  },
};
