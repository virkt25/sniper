# /sniper-compose -- Compose a Spawn Prompt from Persona Layers

You are executing the `/sniper-compose` command. Your job is to assemble a teammate spawn prompt by merging persona layers into the template. Follow every step below precisely.

The user's arguments are provided in: $ARGUMENTS

---

## Step 0: Parse Arguments

Parse the following flags from `$ARGUMENTS`:

| Flag           | Required | Description                                    | Example                |
|----------------|----------|------------------------------------------------|------------------------|
| `--process`    | YES      | Process persona layer name                     | `architect`            |
| `--technical`  | NO       | Technical persona layer name (null if omitted) | `backend`              |
| `--cognitive`  | NO       | Cognitive persona layer name (null if omitted) | `security-first`       |
| `--domain`     | NO       | Domain context name from active domain pack    | `telephony`            |
| `--name`       | YES      | Display name for the teammate                  | `"Backend Architect"`  |
| `--ownership`  | NO       | Ownership key from config.yaml                 | `backend`              |

**If `--process` is missing**, print an error:
```
ERROR: --process is required. This specifies the process persona layer.
Usage: /sniper-compose --process architect --technical backend --cognitive security-first --name "Backend Architect"
Available process layers: analyst, product-manager, architect, ux-designer, scrum-master, developer, qa-engineer
```
Then STOP.

**If `--name` is missing**, print an error:
```
ERROR: --name is required. This is the display name for the teammate.
Usage: /sniper-compose --process architect --technical backend --name "Backend Architect"
```
Then STOP.

If no arguments are provided at all, print a usage guide:
```
SNIPER Compose -- Assemble a spawn prompt from persona layers

Usage:
  /sniper-compose --process <layer> --name <name> [--technical <layer>] [--cognitive <layer>] [--domain <context>] [--ownership <key>]

Required:
  --process    Process persona layer (analyst, product-manager, architect, ux-designer, scrum-master, developer, qa-engineer)
  --name       Display name for the teammate (quoted if spaces)

Optional:
  --technical  Technical persona layer (backend, frontend, infrastructure, security, ai-ml, database, api-design)
  --cognitive  Cognitive persona layer (systems-thinker, security-first, performance-focused, user-empathetic, devils-advocate, mentor-explainer)
  --domain     Domain context from the active domain pack
  --ownership  Ownership key from config.yaml (backend, frontend, infrastructure, tests, docs)

Examples:
  /sniper-compose --process architect --technical backend --cognitive security-first --name "Backend Architect" --ownership backend
  /sniper-compose --process developer --technical frontend --cognitive user-empathetic --name "Frontend Dev" --ownership frontend
  /sniper-compose --process analyst --cognitive systems-thinker --name "Business Analyst"
```
Then STOP.

---

## Step 1: Read the Template

Read the spawn prompt template from:
```
.sniper/spawn-prompts/_template.md
```

If it does not exist, print an error:
```
ERROR: Spawn prompt template not found at .sniper/spawn-prompts/_template.md
Run /sniper-init to set up the framework.
```
Then STOP.

Store the template content for merging in Step 4.

---

## Step 2: Read Each Persona Layer

For each specified layer, read the corresponding file. Track which layers were found and which were not.

### 2a: Process Layer (required)
Read: `.sniper/personas/process/{process_name}.md`

If the file does not exist, print an error listing available process layers:
```
ERROR: Process persona '{process_name}' not found.
Available process layers:
```
Then list all `.md` files in `.sniper/personas/process/` (without the extension). Then STOP.

### 2b: Technical Layer (optional)
If `--technical` was provided, read: `.sniper/personas/technical/{technical_name}.md`

If the file does not exist, print a warning:
```
WARNING: Technical persona '{technical_name}' not found. Skipping technical layer.
Available technical layers:
```
Then list all `.md` files in `.sniper/personas/technical/`. Set the technical layer content to:
```
No specific technical expertise assigned. Apply general engineering best practices.
```

### 2c: Cognitive Layer (optional)
If `--cognitive` was provided, read: `.sniper/personas/cognitive/{cognitive_name}.md`

