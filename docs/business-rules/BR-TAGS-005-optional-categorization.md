# BR-TAGS-005: Tags are optional (0-N per app)

**Domain:** Tags  
**Status:** active

## Rule

Applications may have zero or more tags. Tags are optional metadata for filtering and organization. No tag triggers mandatory validation errors.

## Enforcement

Database:
- `app_tags` junction table (app_id, tag_id) allows NULL for apps without tags
- `LEFT JOIN app_tags` in queries (returns NULL tag rows for untagged apps)

## Implication

- Apps can exist without categorization
- Tag-based filtering UI gracefully handles NULL results
- No "required tag" enforcement (future policy can add validation)

## Related

ADR-004 (PostgreSQL schema for relationships), open-api/tags.md
