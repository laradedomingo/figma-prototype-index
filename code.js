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
  if (!node.children) return count;
  for (const child of node.children) {
    if (child.reactions) count += child.reactions.length;
    count += countChildReactions(child);
  }
  return count;
}

// ─────────────────────────────────────────────
// SCAN ONLY STARTING POINTS ACROSS ALL PAGES
// The correct Figma API is page.flowStartingPoints:
// an array of { name, nodeId } stored at the PAGE level.
// ─────────────────────────────────────────────

function getAllPrototypes() {
  var allPrototypes = [];

  // Debug: Check if fileKey is available
  console.log("=== URL Debug Info ===");
  console.log("figma.fileKey:", figma.fileKey);
  console.log("figma.root.name:", figma.root.name);

  for (var pi = 0; pi < figma.root.children.length; pi++) {
    var page = figma.root.children[pi];
    if (page.name === "📋 Prototype Index") continue;

    var flows = page.flowStartingPoints;
    if (!flows || flows.length === 0) continue;

    for (var fi = 0; fi < flows.length; fi++) {
      var flow = flows[fi];
      var node = figma.getNodeById(flow.nodeId);
      if (!node) continue;

      var flowName = flow.name || node.name;
      var fileKey  = figma.fileKey;

      var nodeIdEncoded = encodeURIComponent(node.id);
      var pageIdEncoded = encodeURIComponent(page.id);
      var prototypeUrl  = fileKey
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

      allPrototypes.push({
        id:            node.id,
        name:          node.name,
        flowName:      flowName,
        type:          node.type,
        width:         Math.round(node.width),
        height:        Math.round(node.height),
        x:             Math.round(node.x),
        y:             Math.round(node.y),
        pageName:      page.name,
        pageId:        page.id,
        reactionsCount: (node.reactions ? node.reactions.length : 0) +
                        countChildReactions(node),
        prototypeUrl:  prototypeUrl,
        lastChecked:   Date.now(),
      });
    }
  }

  console.log("=== Total prototypes found:", allPrototypes.length, "===");
  return allPrototypes;
}

