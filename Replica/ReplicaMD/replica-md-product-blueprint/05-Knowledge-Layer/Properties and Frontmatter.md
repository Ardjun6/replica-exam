---
title: "Properties and Frontmatter"
product: "Replica.md"
area: "Knowledge Layer"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Collections DB UI]]"
  - "[[Properties and Frontmatter]]"
  - "[[Markdown Syntax Matrix]]"
  - "[[JSON Examples]]"
---

# Properties and Frontmatter

Properties give pages structured metadata while keeping the file plain Markdown. Frontmatter is the source format, and the UI should make common edits easier without hiding how the data is stored.

## Property behavior

- Support text, number, date, checkbox, select, multiselect, links, and simple lists where the schema allows.
- Show invalid or unexpected values without deleting them.
- Let collections use properties as filters, columns, and grouping fields.

## Editing rules

- Preserve comments and unknown fields where possible.
- Avoid reformatting an entire file just because one property changed.
- Use schema hints only when the workspace defines them.

## Review checklist

- Frontmatter edits round-trip safely.
- Collections read properties from the same parser as the page view.
- Invalid fields are recoverable.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Collections DB UI]]
- [[Properties and Frontmatter]]
- [[Markdown Syntax Matrix]]
- [[JSON Examples]]

## Maintenance note

The knowledge layer should always be traceable back to files, links, and the workspace index.
