---
description: How to maintain documentation consistency during development
---

# Documentation First Protocol

This workflow ensures that code and documentation stay synchronized. It must be followed for every backend code modification.

## 1. Pre-Code Check
Before modifying any `.py` file:
- **Scan for Docs**: Check for a corresponding `.md` file (e.g., `README.md` in the same module, or a file named after the module).
- **Read Context**: If the doc exists, read it to understand the module's purpose, architecture, and constraints.
- **Create if Missing**: If no doc exists:
    - Create a `README.md` in the module directory.
    - Include: Module Title, Purpose, Key Functions, and Dependencies.

## 2. Header Reference (The "Link")
Every source file must have a header comment pointing to its documentation.
- **Format**:
  ```python
  # DOCUMENTATION_SOURCE: <relative_path_to_md_file>
  ```
- **Action**: If this header is missing, ADD IT immediately at the top of the file (before imports).

## 3. Post-Code Update
After modifying the code:
- **Update Logic**: Reflect changes in logic, parameters, or return values in the `.md` file.
- **Add Notes**: Add any new environment variables, dependencies, or "gotchas" discovered.

## 4. Small Modules / Shared Docs
For directories with many small files:
- Maintain a single `README.md` or `MODULE_DOCS.md`.
- Use **Serial Numbers** or **Section Anchors** to map files to doc sections.
  - Example in Code: `# DOCUMENTATION_SOURCE: README.md#serial-01-utils`
  - Example in MD: `## 01. Utils (serial-01-utils)`
