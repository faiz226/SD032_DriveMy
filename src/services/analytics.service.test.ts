import { describe, expect, it, vi } from "vitest";
import { SIM_RUN_SCHEMA } from "@/sim/record";

const rows = vi.hoisted(() => ({ simulation_results: [] as unknown[] }));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: keyof typeof rows) => ({ select: () => ({ eq: () => Promise.resolve({ data: rows[table], error: null }) }) }),
  },
}));

import { getSimStats } from "./analytics.service";

describe("simulator stats", () => {
  it("counts stations cleared, keeps whole runs as history and times each run once", async () => {
    const statuses = ["cleared", "cleared", "failed", "cleared", "cleared", "cleared", "pending"];
    const ids = ["hill-start", "side-parking", "parallel-parking", "s-curve", "z-curve", "ramp-test", "road-merging"];
    rows.simulation_results = [
      {
        id: "run", maneuver_id: "full-circuit", score: 71, passed: false, errors: 3, completion_seconds: 540, completed_at: "2026-11-08T10:00:00Z",
        attempt_data: { schema: SIM_RUN_SCHEMA, stations: ids.map((id, i) => ({ id, status: statuses[i] })) },
      },
      // A row from the old circuit, which had a three-point turn: not one of today's seven stations.
      { id: "old", maneuver_id: "three-point-turn", score: 100, passed: true, errors: 0, completion_seconds: 60, completed_at: "2026-09-01T10:00:00Z", attempt_data: null },
    ];

    const stats = await getSimStats("learner");

    expect(stats.cleared).toBe(5);
    // "completed" still counts every station tried, failed ones and the old one included: it cannot stand for readiness.
    expect(stats.completed).toBe(7);
    expect(stats.history).toHaveLength(2);
    expect(stats.totalDuration).toBe(600);
  });
});
