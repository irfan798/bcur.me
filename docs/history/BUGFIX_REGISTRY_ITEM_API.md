# Bug Fix: Registry Item API Corrections

**Date**: 2025-10-14  
**Issue**: Runtime errors when displaying registry items and executing methods

## Errors Fixed

### Error 1: `registryItem.getRegistryType is not a function`
**Location**: `registry-item-ui.js:397` (renderTypeDrawer)

**Root Cause**: Incorrectly assumed registry items have a `getRegistryType()` method. According to the bc-ur library source (`reference_projects/bc-ur/src/classes/RegistryItem.ts`), registry items have a `.type` property, not a method.

**Registry Item Structure** (from RegistryItem.ts):
```typescript
abstract class RegistryItemBase {
  readonly type: IRegistryType;  // ← Property, not method!
  // ...
}

interface IRegistryType {
  tag: number;
  URType: string;
  CDDL: string;
  // ...
}
```

**Fix**: Changed from `registryItem.getRegistryType()` to `registryItem.type`

### Error 2: `this.formatValue is not a function`
**Location**: `registry-item-ui.js:765` (showInlineMethodResult)

**Root Cause**: Called non-existent `this.formatValue()` method. The correct method name is `this.formatTreeValue()` (defined at line 193).

**Fix**: Changed from `this.formatValue(result)` to `this.formatTreeValue(result)`

## Files Modified

### 1. `/js/registry-item-ui.js` (5 changes)

#### Change 1: renderTypeDrawer() - Access type property correctly
```javascript
// BEFORE (WRONG):
const registryType = registryItem.getRegistryType();
const urType = registryType.type;
const tag = registryItem.constructor.tag;
const cddl = registryItem.constructor.CDDL || 'No CDDL schema available';

// AFTER (CORRECT):
const registryType = registryItem.type;
const urType = registryType.URType; // URType is the string identifier
const tag = registryType.tag; // Tag from type object
const cddl = registryType.CDDL || 'No CDDL schema available';
```

#### Change 2: showInlineMethodResult() - Use correct formatting method
```javascript
// BEFORE (WRONG):
<pre>${this.formatValue(result)}</pre>

// AFTER (CORRECT):
<pre>${this.formatTreeValue(result)}</pre>
```

#### Change 3: getCommonRegistryMethods() - Remove non-existent method
```javascript
// BEFORE (WRONG):
{ name: 'getRegistryType', description: 'Get registry type info', signature: 'getRegistryType(): RegistryType' },

// AFTER (CORRECT - removed, added toBytes instead):
{ name: 'toBytes', description: 'Get payload bytes', signature: 'toBytes(): Uint8Array' }
```

#### Change 4: Copy registry item code - Fix type access
```javascript
// BEFORE (WRONG):
const registryType = this.currentRegistryItem.getRegistryType?.();

// AFTER (CORRECT):
const registryType = this.currentRegistryItem.type;
```

#### Change 5: Registry item detection - Use type property check
```javascript
// BEFORE (WRONG):
const isResultRegistryItem = result && typeof result === 'object' && 
    typeof result.getRegistryType === 'function';

// AFTER (CORRECT):
const isResultRegistryItem = result && typeof result === 'object' && 
    result.type && typeof result.type === 'object' && result.type.URType;
```

### 2. `/js/converter.js` (1 change)

#### Change: Console logging - Fix suggested commands
```javascript
// BEFORE (WRONG):
console.log('│    ↳ Try: window.$lastRegistryItem.getRegistryType()');

// AFTER (CORRECT):
console.log('│    ↳ Type info: window.$lastRegistryItem.type');
```

## Registry Item API Reference

### Properties
- `.type` - IRegistryType object containing:
  - `.tag` - CBOR tag number
  - `.URType` - UR type string (e.g., "crypto-hdkey")
  - `.CDDL` - CDDL schema definition
- `.data` - The actual data payload

### Methods (Available on all registry items)
- `.toUR()` - Convert to UR object
- `.toHex()` - Encode to hex string
- `.toBytes()` - Get payload bytes (Uint8Array)
- `.toCBOR()` - Encode to CBOR with tag
- `.toString()` - String representation

### Accessing Type Information
```javascript
// ✅ CORRECT:
const registryItem = window.$lastRegistryItem;
const urType = registryItem.type.URType;     // "crypto-hdkey"
const tag = registryItem.type.tag;           // 303
const cddl = registryItem.type.CDDL;         // "crypto-hdkey = ..."

// ❌ WRONG (doesn't exist):
const type = registryItem.getRegistryType(); // TypeError!
```

## Testing Verification

After these fixes, the following should work:

1. **Type Drawer Display**: Click type drawer toggle → should expand without errors
2. **Method Execution**: Click method buttons (e.g., `getAccount()`) → should execute and show results inline
3. **Console Access**: `window.$lastRegistryItem.type` → should show type object with URType, tag, CDDL

## Lessons Learned

1. **Always verify library API**: Assumptions about method names can be wrong. Check the actual source code in `reference_projects/`.
2. **Method naming consistency**: Use existing method names (`formatTreeValue`) rather than inventing new ones (`formatValue`).
3. **Type checking patterns**: For registry items, check for `.type` property with `.URType` field, not method existence.

## Related Files

- Source of truth: `/reference_projects/bc-ur/src/classes/RegistryItem.ts`
- Fixed implementation: `/js/registry-item-ui.js`
- Console integration: `/js/converter.js`
