# TODO: BC-UR Library Enhancement Request

## Feature Request: Expose Fragment Composition API

### Problem
The BC-UR Playground needs to visualize which original data blocks are included in each fountain-encoded fragment. Currently, the `UrFountainEncoder` class generates fragments but doesn't expose which blocks each fragment contains.

### Current Workaround
We implemented a simplified version of the `chooseFragments()` algorithm in `js/multi-ur.js`, but this has limitations:

1. **Inaccurate for mixed fragments**: Our simplified PRNG doesn't match the Xoshiro PRNG used by bc-ur
2. **Doesn't match Robust Soliton distribution**: The actual degree selection uses alias sampling
3. **Maintenance burden**: Any changes to bc-ur's algorithm require updating our workaround

### Proposed Solution

Add one of these options to the bc-ur library:

#### Option 1: Expose `chooseFragments` utility (Preferred)

Export the existing `chooseFragments()` function from `src/helpers/fountainUtils.ts`:

```typescript
// In src/helpers/fountainUtils.ts
export const chooseFragments = (
  seqNum: number,
  seqLength: number,
  checksum: number
): number[] => {
  // ... existing implementation
};

// In main export (index or wherever exports are defined)
export { chooseFragments } from './helpers/fountainUtils.js';
```

**Usage in BC-UR Playground:**
```javascript
import { chooseFragments } from '@ngraveio/bc-ur';

// Get which blocks are in fragment #5
const blockIndexes = chooseFragments(5, totalBlocks, checksum);
```

#### Option 2: Add method to `UrFountainEncoder`

Add a method to the `UrFountainEncoder` class:

```typescript
class UrFountainEncoder extends FountainEncoder {
  /**
   * Get which original blocks are included in a specific fragment
   * @param seqNum - Sequence number (1-indexed)
   * @returns Array of block indexes (0-indexed) included in this fragment
   */
  public getFragmentBlocks(seqNum: number): number[] {
    return chooseFragments(seqNum, this._pureFragments.length, this._checksum);
  }
}
```

**Usage in BC-UR Playground:**
```javascript
const encoder = new UrFountainEncoder(ur, maxLen, minLen);
const blockIndexes = encoder.getFragmentBlocks(5);
```

#### Option 3: Add property to UR object (Alternative)

When parsing a multi-part UR, include fragment composition in the UR object:

```typescript
interface IUR {
  type: string;
  payload: string;
  seqNum?: number;
  seqLength?: number;
  isFragment?: boolean;
  fragmentBlocks?: number[]; // NEW: Which blocks this fragment contains
}
```

### Benefits

1. **Accuracy**: Uses the exact same algorithm as encoding
2. **Consistency**: No divergence between encoder and visualization
3. **Simplicity**: Eliminates workaround code in user applications
4. **Education**: Helps developers understand fountain encoding internals
5. **Debugging**: Essential for troubleshooting encoding/decoding issues

### Use Cases

- **Visual debugging**: Show which blocks are in each QR frame (BC-UR Playground)
- **Progress tracking**: Display more detailed decoding progress
- **Testing**: Verify encoder behavior in automated tests
- **Education**: Teaching fountain coding concepts

### Files to Modify in bc-ur

1. `src/helpers/fountainUtils.ts` - Export `chooseFragments`
2. Main export file (index or barrel export) - Re-export the function
3. `src/classes/UrFountainEncoder.ts` - Optionally add `getFragmentBlocks()` method
4. Type definitions - Update TypeScript declarations

### Backward Compatibility

All proposed options are additive (new exports/methods) with no breaking changes.

### Priority

**Medium-High**: While BC-UR Playground works with the workaround, exposing this API would:
- Improve accuracy for mixed fragments
- Reduce maintenance burden
- Enable better debugging tools across the ecosystem

---

## GitHub Issue Draft

**Title**: [Feature Request] Expose `chooseFragments` utility or add `getFragmentBlocks()` method

**Description**:

The `chooseFragments()` function in `fountainUtils.ts` is essential for understanding which original data blocks are included in each fountain-encoded fragment. However, it's not currently exported from the library.

**Use case**: Visual debugging tools (like BC-UR Playground) need to show users which blocks each fragment contains to help them understand fountain encoding behavior.

**Proposed API** (choose one):
1. Export `chooseFragments(seqNum, seqLength, checksum): number[]`
2. Add `UrFountainEncoder.getFragmentBlocks(seqNum): number[]`
3. Include `fragmentBlocks` in parsed UR objects

**Current workaround**: Reimplementing the algorithm with simplified PRNG (not accurate for mixed fragments).

**Benefits**: Accuracy, consistency, better debugging, educational value.

See full details in: [Link to this TODO file]

---

## Related Code

**Current workaround location**: `/js/multi-ur.js`
- `extractFragmentBlocks()` - Lines 638-708
- `chooseFragments()` - Lines 710-741
- `chooseDegree()` - Lines 743-753
- `xorshift32()` - Lines 755-766

**Reference implementation**: `reference_projects/bc-ur/src/helpers/fountainUtils.ts`
- `chooseFragments()` - Lines 50-70
- Uses Xoshiro PRNG and alias sampling

**Fragment composition visualization**: `/js/multi-ur.js`
- `updateEncoderBlocksGrid()` - Lines 577-633
- Shows green/gray blocks indicating which are included