If the file does not exist, print a warning and list available cognitive layers. Set the cognitive layer content to:
```
No specific cognitive style assigned. Apply balanced analytical thinking.
```

### 2d: Domain Layer (optional)
If `--domain` was provided:
1. Read `.sniper/config.yaml` to get the active `domain_pack` value
2. If `domain_pack` is null, print an error:
   ```
   ERROR: No domain pack is configured. Set domain_pack in .sniper/config.yaml or run /sniper-init.
   ```
   Set the domain layer content to `No domain-specific context available.`
3. If `domain_pack` is set, read: `.sniper/domain-packs/{domain_pack}/context/{domain_name}.md`
4. If the file does not exist, print a warning and list available contexts in that domain pack directory.
   Set the domain layer content to `No domain-specific context available.`

If `--domain` was NOT provided, set the domain layer content to:
```
No domain-specific context loaded. Refer to project documentation for domain knowledge.
```

---

## Step 3: Read Ownership Rules

Read `.sniper/config.yaml` and extract the `ownership` section.

If `--ownership` was provided:
1. Look up the ownership key in the config (e.g., `backend`, `frontend`, `infrastructure`, `tests`, `docs`)
2. Extract the list of directory patterns for that key
3. Format them as a comma-separated string for the template

If `--ownership` was NOT provided:
1. Try to infer ownership from the `--technical` flag:
   - `backend` technical -> `backend` ownership
   - `frontend` technical -> `frontend` ownership
   - `infrastructure` technical -> `infrastructure` ownership
   - `security` technical -> `backend` ownership (security spans backend)
   - `ai-ml` technical -> `backend` ownership
   - `database` technical -> `backend` ownership
   - `api-design` technical -> `backend` ownership
2. If no technical layer was specified, set ownership to: `"No specific ownership assigned -- coordinate with team lead"`

Format the ownership value as a readable list, for example:
```
src/backend/, src/api/, src/services/, src/db/, src/workers/
```

---

## Step 4: Merge Layers into Template

Take the template content from Step 1 and perform these replacements:

| Placeholder        | Replace With                                  |
|-------------------|-----------------------------------------------|
| `{name}`          | The `--name` value                            |
| `{process_layer}` | Full content of the process persona file      |
| `{technical_layer}`| Full content of the technical persona file (or default text) |
| `{cognitive_layer}`| Full content of the cognitive persona file (or default text) |
| `{domain_layer}`  | Full content of the domain context file (or default text) |
| `{ownership}`     | Formatted ownership directories from Step 3   |

The merged result is the complete spawn prompt.

---

## Step 5: Write the Composed Prompt

Generate a slug from the `--name` value:
- Lowercase
- Replace spaces with hyphens
- Remove special characters
- Example: `"Backend Architect"` -> `backend-architect`

Write the composed prompt to:
```
.sniper/spawn-prompts/{slug}.md
```

If a file already exists at that path, overwrite it silently (spawn prompts are regenerated as needed).

---

## Step 6: Display Preview and Summary

Print a summary of what was composed:

```
============================================
  Spawn Prompt Composed
============================================

  Name:       {name}
  Saved to:   .sniper/spawn-prompts/{slug}.md

  Layers Used:
    Process:    {process_name} (.sniper/personas/process/{process_name}.md)
    Technical:  {technical_name or "none"}
    Cognitive:  {cognitive_name or "none"}
    Domain:     {domain_name or "none"}

  Ownership:   {ownership_dirs}

============================================
```

Then print a preview of the composed prompt. Show the FULL content of the generated file so the user can review it.

After the preview, print:
```
This spawn prompt is ready to use. It will be loaded when a teammate is created with this persona configuration.
```

---

## IMPORTANT RULES

- Do NOT modify any persona layer source files -- they are read-only inputs.
- Do NOT modify the template file -- it is a read-only input.
- The composed output goes ONLY to `.sniper/spawn-prompts/{slug}.md`.
- If any required layer file is missing, STOP with a clear error. Do not generate placeholder content for required layers.
- For optional layers that are missing, use the default text specified above and continue.
- Always show the full preview so the user can verify before using the prompt.
- Preserve all markdown formatting from the persona layer files when merging.
- Do not add any extra content beyond what is in the template and layers.
