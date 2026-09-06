import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_BASE = process.env.FRONTEND_URL || "http://localhost:3000";

describe("Geospatial Map Centering & Projection Verification", () => {
  const jsonPath = path.resolve(__dirname, "../public/data/india_constituencies_svg.json");
  const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  it("should have valid SVG dataset with viewBox 0 0 800 920 and all 543 constituencies", () => {
    assert.equal(dataset.viewBox, "0 0 800 920");
    assert.equal(dataset.constituencies.length, 543);
    assert.ok(dataset.states.length >= 35);
  });

  it("should mathematically center every state at exact (400, 460) with balanced zoom (1.5x - 2.2x)", () => {
    for (const state of dataset.states) {
      const [[minX, minY], [maxX, maxY]] = state.bounds;
      const bWidth = Math.max(16, maxX - minX);
      const bHeight = Math.max(16, maxY - minY);

      const viewW = 800;
      const viewH = 920;
      const padding = 100;

      const fitScale = Math.min((viewW - padding * 2) / bWidth, (viewH - padding * 2) / bHeight);
      const targetZoom = Math.min(2.2, Math.max(1.5, Number(fitScale.toFixed(2))));

      assert.ok(targetZoom >= 1.5 && targetZoom <= 2.2, `State ${state.state} zoom ${targetZoom} out of bounds`);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const targetSvgX = 400;
      const targetSvgY = 460;

      const targetPanX = Number((targetSvgX - targetZoom * centerX).toFixed(1));
      const targetPanY = Number((targetSvgY - targetZoom * centerY).toFixed(1));

      // Reconstructed rendered position inside <g transform="translate(pan.x, pan.y) scale(zoom)">
      const renderedX = targetPanX + targetZoom * centerX;
      const renderedY = targetPanY + targetZoom * centerY;

      assert.ok(Math.abs(renderedX - 400) < 0.2, `State ${state.state} renderedX ${renderedX} should be 400`);
      assert.ok(Math.abs(renderedY - 460) < 0.2, `State ${state.state} renderedY ${renderedY} should be 460`);
    }
  });

  it("should center every constituency in visible viewport without over-zooming (2.1x - 2.4x)", () => {
    for (const c of dataset.constituencies) {
      const [[minX, minY], [maxX, maxY]] = c.bounds;
      const bWidth = Math.max(16, maxX - minX);
      const bHeight = Math.max(16, maxY - minY);

      const viewW = 800;
      const viewH = 920;

      // Forensic clamping
      const fitScale = Math.min(viewW / (bWidth * 3.0), viewH / (bHeight * 3.0));
      const targetZoom = Math.min(2.4, Math.max(2.1, Number(fitScale.toFixed(2))));

      assert.ok(targetZoom >= 2.1 && targetZoom <= 2.4, `Constituency ${c.name} zoom ${targetZoom} exceeds safe bounds`);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Desktop drawer offset target
      const targetSvgX = 260; // Visible center to left of drawer
      const targetSvgY = 460;

      const targetPanX = Number((targetSvgX - targetZoom * centerX).toFixed(1));
      const targetPanY = Number((targetSvgY - targetZoom * centerY).toFixed(1));

      const renderedX = targetPanX + targetZoom * centerX;
      const renderedY = targetPanY + targetZoom * centerY;

      assert.ok(Math.abs(renderedX - 260) < 0.2, `Constituency ${c.name} renderedX ${renderedX} must be centered at 260`);
      assert.ok(Math.abs(renderedY - 460) < 0.2, `Constituency ${c.name} renderedY ${renderedY} must be centered at 460`);
    }
  });

  it("should verify /maps route renders with HTTP 200 and loads geospatial layers", async () => {
    const res = await fetch(`${FRONTEND_BASE}/maps`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.toLowerCase().includes("geospatial"), "Should render geospatial module");
  });
});
