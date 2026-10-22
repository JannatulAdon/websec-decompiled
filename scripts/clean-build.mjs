import { rm } from 'node:fs/promises'
// VitePress runs parallel bundles. Clean once here rather than racing emptyOutDir
// from both bundlers on the workspace's NTFS filesystem.
await rm(new URL('../.vitepress/dist/',import.meta.url),{recursive:true,force:true,maxRetries:8,retryDelay:150})