function createSnapshot(prototypes) {
  return JSON.stringify(
    prototypes.map((p) => ({
      id: p.id,
      name: p.name,
      flowName: p.flowName,
      pageName: p.pageName,
    }))
  );
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
  await loadFonts();

  // Group by page
  const pageGroups = {};
  for (const p of prototypes) {
    if (!pageGroups[p.pageName]) pageGroups[p.pageName] = [];
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
  const FRAME_WIDTH = 1200;
  const CARD_WIDTH = options.layout === "grid" ? 340 : FRAME_WIDTH - PADDING * 2;
  const CARD_H = options.layout === "grid" ? 200 : 80;
  const THUMB_W = options.layout === "grid" ? CARD_WIDTH : 80;
  const THUMB_H = options.layout === "grid" ? 120 : CARD_H;
  const COLS = options.layout === "grid" ? 3 : 1;
  const GAP_X = options.layout === "grid" ? 20 : 0;
  const GAP_Y = options.layout === "grid" ? 16 : 8;
  const PAGE_HEADER_H = 56;
  const PAGE_GAP = 40;

  // Colors — color objects must only have {r,g,b}, opacity is separate
  const C = {
    bg:       { r: 0.063, g: 0.063, b: 0.071 },
    surface:  { r: 0.086, g: 0.086, b: 0.098 },
    surface2: { r: 0.118, g: 0.118, b: 0.133 },
    border:   { r: 0.165, g: 0.165, b: 0.184 },
    accent:   { r: 0.482, g: 0.416, b: 0.969 },
    green:    { r: 0.243, g: 0.812, b: 0.553 },
    white:    { r: 1, g: 1, b: 1 },
    text:     { r: 0.941, g: 0.941, b: 0.953 },
    textMuted:{ r: 0.533, g: 0.533, b: 0.627 },
    textDim:  { r: 0.333, g: 0.333, b: 0.408 },
  };

  // ── Helper: create rectangle ──
  // color must be {r,g,b} only. Pass opacity (0-1) separately.
  function makeRect(x, y, w, h, color, radius, opacity) {
    var rect = figma.createRectangle();
    rect.x = x; rect.y = y;
    rect.resize(w > 0 ? w : 1, h > 0 ? h : 1);
    var fillOpacity = (opacity !== undefined) ? opacity : 1;
    rect.fills = [{ type: "SOLID", color: { r: color.r, g: color.g, b: color.b }, opacity: fillOpacity }];
    if (radius) rect.cornerRadius = radius;
    return rect;
  }

  // ── Helper: create text ──
  function makeText(content, x, y, size, weight, color, maxW) {
    var t = figma.createText();
    t.fontName = { family: "Inter", style: weight };
    t.fontSize = size;
    t.characters = String(content);
    t.fills = [{ type: "SOLID", color: { r: color.r, g: color.g, b: color.b } }];
    if (maxW) {
      t.textAutoResize = "HEIGHT";
      t.resize(maxW, 40);
    } else {
      t.textAutoResize = "WIDTH_AND_HEIGHT";
    }
    t.x = x; t.y = y;
    return t;
  }

  // ── Helper: thumbnail mockup ──
  function makeThumbnail(proto, x, y, w, h) {
    const group = [];
    // bg
    const bg = makeRect(x, y, w, h, C.surface2, options.layout === "grid" ? 8 : 6);
    group.push(bg);

    // inner proportional frame
    const aspectRatio = proto.width > 0 ? proto.height / proto.width : 1.5;
    const clampedRatio = Math.min(Math.max(aspectRatio, 0.5), 2.5);
    const innerPad = options.layout === "grid" ? 16 : 8;
    const innerW = w - innerPad * 2;
    const innerH = Math.min(h - innerPad * 2, innerW * clampedRatio);
    const innerX = x + innerPad;
    const innerY = y + (h - innerH) / 2;

    const frame = makeRect(innerX, innerY, innerW, innerH, C.surface, 4);
    group.push(frame);

    // border on inner frame
    frame.strokes = [{ type: "SOLID", color: C.border }];
    frame.strokeWeight = 1;

    // fake content lines
    const lineY = innerY + (options.layout === "grid" ? 10 : 8);
    const lineH = options.layout === "grid" ? 4 : 3;
    const lineGap = options.layout === "grid" ? 7 : 5;
    const lineX = innerX + (options.layout === "grid" ? 8 : 5);
    const lineWidths = [0.65, 0.45, 0.55, 0.35, 0.50];

    for (let i = 0; i < Math.min(lineWidths.length, Math.floor((innerH - 16) / (lineH + lineGap))); i++) {
      const line = makeRect(lineX, lineY + i * (lineH + lineGap), (innerW - 16) * lineWidths[i], lineH, C.border, 2);
      group.push(line);
    }

    // SP badge — all items are starting points, show flow name
    const badgePad = 4;
    const badge = makeRect(x + w - 28 - badgePad, y + badgePad, 28, 14, C.accent, 3, 0.12);
    group.push(badge);
    const badgeT = makeText("SP", x + w - 24 - badgePad, y + badgePad + 1, 7, "Bold", C.accent);
    group.push(badgeT);

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
      cardFrame.resize(CARD_WIDTH, CARD_H);
      cardFrame.fills = [{ type: "SOLID", color: C.surface }];
      cardFrame.strokes = [{ type: "SOLID", color: C.border }];
      cardFrame.strokeWeight = 1;
      cardFrame.cornerRadius = 10;

      // Left accent bar
      var bar = makeRect(0, 10, 3, CARD_H - 20, C.accent, 2);
      cardFrame.appendChild(bar);

      // Thumbnail top area — coords relative to card (0,0)
      var thumbNodesGrid = makeThumbnail(proto, 0, 0, CARD_WIDTH, THUMB_H);
      for (var ti = 0; ti < thumbNodesGrid.length; ti++) cardFrame.appendChild(thumbNodesGrid[ti]);

      const infoPad = 12;
      var infoYrel = THUMB_H + 10; // relative to card

      // Index number
      var numT = makeText("#" + cardNum, infoPad, infoYrel, 9, "Medium", C.textDim);
      cardFrame.appendChild(numT);

      // Flow name as primary title
      var nameT = makeText(proto.flowName, infoPad, infoYrel + 14, 12, "Semi Bold", C.text, CARD_WIDTH - infoPad * 2);
      cardFrame.appendChild(nameT);

      // Frame name as subtitle (if different)
      var flowLabelYrel = infoYrel + 30;
      if (proto.flowName !== proto.name) {
        var frameSubT = makeText(proto.name, infoPad, infoYrel + 30, 9, "Regular", C.textDim, CARD_WIDTH - infoPad * 2);
        cardFrame.appendChild(frameSubT);
        flowLabelYrel = infoYrel + 44;
      }

      // Size tag
      var sizeT = makeText(proto.width + "×" + proto.height, infoPad, flowLabelYrel + 4, 9, "Regular", C.textDim);
      cardFrame.appendChild(sizeT);

      // URL or helpful message
      if (proto.prototypeUrl) {
        var urlT = makeText(proto.prototypeUrl, infoPad, flowLabelYrel + 18, 7, "Regular", C.accent, CARD_WIDTH - infoPad * 2);
        cardFrame.appendChild(urlT);
      } else {
        var helpT = makeText("Save file to cloud to get shareable URL", infoPad, flowLabelYrel + 18, 7, "Regular", C.textDim, CARD_WIDTH - infoPad * 2);
        cardFrame.appendChild(helpT);
      }
    } else {
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
      var thumbNodesList = makeThumbnail(proto, 0, 0, THUMB_W, THUMB_H);
      for (var ti = 0; ti < thumbNodesList.length; ti++) cardFrame.appendChild(thumbNodesList[ti]);

      var textXrel = THUMB_W + 16;
      var centerYrel = CARD_H / 2;

      // Index number
      var numT = makeText("#" + cardNum, textXrel, centerYrel - 32, 9, "Medium", C.textDim);
      cardFrame.appendChild(numT);

      // Flow name as primary title
      var nameT = makeText(proto.flowName, textXrel, centerYrel - 20, 14, "Semi Bold", C.text, CARD_WIDTH - THUMB_W - 32);
      cardFrame.appendChild(nameT);

      // Frame name as subtitle (if different)
      if (proto.flowName !== proto.name) {
        var frameSubT = makeText(proto.name, textXrel, centerYrel - 4, 9, "Regular", C.textDim, CARD_WIDTH - THUMB_W - 120);
        cardFrame.appendChild(frameSubT);
      }

      // URL or helpful message (moved up to replace size)
      if (proto.prototypeUrl) {
        var urlT = makeText(proto.prototypeUrl, textXrel, centerYrel + 10, 7, "Regular", C.accent, CARD_WIDTH - THUMB_W - 32 - 100);
        cardFrame.appendChild(urlT);
      } else {
        var helpT = makeText("Save file to cloud to get shareable URL", textXrel, centerYrel + 10, 7, "Regular", C.textDim, CARD_WIDTH - THUMB_W - 32 - 100);
        cardFrame.appendChild(helpT);
      }

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
        } else {
          var nodeType = destinationNode ? destinationNode.type : "null";
          console.log("✗ Invalid destination node for:", proto.name, "type:", nodeType);
        }
      } catch (err) {
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
    } else {
      totalH += items.length * (CARD_H + GAP_Y) + PAGE_GAP;
    }
  }

  // ─────────────────────────
  // FIND OR CREATE INDEX PAGE
  // ─────────────────────────
  let indexPage = figma.root.children.find(p => p.name === "📋 Prototype Index");
  if (!indexPage) {
    indexPage = figma.createPage();
    indexPage.name = "📋 Prototype Index";
  }
  figma.currentPage = indexPage;

  // Remove old index frames
  for (var ci = 0; ci < indexPage.children.length; ci++) {
    var existingNode = indexPage.children[ci];
    if (existingNode.name === "Prototype Index") { existingNode.remove(); ci--; }
  }

  // ─────────────────────────
  // CREATE MAIN FRAME
  // ─────────────────────────
  const mainFrame = figma.createFrame();
  mainFrame.name = "Prototype Index";
  mainFrame.resize(FRAME_WIDTH, Math.max(totalH, 600));
  mainFrame.fills = [{ type: "SOLID", color: C.bg }];
  mainFrame.x = 0;
  mainFrame.y = 0;
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
    } else {
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

  // Add mainFrame to the index page
  indexPage.appendChild(mainFrame);

  // IMPORTANT: Switch to the index page BEFORE selecting nodes on it
  figma.currentPage = indexPage;
  
  // Now we can safely scroll and select the main frame
  figma.viewport.scrollAndZoomIntoView([mainFrame]);
  indexPage.selection = [mainFrame];


  return {
    frameId: mainFrame.id,
    pageName: indexPage.name,
    totalCards: totalPrototypes,
  };
}

