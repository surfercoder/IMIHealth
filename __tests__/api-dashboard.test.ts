import { getDashboardChartData, getDashboardSummary } from "@/src/lib/api/dashboard";

interface QueryResult {
  data?: unknown;
  count?: number | null;
}

const mockTables: Record<string, QueryResult> = {};

jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    from(table: string) {
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        then: (cb: (v: unknown) => unknown) => Promise.resolve(mockTables[table]).then(cb),
      };
      return chain;
    },
  },
}));

beforeEach(() => {
  for (const k of Object.keys(mockTables)) delete mockTables[k];
});

describe("getDashboardSummary", () => {
  it("computes counts across statuses", async () => {
    mockTables.patients = { count: 12 };
    mockTables.informes = {
      data: [
        { id: "1", status: "completed" },
        { id: "2", status: "completed" },
        { id: "3", status: "processing" },
        { id: "4", status: "recording" },
        { id: "5", status: "error" },
      ],
    };
    const summary = await getDashboardSummary("d");
    expect(summary).toEqual({
      totalPatients: 12,
      totalInformes: 5,
      completedCount: 2,
      processingCount: 2,
      errorCount: 1,
    });
  });

  it("treats nullish counts as 0", async () => {
    mockTables.patients = { count: null };
    mockTables.informes = { data: null };
    expect(await getDashboardSummary("d")).toEqual({
      totalPatients: 0,
      totalInformes: 0,
      completedCount: 0,
      processingCount: 0,
      errorCount: 0,
    });
  });
});

describe("getDashboardChartData", () => {
  it("returns chart data with patients-over-time, durations, and inform types", async () => {
    const day1 = "2024-01-01T00:00:00Z";
    const day1Updated = "2024-01-01T00:05:00Z";
    const day2 = "2024-01-02T00:00:00Z";
    mockTables.patients = {
      data: [
        { id: "p1", created_at: day1 },
        { id: "p2", created_at: day1 },
        { id: "p3", created_at: day2 },
      ],
    };
    mockTables.informes = {
      data: [
        { id: "i1", created_at: day1, updated_at: day1Updated, status: "completed", recording_duration: null },
        { id: "i2", created_at: day1, updated_at: day1Updated, status: "completed", recording_duration: 60 },
        { id: "i3", created_at: day1, updated_at: day1Updated, status: "processing", recording_duration: null },
      ],
    };
    mockTables.inform_generation_log = {
      data: [
        { inform_type: "classic" },
        { inform_type: "classic" },
        { inform_type: "quick" },
      ],
    };
    const data = await getDashboardChartData("d");
    expect(data.patientsOverTime.length).toBeGreaterThan(0);
    expect(data.consultationTime.avg).toBeGreaterThanOrEqual(1);
    expect(data.consultationTime.max).toBeGreaterThan(0);
    expect(data.informTypes).toEqual([
      { type: "classic", count: 2 },
      { type: "quick", count: 1 },
    ]);
    expect(data.patientsAccumulator.average).toBeGreaterThan(0);
  });

  it("returns zeros when there's no data", async () => {
    mockTables.patients = { data: null };
    mockTables.informes = { data: null };
    mockTables.inform_generation_log = { data: null };
    const data = await getDashboardChartData("d");
    expect(data.consultationTime).toEqual({ avg: 0, min: 0, max: 0, data: [] });
    expect(data.patientsAccumulator.average).toBe(0);
    expect(data.informTypes).toEqual([
      { type: "classic", count: 0 },
      { type: "quick", count: 0 },
    ]);
  });

  it("skips durations outside the 0-60 minute window", async () => {
    const created = "2024-01-01T00:00:00Z";
    const tooLong = "2024-01-01T02:00:00Z";
    mockTables.patients = { data: [] };
    mockTables.informes = {
      data: [
        { id: "i", created_at: created, updated_at: tooLong, status: "completed", recording_duration: null },
      ],
    };
    mockTables.inform_generation_log = { data: [] };
    const data = await getDashboardChartData("d");
    expect(data.consultationTime.data).toEqual([]);
  });
});
