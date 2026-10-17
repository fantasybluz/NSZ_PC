/// <reference types="vite/client" />

// vite.config.ts 的 define：建置時從 VERSION、git 帶進來
declare const __APP_VERSION__: string
declare const __BUILD_SHA__: string
declare const __BUILD_DATE__: string
