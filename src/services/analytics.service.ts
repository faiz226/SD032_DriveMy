import { supabase } from "@/lib/supabase";
import type { QuizResult, MockTestResult, SimulationResult } from "@/types/database";

export async function getBestQuizScore(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("quiz_results")
    .select("percentage")
    .eq("user_id", userId)
    .order("percentage", { ascending: false })
    .limit(1);
  if (error) throw error;
  const rows = (data ?? []) as { percentage: number }[];
  return rows.length > 0 ? rows[0].percentage : 0;
}

export async function getBestMockTestScore(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("mock_test_results")
    .select("percentage")
    .eq("user_id", userId)
    .order("percentage", { ascending: false })
    .limit(1);
  if (error) throw error;
  const rows = (data ?? []) as { percentage: number }[];
  return rows.length > 0 ? rows[0].percentage : 0;
}

export async function getSimulationsDone(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("simulation_results")
    .select("maneuver_id")
    .eq("user_id", userId);
  if (error) throw error;
  if (!data) return 0;

  const rows = data as { maneuver_id: string }[];
  const uniqueManeuvers = new Set(rows.map((r) => r.maneuver_id));
  return uniqueManeuvers.size;
}

export type ActivityEvent = {
  id: string;
  type: "quiz" | "mock" | "sim";
  title: string;
  score: number;
  date: string;
};

export async function getRecentActivity(userId: string): Promise<ActivityEvent[]> {
  const [quizzes, mocks, sims] = await Promise.all([
    supabase
      .from("quiz_results")
      .select("id, quiz_title, percentage, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("mock_test_results")
      .select("id, set_id, percentage, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("simulation_results")
      .select("id, maneuver_id, score, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(5),
  ]);

  const activities: ActivityEvent[] = [];

  if (quizzes.data) {
    activities.push(
      ...(quizzes.data as Pick<QuizResult, "id" | "quiz_title" | "percentage" | "completed_at">[]).map((q) => ({
        id: q.id,
        type: "quiz" as const,
        title: q.quiz_title,
        score: q.percentage,
        date: q.completed_at,
      }))
    );
  }

  if (mocks.data) {
    activities.push(
      ...(mocks.data as Pick<MockTestResult, "id" | "set_id" | "percentage" | "completed_at">[]).map((m) => ({
        id: m.id,
        type: "mock" as const,
        title: `Mock Test - ${m.set_id}`,
        score: m.percentage,
        date: m.completed_at,
      }))
    );
  }

  if (sims.data) {
    activities.push(
      ...(sims.data as Pick<SimulationResult, "id" | "maneuver_id" | "score" | "completed_at">[]).map((s) => ({
        id: s.id,
        type: "sim" as const,
        title: `Simulation: ${s.maneuver_id}`,
        score: s.score,
        date: s.completed_at,
      }))
    );
  }

  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
}

// ── Progress statistics ──────────────────────────────────────────────────────

export async function getQuizStats(userId: string, dateRange?: number) {
  let query = supabase.from("quiz_results").select("*").eq("user_id", userId);
  if (dateRange) {
    const date = new Date();
    date.setDate(date.getDate() - dateRange);
    query = query.gte("completed_at", date.toISOString());
  }
  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return { best: 0, average: 0, count: 0, trend: [], totalDuration: 0, history: [] };

  const rows = data as QuizResult[];
  const count = rows.length;
  const best = Math.max(...rows.map((d) => d.percentage));
  const average = rows.reduce((sum, d) => sum + d.percentage, 0) / count;
  const totalDuration = rows.reduce((sum, d) => sum + d.duration_seconds, 0);
  const trend = [...rows]
    .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
    .map((d) => ({ date: d.completed_at, score: d.percentage, title: d.quiz_title }));

  return { best, average, count, trend, totalDuration, history: rows };
}

export async function getMockStats(userId: string, dateRange?: number) {
  let query = supabase.from("mock_test_results").select("*").eq("user_id", userId);
  if (dateRange) {
    const date = new Date();
    date.setDate(date.getDate() - dateRange);
    query = query.gte("completed_at", date.toISOString());
  }
  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return { best: 0, average: 0, count: 0, passRate: 0, trend: [], totalDuration: 0, history: [] };

  const rows = data as MockTestResult[];
  const count = rows.length;
  const best = Math.max(...rows.map((d) => d.percentage));
  const average = rows.reduce((sum, d) => sum + d.percentage, 0) / count;
  const passRate = (rows.filter((d) => d.passed).length / count) * 100;
  const totalDuration = rows.reduce((sum, d) => sum + d.duration_seconds, 0);
  const trend = [...rows]
    .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
    .map((d) => ({ date: d.completed_at, score: d.percentage }));

  return { best, average, count, passRate, trend, totalDuration, history: rows };
}

export async function getSimStats(userId: string, dateRange?: number) {
  let query = supabase.from("simulation_results").select("*").eq("user_id", userId);
  if (dateRange) {
    const date = new Date();
    date.setDate(date.getDate() - dateRange);
    query = query.gte("completed_at", date.toISOString());
  }
  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return { completed: 0, averageScore: 0, byManeuver: [], totalDuration: 0, history: [] };

  const rows = data as SimulationResult[];
  const uniqueManeuvers = new Set(rows.map((d) => d.maneuver_id));
  const completed = uniqueManeuvers.size;
  const averageScore = rows.reduce((sum, d) => sum + d.score, 0) / rows.length;
  const totalDuration = rows.reduce((sum, d) => sum + (d.completion_seconds ?? 0), 0);

  const byManeuver = Array.from(uniqueManeuvers).map((m) => {
    const mData = rows.filter((d) => d.maneuver_id === m);
    return {
      maneuver: m,
      bestScore: Math.max(...mData.map((d) => d.score)),
      attempts: mData.length,
    };
  });

  return { completed, averageScore, byManeuver, totalDuration, history: rows };
}

export async function getTheoryProgressStats(userId: string) {
  const { data, error } = await supabase.from("theory_progress").select("*").eq("user_id", userId);
  if (error) throw error;
  // Total KPP1 theory modules — update if the module count changes
  const totalModules = 12;
  const rows = (data ?? []) as { completed: boolean }[];
  const completedModules = rows.filter((d) => d.completed).length;
  const percentage = (completedModules / totalModules) * 100;
  return { completedModules, totalModules, percentage, byModule: rows };
}
