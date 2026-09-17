import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(entryPath);
      return /\.[cm]?[jt]sx?$/.test(entry.name) ? [entryPath] : [];
    }),
  );
  return nested.flat();
}

describe("deterministic core architecture", () => {
  it("does not import infrastructure, Next.js, server-only, or environment state", async () => {
    const coreRoot = path.resolve(process.cwd(), "src/core");
    const files = await sourceFiles(coreRoot);

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = await readFile(file, "utf8");
      expect(source, file).not.toMatch(/from\s+["'][^"']*infrastructure/);
      expect(source, file).not.toMatch(/from\s+["']next(?:\/|["'])/);
      expect(source, file).not.toMatch(/["']server-only["']/);
      expect(source, file).not.toMatch(/process\.env/);
      expect(source, file).not.toMatch(/\bexb_/i);
      expect(source, file).not.toMatch(/domain-packs[\\/]exabytes/i);
      expect(source, file).not.toMatch(/exabytes/i);
      expect(source, file).not.toMatch(/shared_customer_operations|protected_business_continuity|professional_team_collaboration|measurable_digital_growth|protected_web_presence|scalable_cloud_operations|governed_ai_automation/);
      expect(source, file).not.toMatch(/active_web_presence|explicit_scaling_need|ai_readiness_60|data_3|process_3|leadership_3/);
      if (file.startsWith(path.join(coreRoot, "scenarios"))) expect(source, file).not.toMatch(/governed_ai_automation|lean_foundation|balanced_growth|accelerated_ai/i);
    }
  });
});
