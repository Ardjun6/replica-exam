export type WorkspaceReadFile = { path: string };
export type WorkspaceWriteFile = { path: string; data: string | Uint8Array; createDirs?: boolean };
