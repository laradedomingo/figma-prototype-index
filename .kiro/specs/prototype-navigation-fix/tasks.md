# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Card Click Navigation Failure
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases - clicking on generated prototype cards in the "Prototype Index" frame
  - Test that clicking a card with OPEN_URL reaction causes navigation (viewport scroll, page switch, frame selection)
  - Test cases: Grid layout card click, list layout card click, cross-page navigation, same-page navigation
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: card clicks produce no navigation, viewport doesn't move, no frame selection
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Card Interaction Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (UI panel clicks, URL displays, card styling, prototype scanning)
  - Write property-based tests capturing observed behavior patterns:
    - UI panel navigation continues to work using NAVIGATE_TO message handler
    - External prototype URL links in UI panel continue to open in new browser tabs
    - Card visual appearance (thumbnails, labels, styling, layout) remains identical
    - Prototype detection and scanning across all pages continues to work correctly
    - Card metadata display (size, reaction count, page name, URLs) remains accurate
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for prototype card navigation

  - [x] 3.1 Implement the fix in makeCard() function
    - Change reaction type from OPEN_URL to NAVIGATE in code.js (line 341-346)
    - Replace `{ "type": "URL", "url": proto.prototypeUrl, "openInNewTab": true }` with `{ "type": "NAVIGATE", "destinationId": proto.id }`
    - Update conditional check from `if (proto.prototypeUrl)` to `if (proto.id)`
    - Remove or update obsolete comment about "OPEN_URL reaction (official format per Figma plugin docs)"
    - Add accurate comment about NAVIGATE action for in-document navigation
    - _Bug_Condition: isBugCondition(input) where input.target.reactions[0].actions[0].type == "URL" AND NOT navigationOccurred(input.target)_
    - _Expected_Behavior: navigationOccurred(result) AND viewportScrolledToFrame(result) AND frameIsSelected(result) AND correctPageIsActive(result)_
    - _Preservation: UI panel navigation, URL display, card styling, prototype detection, and metadata display remain unchanged_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Card Click Navigation Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify navigation occurs: viewport scrolls, page switches if needed, frame is selected
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Card Interaction Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions in UI panel navigation, URL display, card styling, prototype detection, metadata display)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
