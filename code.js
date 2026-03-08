// Prototype Index Plugin - Main Code
// Runs in the Figma sandbox environment
let watcherInterval = null;
let lastSnapshot = "";
let isWatching = false;
// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function countChildReactions(node) {
    let count = 0;
    if (!node.children)
        return count;
    for (const child of node.children) {
        if (child.reactions)
            count += child.reactions.length;
        count += countChildReactions(child);
    }
    return count;
}
/**
 * Finds the topmost frame on a page (smallest Y coordinate)
 * @param {PageNode} page - The page to search
 * @returns {FrameNode|ComponentNode|null} The cover frame or null if none exists
 */
function findCoverFrame(page) {
    // Returns the topmost frame on the page
    // "Topmost" means the frame with the smallest Y coordinate
    if (!page.children || page.children.length === 0) {
        return null;
    }
    let coverFrame = null;
    let minY = Infinity;
    for (const child of page.children) {
        if (child.type === "FRAME" || child.type === "COMPONENT") {
            if (child.y < minY) {
                minY = child.y;
                coverFrame = child;
            }
        }
    }
    return coverFrame;
}
/**
 * Calculates the Y position for the frame index based on cover frame position
 * @param {PageNode} page - The page containing the cover frame
 * @param {number} indexFrameHeight - The height of the index frame (unused but kept for API compatibility)
 * @returns {{x: number, y: number}} Position coordinates for the index frame
 */
function calculateIndexPosition(page, indexFrameHeight) {
    const SPACING = 100; // Vertical spacing between cover and index
    try {
        const coverFrame = findCoverFrame(page);
        if (!coverFrame) {
            // No cover frame exists, position at top
            return { x: 0, y: 0 };
        }
        // Handle invalid cover frame dimensions (negative height)
        if (coverFrame.height < 0) {
            console.warn("Cover frame has negative height, falling back to (0, 0) position");
            return { x: 0, y: 0 };
        }
        // Position below cover frame with spacing
        const yPosition = coverFrame.y + coverFrame.height + SPACING;
        return { x: 0, y: yPosition };
    }
    catch (err) {
        // Fall back to (0, 0) position on calculation errors
        console.warn("Error calculating index position, falling back to (0, 0):", err);
        return { x: 0, y: 0 };
    }
}
/**
 * Removes any existing "Prototype Index" frames from the specified page
 * @param {PageNode} page - The page to clean up
 */
