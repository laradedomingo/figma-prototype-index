# Bugfix Requirements Document

## Introduction

The Figma plugin generates an index of prototype starting points with clickable cards. When users click on a prototype card in the generated index, nothing happens - the plugin fails to navigate to the prototype's starting point. This affects both the Figma desktop app and web versions, preventing users from using the index as an effective navigation tool.

The root cause is that the plugin attempts to use OPEN_URL reactions on the generated cards, but these reactions don't trigger navigation within Figma. The UI also has a navigateTo() function that sends a NAVIGATE_TO message, but this is only called from the plugin's UI panel list view, not from the generated Figma frame cards.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks on a prototype card in the generated "Prototype Index" frame THEN the system does nothing and no navigation occurs

1.2 WHEN a user clicks on a prototype card with an OPEN_URL reaction THEN the system fails to trigger any action in both desktop and web versions of Figma

1.3 WHEN the plugin generates cards with OPEN_URL reactions pointing to prototype URLs THEN the system creates non-functional interactive elements that appear clickable but have no effect

### Expected Behavior (Correct)

2.1 WHEN a user clicks on a prototype card in the generated "Prototype Index" frame THEN the system SHALL navigate to that prototype's starting point within Figma

2.2 WHEN a user clicks on a prototype card THEN the system SHALL scroll the viewport to the prototype frame, switch to the correct page, and select the frame

2.3 WHEN the plugin generates cards for prototypes THEN the system SHALL create functional navigation using Figma's NAVIGATE action type instead of OPEN_URL

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user clicks on a prototype URL link in the plugin's UI panel THEN the system SHALL CONTINUE TO open the prototype URL in a new browser tab

3.2 WHEN a user clicks on a prototype card in the plugin's UI panel list view THEN the system SHALL CONTINUE TO navigate to that prototype using the NAVIGATE_TO message handler

3.3 WHEN the plugin generates the visual appearance of cards (thumbnails, labels, styling) THEN the system SHALL CONTINUE TO render them with the same design and layout

3.4 WHEN the plugin scans for prototype starting points THEN the system SHALL CONTINUE TO detect all flow starting points across all pages correctly

3.5 WHEN the plugin generates cards with metadata (size, reaction count, page name) THEN the system SHALL CONTINUE TO display this information accurately
