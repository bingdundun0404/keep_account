export type VersionInfo = {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
};

export const VERSION_INFO: VersionInfo = {
  version: "1.0.0",
  releaseDate: "2025-11-04",
  releaseNotes: "初始版本：完成PWA、Service Worker、安装按钮与基本离线缓存。",
};