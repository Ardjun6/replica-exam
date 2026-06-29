---
title: "Community Extension Workflow"
product: "Replica.md"
area: "Extensions"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Extension API]]"
  - "[[Extension Manifest]]"
  - "[[Marketplace and Review]]"
  - "[[Security and Permissions]]"
---

# Community Extension Workflow

The community extension workflow describes how an idea becomes a trusted extension. It should be clear for builders and strict enough that users understand what they are installing.

## Builder flow

- Create manifest, implement commands or views, declare permissions, test in a sandbox workspace, package, and submit for review.
- Document settings, commands, data storage, and uninstall behavior.
- Provide screenshots or short examples for marketplace review.

## Review flow

- Check permissions, dependency licenses, dangerous APIs, bundled assets, update behavior, and privacy claims.
- Require a changelog for updates that change permissions.
- Give users a readable reason when an extension is rejected or flagged.

## Review checklist

- Extension authors know the path from local build to review.
- Users can see what an extension can access before enabling it.
- Marketplace policy links to security and permissions.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Extension API]]
- [[Extension Manifest]]
- [[Marketplace and Review]]
- [[Security and Permissions]]

## Maintenance note

Extension features should be useful only when they stay inside the permission model.
