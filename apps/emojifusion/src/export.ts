export async function exportPNG(node: HTMLElement, size = 1024): Promise<Blob> {
  // Simple text-based render to canvas (sufficient for emoji/ASCII)
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Modern gradient background matching app theme
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#1a1a1a");
  gradient.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add subtle glow effect
  const glowGradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size*0.7);
  glowGradient.addColorStop(0, "rgba(255, 156, 255, 0.1)");
  glowGradient.addColorStop(1, "transparent");
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, size, size);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Extract text from various possible selectors
  const combo = (
    node.querySelector(".result-combo")?.textContent ||
    node.querySelector(".combo")?.textContent ||
    node.textContent ||
    ""
  ).slice(0, 100);

  const isAscii = node.querySelector(".ascii") !== null;

  // Render combo with appropriate font size
  if (isAscii) {
    ctx.font = `${Math.round(size*0.12)}px "Courier New", Monaco, monospace`;
    ctx.fillStyle = "#f7f7f5";
    const lines = combo.split('\n').filter(l => l.trim());
    const lineHeight = size * 0.14;
    const startY = size/2 - (lines.length * lineHeight / 2);
    lines.forEach((line, i) => {
      ctx.fillText(line, size/2, startY + (i * lineHeight));
    });
  } else {
    ctx.font = `${Math.round(size*0.28)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.fillStyle = "#f7f7f5";
    ctx.fillText(combo, size/2, size*0.45);
  }

  // Add "EmojiFusion" watermark at bottom
  ctx.font = `${Math.round(size*0.04)}px system-ui, -apple-system, "Segoe UI", Roboto`;
  ctx.fillStyle = "#666";
  ctx.fillText("EmojiFusion by Ayotype", size/2, size*0.92);

  return await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
}