function removeOldIndexFrames(page) {
    // Remove any existing "Prototype Index" frames from the page
    // Iterate backwards through children array for safe removal
    for (let i = page.children.length - 1; i >= 0; i--) {
        const child = page.children[i];
        if (child.name === "Prototype Index") {
            child.remove();
        }
    }
}
// ─────────────────────────────────────────────
// SCAN ONLY STARTING POINTS ACROSS ALL PAGES
// The correct Figma API is page.flowStartingPoints:
// an array of { name, nodeId } stored at the PAGE level.
// ─────────────────────────────────────────────
async function generateThumbnailsForPrototypes(prototypes) {
    const thumbnails = {};
    for (const proto of prototypes) {
        try {
            const node = figma.getNodeById(proto.id);
            if (node && (node.type === "FRAME" || node.type === "COMPONENT")) {
                const imageBytes = await node.exportAsync({
                    format: "PNG",
                    constraint: { type: "SCALE", value: 0.15 }
                });
                thumbnails[proto.id] = imageBytes;
            }
        }
        catch (err) {
            console.log("Could not generate thumbnail for:", proto.name, err);
        }
    }
    return thumbnails;
}
function getAllPrototypes() {
    var allPrototypes = [];
    // Debug: Check if fileKey is available
    console.log("=== URL Debug Info ===");
    console.log("figma.fileKey:", figma.fileKey);
    console.log("figma.root.name:", figma.root.name);
    for (var pi = 0; pi < figma.root.children.length; pi++) {
        var page = figma.root.children[pi];
        if (page.name === "📋 Prototype Index")
            continue;
        var flows = page.flowStartingPoints;
        if (!flows || flows.length === 0)
            continue;
        for (var fi = 0; fi < flows.length; fi++) {
            var flow = flows[fi];
            var node = figma.getNodeById(flow.nodeId);
            if (!node)
                continue;
            var flowName = flow.name || node.name;
            var fileKey = figma.fileKey;
            var nodeIdEncoded = encodeURIComponent(node.id);
            var pageIdEncoded = encodeURIComponent(page.id);
            var prototypeUrl = fileKey
                ? "https://www.figma.com/proto/" + fileKey + "/" + encodeURIComponent(flowName) +
                    "?node-id=" + nodeIdEncoded +
                    "&page-id=" + pageIdEncoded +
                    "&starting-point-node-id=" + nodeIdEncoded
                : null;
            // Debug: Log URL generation details
            console.log("Prototype:", flowName);
            console.log("  - fileKey:", fileKey);
            console.log("  - node.id:", node.id);
            console.log("  - page.id:", page.id);
            console.log("  - Generated URL:", prototypeUrl);
            const sceneNode = node;
            allPrototypes.push({
                id: sceneNode.id,
                name: sceneNode.name,
                flowName: flowName,
                type: sceneNode.type,
                width: Math.round(sceneNode.width || 0),
                height: Math.round(sceneNode.height || 0),
                x: Math.round(sceneNode.x || 0),
                y: Math.round(sceneNode.y || 0),
                pageName: page.name,
                pageId: page.id,
                reactionsCount: (sceneNode.reactions ? sceneNode.reactions.length : 0) +
                    countChildReactions(sceneNode),
                prototypeUrl: prototypeUrl,
                lastChecked: Date.now(),
            });
        }
    }
    console.log("=== Total prototypes found:", allPrototypes.length, "===");
    return allPrototypes;
}
function createSnapshot(prototypes) {
    return JSON.stringify(prototypes.map((p) => ({
        id: p.id,
        name: p.name,
        flowName: p.flowName,
        pageName: p.pageName,
    })));
}
// ─────────────────────────────────────────────
// FONT LOADER
// ─────────────────────────────────────────────
async function loadFonts() {
    await Promise.all([
        figma.loadFontAsync({ family: "Inter", style: "Regular" }),
        figma.loadFontAsync({ family: "Inter", style: "Medium" }),
        figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }),
        figma.loadFontAsync({ family: "Inter", style: "Bold" }),
    ]);
}
// ─────────────────────────────────────────────
// GENERATE INDEX FRAME IN FIGMA
// ─────────────────────────────────────────────
async function generateIndexFrame(prototypes, options) {
    try {
        await loadFonts();
        // Group by page
        const pageGroups = {};
        for (const p of prototypes) {
            if (!pageGroups[p.pageName])
                pageGroups[p.pageName] = [];
            pageGroups[p.pageName].push(p);
        }
        const pageNames = Object.keys(pageGroups);
        const totalPrototypes = prototypes.length;
        const now = new Date();
        const dateStr = now.toLocaleDateString("es-ES", {
            day: "2-digit", month: "long", year: "numeric",
        });
        const timeStr = now.toLocaleTimeString("es-ES", {
            hour: "2-digit", minute: "2-digit",
        });
        // ── Design constants ──
        const PADDING = 48;
        const FRAME_WIDTH = 1600;
        const CARD_WIDTH = options.layout === "grid" ? 340 : FRAME_WIDTH - PADDING * 2;
        const CARD_H = options.layout === "grid" ? 340 : 80;
        const THUMB_W = options.layout === "grid" ? CARD_WIDTH : 80;
        const THUMB_H = options.layout === "grid" ? 120 : CARD_H;
        const COLS = options.layout === "grid" ? 3 : 1;
        const GAP_X = options.layout === "grid" ? 20 : 0;
        const GAP_Y = options.layout === "grid" ? 16 : 8;
        const PAGE_HEADER_H = 56;
        const PAGE_GAP = 40;
        // Colors — color objects must only have {r,g,b}, opacity is separate
        const C = {
            bg: { r: 0.063, g: 0.063, b: 0.071 },
            surface: { r: 0.086, g: 0.086, b: 0.098 },
            surface2: { r: 0.118, g: 0.118, b: 0.133 },
            border: { r: 0.165, g: 0.165, b: 0.184 },
            accent: { r: 0.482, g: 0.416, b: 0.969 },
            green: { r: 0.243, g: 0.812, b: 0.553 },
            white: { r: 1, g: 1, b: 1 },
            text: { r: 0.941, g: 0.941, b: 0.953 },
            textMuted: { r: 0.533, g: 0.533, b: 0.627 },
            textDim: { r: 0.333, g: 0.333, b: 0.408 },
        };
        // ── Helper: create rectangle ──
        // color must be {r,g,b} only. Pass opacity (0-1) separately.
        function makeRect(x, y, w, h, color, radius = 0, opacity = 1) {
            var rect = figma.createRectangle();
            rect.x = x;
            rect.y = y;
            rect.resize(w > 0 ? w : 1, h > 0 ? h : 1);
            rect.fills = [{ type: "SOLID", color: { r: color.r, g: color.g, b: color.b }, opacity: opacity }];
            if (radius)
                rect.cornerRadius = radius;
            return rect;
        }
        // ── Helper: create text ──
        function makeText(content, x, y, size, weight, color, maxW = null) {
            var t = figma.createText();
            t.fontName = { family: "Inter", style: weight };
            t.fontSize = size;
            t.characters = String(content);
            t.fills = [{ type: "SOLID", color: { r: color.r, g: color.g, b: color.b } }];
            if (maxW) {
                t.textAutoResize = "HEIGHT";
                t.resize(maxW, 1);
            }
            else {
                t.textAutoResize = "WIDTH_AND_HEIGHT";
            }
            t.x = x;
            t.y = y;
            return t;
        }
        // ── Helper: thumbnail ──
        async function makeThumbnail(proto, x, y, w, h) {
            const group = [];
            // bg
            const bg = makeRect(x, y, w, h, C.surface2, options.layout === "grid" ? 8 : 6);
            group.push(bg);
            // Try to get actual thumbnail from the prototype node
            try {
                const protoNode = figma.getNodeById(proto.id);
                if (protoNode && (protoNode.type === "FRAME" || protoNode.type === "COMPONENT")) {
                    // Export the node as an image
                    const imageBytes = await protoNode.exportAsync({
                        format: "PNG",
                        constraint: { type: "SCALE", value: 0.25 } // Lower resolution for performance
                    });
                    // Create image fill
                    const image = figma.createImage(imageBytes);
                    const aspectRatio = proto.width > 0 ? proto.height / proto.width : 1.5;
                    const clampedRatio = Math.min(Math.max(aspectRatio, 0.5), 2.5);
                    const innerPad = options.layout === "grid" ? 16 : 8;
                    const innerW = w - innerPad * 2;
                    const innerH = Math.min(h - innerPad * 2, innerW * clampedRatio);
                    const innerX = x + innerPad;
                    const innerY = y + (h - innerH) / 2;
                    const imageRect = makeRect(innerX, innerY, innerW, innerH, C.surface, 4);
                    imageRect.fills = [{
                            type: "IMAGE",
                            imageHash: image.hash,
                            scaleMode: "FIT"
                        }];
                    imageRect.strokes = [{ type: "SOLID", color: C.border }];
                    imageRect.strokeWeight = 1;
                    group.push(imageRect);
                }
            }
            catch (err) {
                console.log("Could not generate thumbnail for:", proto.name, err);
                // Fallback to simple frame representation
                const aspectRatio = proto.width > 0 ? proto.height / proto.width : 1.5;
                const clampedRatio = Math.min(Math.max(aspectRatio, 0.5), 2.5);
                const innerPad = options.layout === "grid" ? 16 : 8;
                const innerW = w - innerPad * 2;
                const innerH = Math.min(h - innerPad * 2, innerW * clampedRatio);
                const innerX = x + innerPad;
                const innerY = y + (h - innerH) / 2;
                const frame = makeRect(innerX, innerY, innerW, innerH, C.surface, 4);
                frame.strokes = [{ type: "SOLID", color: C.border }];
                frame.strokeWeight = 1;
                group.push(frame);
            }
            return group;
        }
        // ── Helper: prototype card ──
        // Returns a single frame node (so we can attach OPEN_URL reaction to it)
        async function makeCard(proto, x, y, index) {
            const cardNum = String(index + 1).padStart(2, "0");
            // Create a frame as the card container
            var cardFrame = figma.createFrame();
            cardFrame.x = x;
            cardFrame.y = y;
            cardFrame.clipsContent = false;
            cardFrame.name = "Card #" + cardNum; // Name the card for identification
            if (options.layout === "grid") {
                // ── GRID CARD ──
                // Set up auto-layout for the card to hug content
                cardFrame.layoutMode = "VERTICAL";
                cardFrame.resize(CARD_WIDTH, 1); // Start with minimal height
                cardFrame.fills = [{ type: "SOLID", color: C.surface }];
                cardFrame.strokes = [{ type: "SOLID", color: C.border }];
                cardFrame.strokeWeight = 1;
                cardFrame.cornerRadius = 10;
                cardFrame.primaryAxisSizingMode = "AUTO"; // Hug height
                cardFrame.counterAxisSizingMode = "FIXED"; // Fixed width
                cardFrame.itemSpacing = 0;
                cardFrame.paddingTop = 0;
                cardFrame.paddingBottom = 0;
                cardFrame.paddingLeft = 0;
                cardFrame.paddingRight = 0;
                // Create a container for the thumbnail
                var thumbContainer = figma.createFrame();
                thumbContainer.name = "Thumbnail Container";
                thumbContainer.resize(CARD_WIDTH, THUMB_H);
                thumbContainer.fills = [];
                thumbContainer.clipsContent = true;
                cardFrame.appendChild(thumbContainer);
                // Thumbnail nodes — coords relative to container (0,0)
                var thumbNodesGrid = await makeThumbnail(proto, 0, 0, CARD_WIDTH, THUMB_H);
                for (var ti = 0; ti < thumbNodesGrid.length; ti++)
                    thumbContainer.appendChild(thumbNodesGrid[ti]);
                // Set layout properties after appending
                thumbContainer.layoutSizingHorizontal = "FILL";
                thumbContainer.layoutSizingVertical = "FIXED";
                const infoPad = 12;
                // Create an autolayout frame for text content
                var textContainer = figma.createFrame();
                textContainer.name = "Text Content";
                textContainer.layoutMode = "VERTICAL";
                textContainer.resize(CARD_WIDTH, 1); // Match card width
                textContainer.fills = [];
                textContainer.primaryAxisSizingMode = "AUTO";
                textContainer.counterAxisSizingMode = "FIXED";
                textContainer.itemSpacing = 4;
                textContainer.paddingTop = 10;
                textContainer.paddingBottom = 12;
                textContainer.paddingLeft = infoPad;
                textContainer.paddingRight = infoPad;
                textContainer.clipsContent = false;
                // Index number
                var numT = makeText("#" + cardNum, 0, 0, 9, "Medium", C.textDim);
                textContainer.appendChild(numT);
                numT.layoutSizingHorizontal = "HUG";
                numT.layoutSizingVertical = "HUG";
                // Flow name as primary title
                var nameT = makeText(proto.flowName, 0, 0, 12, "Semi Bold", C.text, CARD_WIDTH - infoPad * 2);
                textContainer.appendChild(nameT);
                nameT.layoutSizingHorizontal = "FIXED";
                nameT.layoutSizingVertical = "HUG";
                // Frame name as subtitle (if different)
                if (proto.flowName !== proto.name) {
                    var frameSubT = makeText(proto.name, 0, 0, 9, "Regular", C.textDim, CARD_WIDTH - infoPad * 2);
                    textContainer.appendChild(frameSubT);
                    frameSubT.layoutSizingHorizontal = "FIXED";
                    frameSubT.layoutSizingVertical = "HUG";
                }
                // URL or helpful message
                if (proto.prototypeUrl) {
                    var urlT = makeText(proto.prototypeUrl, 0, 0, 7, "Regular", C.accent, CARD_WIDTH - infoPad * 2);
                    textContainer.appendChild(urlT);
                    urlT.layoutSizingHorizontal = "FIXED";
                    urlT.layoutSizingVertical = "HUG";
                }
                else {
                    var helpT = makeText("Save file to cloud to get shareable URL", 0, 0, 7, "Regular", C.textDim, CARD_WIDTH - infoPad * 2);
                    textContainer.appendChild(helpT);
                    helpT.layoutSizingHorizontal = "FIXED";
                    helpT.layoutSizingVertical = "HUG";
                }
                cardFrame.appendChild(textContainer);
                // Set layout sizing after appending to parent
                textContainer.layoutSizingHorizontal = "FILL";
                textContainer.layoutSizingVertical = "HUG";
            }
            else {
                // ── LIST CARD ──
                cardFrame.resize(CARD_WIDTH, CARD_H);
                cardFrame.fills = [{ type: "SOLID", color: C.surface }];
                cardFrame.strokes = [{ type: "SOLID", color: C.border }];
                cardFrame.strokeWeight = 1;
                cardFrame.cornerRadius = 8;
                // Left accent bar
                var bar = makeRect(0, 8, 3, CARD_H - 16, C.accent, 2);
                cardFrame.appendChild(bar);
                // Thumbnail on left — relative coords (0,0)
                var thumbNodesList = await makeThumbnail(proto, 0, 0, THUMB_W, THUMB_H);
                for (var ti = 0; ti < thumbNodesList.length; ti++)
                    cardFrame.appendChild(thumbNodesList[ti]);
                var textXrel = THUMB_W + 16;
                var centerYrel = CARD_H / 2;
                // Create an autolayout frame for text content
                var textContainer = figma.createFrame();
                textContainer.name = "Text Content";
                textContainer.x = textXrel;
                textContainer.y = centerYrel - 32;
                textContainer.layoutMode = "VERTICAL";
                textContainer.resize(CARD_WIDTH - THUMB_W - 32 - 120, 1); // Start with minimal height
                textContainer.fills = [];
                textContainer.primaryAxisSizingMode = "AUTO";
                textContainer.counterAxisSizingMode = "FIXED";
                textContainer.itemSpacing = 4;
                textContainer.paddingTop = 0;
                textContainer.paddingBottom = 0;
                textContainer.paddingLeft = 0;
                textContainer.paddingRight = 0;
                textContainer.clipsContent = false;
                // Index number
                var numT = makeText("#" + cardNum, 0, 0, 9, "Medium", C.textDim);
                textContainer.appendChild(numT);
                numT.layoutSizingHorizontal = "HUG";
                numT.layoutSizingVertical = "HUG";
                // Flow name as primary title
                var nameT = makeText(proto.flowName, 0, 0, 14, "Semi Bold", C.text, CARD_WIDTH - THUMB_W - 32 - 120);
                textContainer.appendChild(nameT);
                nameT.layoutSizingHorizontal = "FIXED";
                nameT.layoutSizingVertical = "HUG";
                // Frame name as subtitle (if different)
                if (proto.flowName !== proto.name) {
                    var frameSubT = makeText(proto.name, 0, 0, 9, "Regular", C.textDim, CARD_WIDTH - THUMB_W - 32 - 120);
                    textContainer.appendChild(frameSubT);
                    frameSubT.layoutSizingHorizontal = "FIXED";
                    frameSubT.layoutSizingVertical = "HUG";
                }
                // URL or helpful message
                if (proto.prototypeUrl) {
                    var urlT = makeText(proto.prototypeUrl, 0, 0, 7, "Regular", C.accent, CARD_WIDTH - THUMB_W - 32 - 120);
                    textContainer.appendChild(urlT);
                    urlT.layoutSizingHorizontal = "FIXED";
                    urlT.layoutSizingVertical = "HUG";
                }
                else {
                    var helpT = makeText("Save file to cloud to get shareable URL", 0, 0, 7, "Regular", C.textDim, CARD_WIDTH - THUMB_W - 32 - 120);
                    textContainer.appendChild(helpT);
                    helpT.layoutSizingHorizontal = "FIXED";
                    helpT.layoutSizingVertical = "HUG";
                }
                cardFrame.appendChild(textContainer);
                // Date — positioned from right edge
                var dateT = makeText(dateStr, 0, centerYrel - 4, 9, "Regular", C.textDim);
                dateT.x = CARD_WIDTH - dateT.width - 16;
                cardFrame.appendChild(dateT);
            }
            // ── Prototype link ──
            // Use NODE action for in-document navigation to prototype starting points.
            // NODE action with NAVIGATE navigation type works across pages and properly scrolls viewport to the target frame.
            // This enables clickable cards that navigate within Figma (both desktop and web).
            if (proto.id) {
                try {
                    // Verify the destination node exists and is a valid frame/component
                    const destinationNode = figma.getNodeById(proto.id);
                    if (destinationNode && (destinationNode.type === "FRAME" || destinationNode.type === "COMPONENT")) {
                        await cardFrame.setReactionsAsync([{
                                "action": {
                                    "type": "NODE",
                                    "destinationId": proto.id,
                                    "navigation": "NAVIGATE",
                                    "transition": null,
                                    "preserveScrollPosition": false
                                },
                                "actions": [{
                                        "type": "NODE",
                                        "destinationId": proto.id,
                                        "navigation": "NAVIGATE",
                                        "transition": null,
                                        "preserveScrollPosition": false
                                    }],
                                "trigger": { "type": "ON_CLICK" }
                            }]);
                        console.log("✓ Reaction set for card:", proto.name);
                    }
                    else {
                        var nodeType = destinationNode ? destinationNode.type : "null";
                        console.log("✗ Invalid destination node for:", proto.name, "type:", nodeType);
                    }
                }
                catch (err) {
                    // Log error but don't fail the entire generation
                    console.log("✗ Could not set reaction for card:", proto.name);
                    console.log("Error details:", err);
                }
            }
            return cardFrame;
        }
        // ─────────────────────────
        // CALCULATE TOTAL HEIGHT
        // ─────────────────────────
        let totalH = PADDING * 2 + 100; // header
        for (const pageName of pageNames) {
            const items = pageGroups[pageName];
            totalH += PAGE_HEADER_H + PAGE_GAP;
            if (options.layout === "grid") {
                const rows = Math.ceil(items.length / COLS);
                totalH += rows * CARD_H + (rows - 1) * GAP_Y + PAGE_GAP;
            }
            else {
                totalH += items.length * (CARD_H + GAP_Y) + PAGE_GAP;
            }
        }
        // ─────────────────────────
        // CONDITIONAL PAGE SELECTION
        // ─────────────────────────
        // Default dedicatedPage to false for backward compatibility
        const dedicatedPage = options.dedicatedPage !== undefined ? options.dedicatedPage : false;
        let targetPage;
        if (dedicatedPage) {
            // Dedicated page mode: create or find the dedicated page
            targetPage = findOrCreateIndexPage();
        }
        else {
            // First page mode: use the first page in the document
            // Check if first page exists
            if (!figma.root.children || figma.root.children.length === 0 || !figma.root.children[0]) {
                const errorMsg = "Error: First page is undefined. Cannot generate frame index.";
                console.error(errorMsg);
                figma.ui.postMessage({ type: "FRAME_ERROR", error: errorMsg });
                throw new Error(errorMsg);
            }
            targetPage = figma.root.children[0];
            // Remove old index frames from first page
            removeOldIndexFrames(targetPage);
        }
        // ─────────────────────────
        // CREATE MAIN FRAME
        // ─────────────────────────
        const mainFrame = figma.createFrame();
        mainFrame.name = "Prototype Index";
        mainFrame.resize(FRAME_WIDTH, Math.max(totalH, 600));
        mainFrame.fills = [{ type: "SOLID", color: C.bg }];
        // ─────────────────────────
        // CONDITIONAL POSITIONING
        // ─────────────────────────
        if (dedicatedPage) {
            // Dedicated page mode: position at origin
            mainFrame.x = 0;
            mainFrame.y = 0;
        }
        else {
            // First page mode: position below cover frame
            const position = calculateIndexPosition(targetPage, mainFrame.height);
            mainFrame.x = position.x;
            mainFrame.y = position.y;
        }
        mainFrame.clipsContent = false;
        const allNodes = [];
        // ─────────────────────────
        // HEADER
        // ─────────────────────────
        const headerBg = makeRect(0, 0, FRAME_WIDTH, 96, C.surface);
        headerBg.strokes = [{ type: "SOLID", color: C.border }];
        headerBg.strokeWeight = 1;
        headerBg.strokeAlign = "INSIDE";
        allNodes.push(headerBg);
        // Accent line top
        const accentLine = makeRect(0, 0, FRAME_WIDTH, 3, C.accent);
        allNodes.push(accentLine);
        // Title
        const title = makeText("Prototype Index", PADDING, 24, 28, "Bold", C.text);
        allNodes.push(title);
        // File name
        const fileNameT = makeText(figma.root.name, PADDING + title.width + 16, 32, 13, "Regular", C.textMuted);
        allNodes.push(fileNameT);
        // Stats row
        const statsY = 60;
        const statItems = [
            { label: "prototipos", value: String(totalPrototypes) },
            { label: "páginas", value: String(pageNames.length) },
            { label: "generado", value: dateStr + " · " + timeStr },
        ];
        let statX = PADDING;
        for (const stat of statItems) {
            const val = makeText(stat.value, statX, statsY, 11, "Semi Bold", C.textMuted);
            allNodes.push(val);
            const lbl = makeText(" " + stat.label, statX + val.width, statsY + 1, 10, "Regular", C.textDim);
            allNodes.push(lbl);
            statX += val.width + lbl.width + 28;
            if (stat !== statItems[statItems.length - 1]) {
                const sep = makeText("·", statX - 14, statsY, 11, "Regular", C.border);
                allNodes.push(sep);
            }
        }
        // ─────────────────────────
        // PAGE SECTIONS
        // ─────────────────────────
        let curY = 96 + 40;
        for (let pi = 0; pi < pageNames.length; pi++) {
            const pageName = pageNames[pi];
            const items = pageGroups[pageName];
            // ── Page header ──
            // Pill background
            const pillW = 220;
            const pill = makeRect(PADDING, curY, pillW, 30, C.accent, 6, 0.12);
            allNodes.push(pill);
            // Page index
            const pageNumT = makeText("P" + String(pi + 1).padStart(2, "0"), PADDING + 10, curY + 8, 9, "Bold", C.accent);
            allNodes.push(pageNumT);
            // Page name
            const pageNameT = makeText(pageName, PADDING + 36, curY + 8, 12, "Semi Bold", C.text);
            allNodes.push(pageNameT);
            // Count badge
            const countBadgeX = PADDING + pillW + 10;
            const countT = makeText(items.length + " prototipo" + (items.length !== 1 ? "s" : ""), countBadgeX, curY + 9, 9, "Medium", C.textDim);
            allNodes.push(countT);
            // Divider line
            const divX = countBadgeX + countT.width + 16;
            const div = makeRect(divX, curY + 14, FRAME_WIDTH - PADDING - divX, 1, C.border);
            allNodes.push(div);
            curY += PAGE_HEADER_H;
            // ── Cards ──
            if (options.layout === "grid") {
                let col = 0;
                let row = 0;
                for (let i = 0; i < items.length; i++) {
                    const p = items[i];
                    col = i % COLS;
                    row = Math.floor(i / COLS);
                    const cardX = PADDING + col * (CARD_WIDTH + GAP_X);
                    const cardY = curY + row * (CARD_H + GAP_Y);
                    var cardFrame = await makeCard(p, cardX, cardY, i);
                    allNodes.push(cardFrame);
                }
                const rows = Math.ceil(items.length / COLS);
                curY += rows * (CARD_H + GAP_Y) + PAGE_GAP;
            }
            else {
                for (let i = 0; i < items.length; i++) {
                    const p = items[i];
                    var cardFrame = await makeCard(p, PADDING, curY, i);
                    allNodes.push(cardFrame);
                    curY += CARD_H + GAP_Y;
                }
                curY += PAGE_GAP;
            }
        }
        // ─────────────────────────
        // FOOTER
        // ─────────────────────────
        const footerY = mainFrame.height - 40;
        const footerLine = makeRect(PADDING, footerY, FRAME_WIDTH - PADDING * 2, 1, C.border);
        allNodes.push(footerLine);
        const footerT = makeText("Prototype Index · Generado el " + dateStr + " a las " + timeStr + " · " + figma.root.name, PADDING, footerY + 10, 9, "Regular", C.textDim, FRAME_WIDTH - PADDING * 2);
        allNodes.push(footerT);
        // ─────────────────────────
        // ─────────────────────────
        // APPEND NODES
        // Cards with reactions CAN be nested inside mainFrame.
        // The destinations (prototype starting points) are top-level frames, which is correct.
        // ─────────────────────────
        for (var ni = 0; ni < allNodes.length; ni++) {
            mainFrame.appendChild(allNodes[ni]);
        }
        // Add mainFrame to the target page
        targetPage.appendChild(mainFrame);
        // IMPORTANT: Switch to the target page BEFORE selecting nodes on it
        figma.currentPage = targetPage;
        // Now we can safely scroll and select the main frame
        figma.viewport.scrollAndZoomIntoView([mainFrame]);
        targetPage.selection = [mainFrame];
        return {
            frameId: mainFrame.id,
            pageName: targetPage.name,
            totalCards: totalPrototypes,
        };
    }
    catch (err) {
        // Handle frame generation failures
        const errorMsg = err.message || String(err);
        console.error("Frame generation failed:", errorMsg);
        // Clean up partial frames on error
        try {
            // Determine which page to clean up based on dedicatedPage option
            const dedicatedPage = options.dedicatedPage !== undefined ? options.dedicatedPage : false;
            let cleanupPage;
            if (dedicatedPage) {
                // Try to find the dedicated page for cleanup
                const INDEX_PAGE_NAME = "📋 Prototype Index";
                for (const page of figma.root.children) {
                    if (page.name === INDEX_PAGE_NAME) {
                        cleanupPage = page;
                        break;
                    }
                }
            }
            else {
                // Use first page for cleanup
                cleanupPage = figma.root.children[0];
            }
            if (cleanupPage) {
                // Remove any partially created "Prototype Index" frames
                for (let i = cleanupPage.children.length - 1; i >= 0; i--) {
                    const child = cleanupPage.children[i];
                    if (child.name === "Prototype Index") {
                        child.remove();
                    }
                }
            }
        }
        catch (cleanupErr) {
            console.error("Error during cleanup:", cleanupErr);
        }
        // Display error message to user
        figma.ui.postMessage({
            type: "FRAME_ERROR",
            error: "Failed to generate frame index: " + errorMsg
        });
        throw err;
    }
}
// ─────────────────────────────────────────────
// DEDICATED PAGE MANAGEMENT
// ─────────────────────────────────────────────
function findOrCreateIndexPage() {
    const INDEX_PAGE_NAME = "📋 Prototype Index";
    // Search for existing index page
    for (const page of figma.root.children) {
        if (page.name === INDEX_PAGE_NAME) {
            return page;
        }
    }
    // Create new index page
    const indexPage = figma.createPage();
    indexPage.name = INDEX_PAGE_NAME;
    return indexPage;
}
// ─────────────────────────────────────────────
// WATCHER
// ─────────────────────────────────────────────
function startWatcher() {
    if (watcherInterval)
        return;
    isWatching = true;
    const checkForChanges = () => {
        if (!isWatching)
            return;
        try {
            const prototypes = getAllPrototypes();
            const snapshot = createSnapshot(prototypes);
            if (snapshot !== lastSnapshot && lastSnapshot !== "") {
                lastSnapshot = snapshot;
                figma.ui.postMessage({ type: "PROTOTYPES_UPDATED", prototypes, timestamp: Date.now() });
            }
            else if (lastSnapshot === "") {
                lastSnapshot = snapshot;
            }
        }
        catch (e) { }
    };
    watcherInterval = setInterval(checkForChanges, 2000);
}
function stopWatcher() {
    if (watcherInterval) {
        clearInterval(watcherInterval);
        watcherInterval = null;
    }
    isWatching = false;
}
// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
figma.showUI(__html__, { width: 440, height: 640, title: "Prototype Index" });
// ─────────────────────────────────────────────
// SETTINGS STORAGE
// ─────────────────────────────────────────────
/**
 * Validates language code to ensure only 'es' or 'en' are accepted
 * @param {string} code - The language code to validate
 * @returns {'es' | 'en'} Valid language code, defaults to 'es' if invalid
 */
