# GitHub Vault Integration - Implementation Guide

## Overview

This document describes the GitHub vault integration feature that adds "Local or GitHub" options to both the "Create new vault" and "Open vault" flows in ReplicaMD.

## User Flow

### Create New Vault Flow
1. User clicks "Create new vault..." on welcome screen
2. **Modal 1**: Choose between "Local" or "GitHub"
   - **Local**: Shows folder dialog (existing behavior)
   - **GitHub**: Proceed to GitHub setup modal
3. **Modal 2** (GitHub): 
   - Step 1: Authenticate with personal access token
   - Step 2: Create new repository
   - Result: Vault is created with GitHub repo initialized

### Open Vault Flow
1. User clicks "Open vault..." on welcome screen
2. **Modal 1**: Choose between "Local" or "GitHub"
   - **Local**: Shows folder dialog (existing behavior)
   - **GitHub**: Proceed to GitHub setup modal
3. **Modal 2** (GitHub):
   - Step 1: Authenticate with personal access token
   - Step 2: Select repository from user's GitHub account
   - Result: Repository is cloned and opened as vault

## Components Created

### 1. `VaultSourceChooser.tsx` and `.css`
**Purpose**: First modal allowing user to choose between Local or GitHub

**Props**:
- `open: boolean` - Whether modal is visible
- `action: 'open' | 'create'` - Whether this is for opening or creating
- `onClose: () => void` - Called when user cancels
- `onSelectLocal: () => void` - Called when user selects Local
- `onSelectGitHub: () => void` - Called when user selects GitHub

**Features**:
- Clean two-button interface
- Responsive design
- Portal-based modal

### 2. `GitHubVaultSetup.tsx` and `.css`
**Purpose**: GitHub authentication and repository selection/creation

**Props**:
- `open: boolean` - Whether modal is visible
- `action: 'open' | 'create'` - Open existing repo or create new
- `onClose: () => void` - Called when user cancels
- `onRepositorySelected: (repo) => void` - User selected existing repo
- `onRepositoryCreated: (repo) => void` - User created new repo

**Steps**:
1. **Auth Step**: User enters GitHub personal access token
2. **Select Step** (for opening): List user's repositories with search
3. **Create Step** (for creating): Form to set repo name and privacy level

**Features**:
- GitHub API integration for auth and repo management
- Repository search/filtering
- Privacy toggle for new repos
- Error handling and loading states

## Modified Files

### 1. `src/renderer/components/VaultChooser.tsx`
- Added state for managing both modals
- Added handlers for local/GitHub routing
- Integrated VaultSourceChooser and GitHubVaultSetup modals
- Maintains existing local vault flow

### 2. `src/renderer/app/actions.ts`
New functions:
- `openVaultLocal()` - Open local vault (folder dialog)
- `createVaultLocal()` - Create local vault (folder dialog)
- `openVaultGitHub(owner, repo)` - Clone GitHub repo as vault
- `createVaultGitHub(owner, repo)` - Create and initialize GitHub vault

### 3. `src/shared/ipc-contract.ts`
New IPC channels:
- `vault:openLocal` - Open local vault
- `vault:createLocal` - Create local vault
- `vault:openGitHub` - Open GitHub vault
- `vault:createGitHub` - Create GitHub vault

New API methods in `ReplicaApi`:
```typescript
openVaultLocal(): Promise<VaultInfo | null>;
createVaultLocal(): Promise<VaultInfo | null>;
openVaultGitHub(owner: string, repo: string): Promise<VaultInfo | null>;
createVaultGitHub(owner: string, repo: string): Promise<VaultInfo | null>;
```

### 4. `src/main/ipc/register-ipc.ts`
New IPC handlers:
- `IPC.vaultOpenLocal` - Shows folder dialog and opens vault
- `IPC.vaultCreateLocal` - Shows folder dialog and creates vault
- `IPC.vaultOpenGitHub` - **Placeholder** for cloning GitHub repo
- `IPC.vaultCreateGitHub` - **Placeholder** for creating GitHub repo