// ─────────────────────────────────────────────
// WATCHER
// ─────────────────────────────────────────────

function startWatcher() {
  if (watcherInterval) return;
  isWatching = true;

  const checkForChanges = () => {
    if (!isWatching) return;
    try {
      const prototypes = getAllPrototypes();
      const snapshot = createSnapshot(prototypes);
      if (snapshot !== lastSnapshot && lastSnapshot !== "") {
        lastSnapshot = snapshot;
        figma.ui.postMessage({ type: "PROTOTYPES_UPDATED", prototypes, timestamp: Date.now() });
      } else if (lastSnapshot === "") {
        lastSnapshot = snapshot;
      }
    } catch (e) {}
  };

  watcherInterval = setInterval(checkForChanges, 2000);
}

function stopWatcher() {
  if (watcherInterval) { clearInterval(watcherInterval); watcherInterval = null; }
  isWatching = false;
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

figma.showUI(__html__, { width: 440, height: 640, title: "Prototype Index" });

const initialPrototypes = getAllPrototypes();
lastSnapshot = createSnapshot(initialPrototypes);

figma.ui.postMessage({
  type: "INITIAL_DATA",
  prototypes: initialPrototypes,
  fileKey: figma.fileKey || null,
  fileName: figma.root.name,
  timestamp: Date.now(),
});

// ─────────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────────

figma.ui.onmessage = async (msg) => {
  switch (msg.type) {

    case "REFRESH": {
      const prototypes = getAllPrototypes();
      lastSnapshot = createSnapshot(prototypes);
      figma.ui.postMessage({ type: "PROTOTYPES_DATA", prototypes, timestamp: Date.now() });
      break;
    }

    case "GENERATE_FRAME": {
      figma.ui.postMessage({ type: "GENERATING" });
      try {
        const prototypes = getAllPrototypes();
        const result = await generateIndexFrame(prototypes, msg.options || { layout: "list", showUrls: true });
        figma.ui.postMessage(Object.assign({ type: "FRAME_GENERATED" }, result));
      } catch (err) {
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
      if (node) {
        figma.currentPage = node.parent;
        figma.viewport.scrollAndZoomIntoView([node]);
        figma.currentPage.selection = [node];
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