function validateLanguageCode(code) {
    if (code === 'es' || code === 'en') {
        return code;
    }
    console.warn(`Invalid language code: ${code}, falling back to Spanish`);
    return 'es';
}
/**
 * Loads language setting from clientStorage
 * @returns {Promise<'es' | 'en'>} The saved language code, defaults to 'es' on error
 */
async function loadLanguageSetting() {
    try {
        const saved = await figma.clientStorage.getAsync('language');
        return validateLanguageCode(saved);
    }
    catch (err) {
        console.error('Failed to load language setting:', err);
        return 'es'; // Default fallback
    }
}
/**
 * Saves language setting to clientStorage
 * @param {string} lang - The language code to save ('es' or 'en')
 */
async function saveLanguageSetting(lang) {
    try {
        await figma.clientStorage.setAsync('language', lang);
    }
    catch (err) {
        console.error('Failed to save language setting:', err);
        // Continue with in-memory state
        figma.ui.postMessage({
            type: 'SETTING_ERROR',
            error: 'Could not save language preference'
        });
    }
}
// Load settings on startup
async function loadSettings() {
    try {
        const dedicatedPage = await figma.clientStorage.getAsync('dedicatedPage');
        const language = await loadLanguageSetting();
        const settings = {
            dedicatedPage: dedicatedPage !== undefined ? dedicatedPage : false,
            language: language
        };
        figma.ui.postMessage({ type: "SETTINGS_LOADED", settings });
    }
    catch (err) {
        console.error("Failed to load settings:", err);
        // Send default settings on error
        figma.ui.postMessage({
            type: "SETTINGS_LOADED",
            settings: { dedicatedPage: false, language: 'es' }
        });
    }
}
// Initialize settings
loadSettings();
const initialPrototypes = getAllPrototypes();
lastSnapshot = createSnapshot(initialPrototypes);
// Generate and send thumbnails
generateThumbnailsForPrototypes(initialPrototypes).then((thumbnails) => {
    figma.ui.postMessage({
        type: "INITIAL_DATA",
        prototypes: initialPrototypes,
        thumbnails: thumbnails,
        fileKey: figma.fileKey || null,
        fileName: figma.root.name,
        timestamp: Date.now(),
    });
});
// ─────────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────────
figma.ui.onmessage = async (msg) => {
    switch (msg.type) {
        case "REFRESH": {
            const prototypes = getAllPrototypes();
            lastSnapshot = createSnapshot(prototypes);
            generateThumbnailsForPrototypes(prototypes).then((thumbnails) => {
                figma.ui.postMessage({ type: "PROTOTYPES_DATA", prototypes, thumbnails, timestamp: Date.now() });
            });
            break;
        }
        case "GENERATE_FRAME": {
            figma.ui.postMessage({ type: "GENERATING" });
            try {
                const prototypes = getAllPrototypes();
                const result = await generateIndexFrame(prototypes, msg.options || { layout: "list", showUrls: true });
                figma.ui.postMessage(Object.assign({ type: "FRAME_GENERATED" }, result));
            }
            catch (err) {
                figma.ui.postMessage({ type: "FRAME_ERROR", error: err.message || String(err) });
            }
            break;
        }
        case "START_WATCHER":
            startWatcher();
            figma.ui.postMessage({ type: "WATCHER_STARTED" });
            break;
        case "STOP_WATCHER":
            stopWatcher();
            figma.ui.postMessage({ type: "WATCHER_STOPPED" });
            break;
        case "NAVIGATE_TO": {
            const node = figma.getNodeById(msg.nodeId);
            if (node && node.parent && node.parent.type === 'PAGE') {
                figma.currentPage = node.parent;
                figma.viewport.scrollAndZoomIntoView([node]);
                figma.currentPage.selection = [node];
            }
            break;
        }
        case "SAVE_SETTING": {
            try {
                // Special handling for language setting with validation
                if (msg.key === 'language') {
                    const validatedLang = validateLanguageCode(msg.value);
                    await saveLanguageSetting(validatedLang);
                }
                else {
                    await figma.clientStorage.setAsync(msg.key, msg.value);
                }
                figma.ui.postMessage({ type: "SETTING_SAVED", key: msg.key });
            }
            catch (err) {
                console.error("Failed to save setting:", err);
                figma.ui.postMessage({ type: "SETTING_ERROR", error: "Could not save setting" });
            }
            break;
        }
        case "LOAD_SETTINGS": {
            try {
                const dedicatedPage = await figma.clientStorage.getAsync('dedicatedPage');
                const language = await loadLanguageSetting();
                const settings = {
                    dedicatedPage: dedicatedPage !== undefined ? dedicatedPage : false,
                    language: language
                };
                figma.ui.postMessage({ type: "SETTINGS_LOADED", settings });
            }
            catch (err) {
                console.error("Failed to load settings:", err);
                // Send default settings on error
                figma.ui.postMessage({
                    type: "SETTINGS_LOADED",
                    settings: { dedicatedPage: false, language: 'es' }
                });
            }
            break;
        }
        case "CLOSE":
            stopWatcher();
            figma.closePlugin();
            break;
    }
};
figma.on("close", () => stopWatcher());