### 5. `src/preload/preload.ts`
Added new methods to preload API:
```typescript
openVaultLocal: () => invoke(IPC.vaultOpenLocal),
createVaultLocal: () => invoke(IPC.vaultCreateLocal),
openVaultGitHub: (owner, repo) => invoke(IPC.vaultOpenGitHub, owner, repo),
createVaultGitHub: (owner, repo) => invoke(IPC.vaultCreateGitHub, owner, repo),
```

## Next Steps - Implementation Needed

### 1. Implement Git Clone Logic
File: `src/main/ipc/register-ipc.ts`

```typescript
handle<VaultInfo | null>(IPC.vaultOpenGitHub, async (_e, owner: unknown, repo: unknown) => {
  const ownerStr = asNonEmptyString(owner, 'owner');
  const repoStr = asNonEmptyString(repo, 'repo');
  
  // TODO: Implement:
  // 1. Select temp folder or let user choose
  // 2. Run: git clone https://github.com/{owner}/{repo}
  // 3. Call vault.open() on cloned folder
  // 4. Return VaultInfo
});
```

**Dependencies needed**:
- `simple-git` npm package (or use `child_process` to shell out to git)

### 2. Implement Git Initialization for New Repos
File: `src/main/ipc/register-ipc.ts`

```typescript
handle<VaultInfo | null>(IPC.vaultCreateGitHub, async (_e, owner: unknown, repo: unknown) => {
  const ownerStr = asNonEmptyString(owner, 'owner');
  const repoStr = asNonEmptyString(repo, 'repo');
  
  // TODO: Implement:
  // 1. Let user choose local folder
  // 2. Initialize git: git init
  // 3. Create Welcome.md
  // 4. Initial commit
  // 5. Add remote: git remote add origin https://github.com/{owner}/{repo}
  // 6. Push to GitHub
  // 7. Call vault.createNew() and return VaultInfo
});
```

### 3. Secure Token Storage
Currently tokens are stored in `sessionStorage`. For production:

```typescript
// Instead of sessionStorage, use:
// - Electron's safeStorage for encryption
// - Or better: OAuth flow instead of personal tokens
```

### 4. Add Error Handling
- Network errors when fetching from GitHub API
- Git command failures
- Invalid tokens
- Repository already exists
- Insufficient permissions

### 5. Add Loading States
- Show progress during clone/create
- Disable buttons during operations
- Show informative error messages

## File Structure
```
src/renderer/components/
  VaultChooser.tsx          (modified)
  VaultSourceChooser.tsx    (created)
  VaultSourceChooser.css    (created)
  GitHubVaultSetup.tsx      (created)
  GitHubVaultSetup.css      (created)

src/renderer/app/
  actions.ts                (modified - added new functions)

src/shared/
  ipc-contract.ts           (modified - added IPC channels and API methods)

src/main/ipc/
  register-ipc.ts           (modified - added handlers)

src/preload/
  preload.ts                (modified - added API methods)
```

## Testing Checklist

- [ ] UI: Source chooser modal appears correctly
- [ ] UI: GitHub setup modal appears when GitHub selected
- [ ] UI: All form validations work
- [ ] Local: Local vault creation still works
- [ ] Local: Local vault opening still works
- [ ] GitHub: Can authenticate with valid token
- [ ] GitHub: Repository list fetches and displays correctly
- [ ] GitHub: Repository search/filter works
- [ ] GitHub: Can create new GitHub repo
- [ ] GitHub: Can clone existing GitHub repo
- [ ] Git: Cloned vaults open correctly
- [ ] Git: Created vaults initialize with git remote
- [ ] Error: Invalid token shows error
- [ ] Error: Network errors handled gracefully
- [ ] Security: Token is not logged or exposed

## Security Considerations

1. **Token Storage**: Tokens are currently stored in sessionStorage (lost on refresh)
   - Consider: Electron's safeStorage for persistence
   - Consider: OAuth flow instead of personal tokens

2. **Token in URL**: Avoid storing token in URLs
   - Current implementation passes token via sessionStorage

3. **API Calls**: GitHub API calls from main process (good - avoids exposing token to renderer)

4. **SSH vs HTTPS**: 
   - Current implementation uses HTTPS (token-based)
   - Consider: SSH keys for better security

## Performance Notes

- GitHub API calls happen in main process (doesn't block UI)
- Large repository clones might take time - add progress indication
- Consider caching repository list
