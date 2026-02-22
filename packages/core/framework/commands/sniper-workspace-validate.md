# /sniper-workspace validate -- Validate Interface Contracts

You are executing the `/sniper-workspace validate` command. Your job is to validate that repository implementations match the agreed-upon interface contracts without running a sprint. This is an on-demand validation check.

The user's arguments are provided in: $ARGUMENTS

---

## Step 0: Pre-Flight

1. Verify `workspace.yaml` exists
2. Parse `$ARGUMENTS`:
   - `--contract {name}`: validate a specific contract (optional)
   - `--verbose`: show detailed validation output
   - No args: validate all contracts

---

## Step 1: Load Contracts

### 1a: Find Contracts
Scan `contracts/` directory for `.contract.yaml` files.

If `--contract` was specified, load only that contract. Otherwise, load all.

If no contracts found:
```
No contracts found in contracts/ directory.
Create contracts by running: /sniper-workspace feature "{description}"
```
Then STOP.

### 1b: Parse Contracts
For each contract file:
1. Parse the YAML
2. Extract: name, version, between (repos), endpoints, shared_types, events
3. Validate the contract is well-formed (has required fields)

---

## Step 2: Validate Each Contract

For each contract:

### 2a: Endpoint Validation
For each endpoint in the contract:
1. Identify the implementing repo (from `between` — the one that exposes the API)
2. Search the repo's source code for:
   - Route definitions matching the endpoint path and method
   - Request validation matching the contract's request schema
   - Response structure matching the contract's response schema
3. Report: ✅ (matches), ⚠️ (partial match — structure differs), ❌ (not found)
4. For mismatches, record: expected (from contract), actual (from code), file location

### 2b: Shared Type Validation
For each shared type:
1. Find the owning repo's type definition at the specified path
2. Compare the type shape against the contract definition
3. Check that consumer repos import the type (not define their own)
4. Report: ✅ (matches), ❌ (mismatch or missing)

### 2c: Event Validation
For each event:
1. Find the producer's event emission code
2. Check the payload structure against the contract
3. Find consumer event handlers
4. Report: ✅ (matches), ❌ (mismatch or missing)

---

## Step 3: Compile Report

### Summary
```
============================================
  Contract Validation Results
============================================

  {contract-1} v{version}
    Endpoints:    {passed}/{total} ✅    {failed} ❌
    Shared Types: {passed}/{total} ✅    {failed} ❌
    Events:       {passed}/{total} ✅    {failed} ❌
    Status:       PASS / FAIL

  {contract-2} v{version}
    ...

  Overall: {total_passed}/{total_checked} passed
============================================
```

### Verbose Output (if --verbose)
Show per-item details:
```
  {contract-name} / {endpoint-path} {method}
    Expected: {contract spec}
    Actual:   {implementation}
    File:     {repo}/{path}:{line}
    Status:   ✅ / ❌
```

### Mismatch Details
For each failure, show:
```
MISMATCH: {contract-name} / {item}
  Expected: {what the contract specifies}
  Actual:   {what the implementation does}
  Location: {repo}/{file}:{line}
  Fix:      {suggested fix}
```

---

## Step 4: Recommendations

If failures found:
```
Recommended Actions:
  1. Fix the mismatches manually, OR
  2. Run /sniper-workspace feature --resume WKSP-{XXXX} to generate fix stories
  3. Re-validate with: /sniper-workspace validate
```

If all passed:
```
All contracts validated successfully. Implementations match specifications.
```

---

## IMPORTANT RULES

- This is a read-only validation — do not modify any files
- Validation is structural, not behavioral — it checks schemas and shapes, not runtime behavior
- A ⚠️ (partial match) means the implementation exists but differs from the contract — investigate before declaring it a failure
- If a repo path is inaccessible, report it as ❌ for all its contract items
- Always validate the full contract — do not skip items even if early items fail
- Contract validation does not run tests — it analyzes source code structure only
