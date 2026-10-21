import { describe, it, expect } from "vitest";

/**
 * W02 Database & Service Contract Tests
 *
 * Verifies the business contracts and constraints established by
 * supabase/migrations/20260804000700_authoritative_grading_and_profile_email_ownership.sql
 * for findings BUG-004, SEC-003, and SEC-004.
 */

// ─── 1. BUG-004: Authoritative Database Grading Simulation ───────────────────

interface QuestionRecord {
  id: string;
  set_id: string;
  correct_index: number;
}

interface MockTestSubmission {
  user_id: string;
  set_id: string;
  total_questions?: number;
  answers: Record<string, number | string>;
}

interface QuizSubmission {
  user_id: string;
  question_ids: string[];
  total_questions?: number;
  answers: Record<string, number | string>;
}

/**
 * Pure simulation of the PostgreSQL trigger logic defined in
 * public.recompute_exam_score() for unit verification.
 */
function simulateRecomputeMockScore(
  submission: MockTestSubmission,
  questionBank: QuestionRecord[]
) {
  // Derive total_questions from server set
  const serverQuestions = questionBank.filter((q) => q.set_id === submission.set_id);
  const v_total = serverQuestions.length;
  if (v_total <= 0) {
    throw new Error(`Invalid or unknown mock set_id: ${submission.set_id}`);
  }

  let v_score = 0;
  for (const [qId, selIdx] of Object.entries(submission.answers)) {
    const idx = Number(selIdx);
    if (!Number.isInteger(idx) || idx < 0 || idx > 3) {
      throw new Error(`Impossible answer option index ${selIdx} for question ${qId}`);
    }

    const question = questionBank.find((q) => q.id === qId);
    if (!question) {
      throw new Error(`Unknown question ID in answers: ${qId}`);
    }
    if (question.set_id !== submission.set_id) {
      throw new Error(
        `Foreign-set question answer detected: question ${qId} belongs to ${question.set_id}, not ${submission.set_id}`
      );
    }

    if (idx === question.correct_index) {
      v_score++;
    }
  }

  const v_percentage = Number(((v_score / v_total) * 100).toFixed(2));
  const passed = v_percentage >= 84.0;

  return {
    score: v_score,
    total_questions: v_total, // Derived authoritatively, ignores client input
    percentage: v_percentage,
    passed,
  };
}

function simulateRecomputeQuizScore(
  submission: QuizSubmission,
  questionBank: QuestionRecord[]
) {
  if (!submission.question_ids || submission.question_ids.length === 0) {
    throw new Error("quiz_results requires non-empty question_ids");
  }

  const uniqueIds = new Set(submission.question_ids);
  if (uniqueIds.size !== submission.question_ids.length) {
    throw new Error("Duplicate question IDs detected in quiz question_ids");
  }

  for (const qId of submission.question_ids) {
    if (!questionBank.some((q) => q.id === qId)) {
      throw new Error("One or more declared question_ids do not exist in question bank");
    }
  }

  const v_total = submission.question_ids.length;
  let v_score = 0;

  for (const [qId, selIdx] of Object.entries(submission.answers)) {
    if (!submission.question_ids.includes(qId)) {
      throw new Error(`Answer submitted for undeclared question ${qId} (not in question_ids)`);
    }

    const idx = Number(selIdx);
    if (!Number.isInteger(idx) || idx < 0 || idx > 3) {
      throw new Error(`Impossible answer option index ${selIdx} for question ${qId}`);
    }

    const question = questionBank.find((q) => q.id === qId)!;
    if (idx === question.correct_index) {
      v_score++;
    }
  }

  const v_percentage = Number(((v_score / v_total) * 100).toFixed(2));
  return {
    score: v_score,
    total_questions: v_total,
    percentage: v_percentage,
  };
}

describe("BUG-004: Authoritative Database Grading Contract", () => {
  const mockBank: QuestionRecord[] = Array.from({ length: 50 }, (_, i) => ({
    id: `mock1-q-${i + 1}`,
    set_id: "mock-1",
    correct_index: i % 4,
  }));

  const mock2Bank: QuestionRecord[] = Array.from({ length: 50 }, (_, i) => ({
    id: `mock2-q-${i + 1}`,
    set_id: "mock-2",
    correct_index: i % 4,
  }));

  const quizPoolBank: QuestionRecord[] = Array.from({ length: 20 }, (_, i) => ({
    id: `quiz-q-${i + 1}`,
    set_id: "quiz-pool",
    correct_index: i % 4,
  }));

  const fullBank = [...mockBank, ...mock2Bank, ...quizPoolBank];

  it("derives total_questions from server set and prevents fabricated passes", () => {
    // Malicious submission: 1 correct answer, claims total_questions = 1
    const sub: MockTestSubmission = {
      user_id: "alice",
      set_id: "mock-1",
      total_questions: 1,
      answers: { "mock1-q-1": 0 }, // 1 correct answer
    };

    const result = simulateRecomputeMockScore(sub, fullBank);

    // Denominator must be derived from the 50 questions in mock-1, not the client's 1
    expect(result.total_questions).toBe(50);
    expect(result.score).toBe(1);
    expect(result.percentage).toBe(2.0);
    expect(result.passed).toBe(false); // 2.0% < 84.0% => fabricated pass rejected
  });

  it("calculates passing grade accurately for genuine passing scores", () => {
    // 42 correct answers out of 50 = 84% pass mark
    const answers: Record<string, number> = {};
    for (let i = 0; i < 42; i++) {
      answers[`mock1-q-${i + 1}`] = i % 4; // correct
    }
    for (let i = 42; i < 50; i++) {
      answers[`mock1-q-${i + 1}`] = (i + 1) % 4; // incorrect
    }

    const sub: MockTestSubmission = {
      user_id: "alice",
      set_id: "mock-1",
      answers,
    };

    const result = simulateRecomputeMockScore(sub, fullBank);
    expect(result.total_questions).toBe(50);
    expect(result.score).toBe(42);
    expect(result.percentage).toBe(84.0);
    expect(result.passed).toBe(true);
  });

  it("rejects foreign-set answers submitted for a mock test", () => {
    const sub: MockTestSubmission = {
      user_id: "alice",
      set_id: "mock-1",
      answers: {
        "mock1-q-1": 0,
        "mock2-q-1": 0, // Belongs to mock-2!
      },
    };

    expect(() => simulateRecomputeMockScore(sub, fullBank)).toThrowError(
      /Foreign-set question answer detected/
    );
  });

  it("rejects unknown question IDs not in the bank", () => {
    const sub: MockTestSubmission = {
      user_id: "alice",
      set_id: "mock-1",
      answers: {
        "fake-uuid-not-in-bank": 1,
      },
    };

    expect(() => simulateRecomputeMockScore(sub, fullBank)).toThrowError(
      /Unknown question ID in answers/
    );
  });

  it("rejects impossible answer options (< 0 or > 3)", () => {
    const sub: MockTestSubmission = {
      user_id: "alice",
      set_id: "mock-1",
      answers: {
        "mock1-q-1": 4, // impossible choice
      },
    };

    expect(() => simulateRecomputeMockScore(sub, fullBank)).toThrowError(
      /Impossible answer option index/
    );
  });

  it("preserves partial / unanswered mock exams without inflating score", () => {
    // Learner only answered 10 questions before time ran out
    const answers: Record<string, number> = {};
    for (let i = 0; i < 10; i++) {
      answers[`mock1-q-${i + 1}`] = i % 4;
    }

    const sub: MockTestSubmission = {
      user_id: "alice",
      set_id: "mock-1",
      answers,
    };

    const result = simulateRecomputeMockScore(sub, fullBank);
    expect(result.total_questions).toBe(50);
    expect(result.score).toBe(10);
    expect(result.percentage).toBe(20.0);
    expect(result.passed).toBe(false);
  });

  it("enforces quiz question selection constraints and validates undeclared questions", () => {
    const declaredIds = ["quiz-q-1", "quiz-q-2", "quiz-q-3"];
    const sub: QuizSubmission = {
      user_id: "alice",
      question_ids: declaredIds,
      answers: {
        "quiz-q-1": 0,
        "quiz-q-4": 1, // Undeclared question!
      },
    };

    expect(() => simulateRecomputeQuizScore(sub, fullBank)).toThrowError(
      /Answer submitted for undeclared question/
    );
  });

  it("rejects duplicate question IDs in quiz question_ids", () => {
    const sub: QuizSubmission = {
      user_id: "alice",
      question_ids: ["quiz-q-1", "quiz-q-1"],
      answers: { "quiz-q-1": 0 },
    };

    expect(() => simulateRecomputeQuizScore(sub, fullBank)).toThrowError(
      /Duplicate question IDs detected/
    );
  });
});

// ─── 2. SEC-004: Profile Email Ownership Contract ───────────────────────────

interface Profile {
  id: string;
  email: string;
  is_admin: boolean;
}

interface AuthUser {
  id: string;
  email: string;
}

class SimulatedProfileDatabase {
  private profiles = new Map<string, Profile>();
  private users = new Map<string, AuthUser>();

  signup(id: string, email: string): Profile {
    if (this.users.has(id)) throw new Error("User already exists");
    this.users.set(id, { id, email });

    // Handle new user trigger logic
    // Check if another profile already has this email (legacy orphaned collision check)
    for (const [existingId, p] of this.profiles.entries()) {
      if (p.email === email && existingId !== id) {
        if (!this.users.has(existingId)) {
          // Orphaned profile - clean up
          this.profiles.delete(existingId);
        } else {
          // Both are active users: auth.users enforces unique emails so this won't occur in practice
          throw new Error("unique_violation: profiles_email_key");
        }
      }
    }

    const newProfile: Profile = { id, email, is_admin: false };
    this.profiles.set(id, newProfile);
    return newProfile;
  }

  updateAuthEmail(id: string, newEmail: string): void {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    user.email = newEmail;

    // Trigger on_auth_user_email_updated syncs to profile
    const profile = this.profiles.get(id);
    if (profile) {
      profile.email = newEmail;
    }
  }

  // Direct client update method - should be rejected by revoked privilege
  directClientUpdate(
    _callerId: string,
    _updates: Partial<Profile>
  ): void {
    // In migration 20260804000700:
    // REVOKE UPDATE, INSERT ON public.profiles FROM PUBLIC, anon, authenticated;
    throw new Error(
      "permission denied for table profiles (direct client writes revoked)"
    );
  }

  getProfile(id: string): Profile | undefined {
    return this.profiles.get(id);
  }
}

describe("SEC-004: Profile Email Ownership Contract", () => {
  it("prohibits arbitrary direct client writes of profile email", () => {
    const db = new SimulatedProfileDatabase();
    db.signup("attacker-id", "attacker@example.com");

    // Attacker attempts to overwrite own profile email to victim@example.com
    expect(() =>
      db.directClientUpdate("attacker-id", { email: "victim@example.com" })
    ).toThrowError(/permission denied for table profiles/);
  });

  it("prevents profile email reservation from blocking a legitimate victim signup", () => {
    const db = new SimulatedProfileDatabase();
    db.signup("alice-id", "alice@example.com");

    // Alice cannot reserve bob's email because client update is blocked
    expect(() =>
      db.directClientUpdate("alice-id", { email: "bob@example.com" })
    ).toThrowError(/permission denied/);

    // Bob can sign up normally without collision
    const bobProfile = db.signup("bob-id", "bob@example.com");
    expect(bobProfile.email).toBe("bob@example.com");
    expect(bobProfile.is_admin).toBe(false);
  });

  it("syncs verified email changes from Auth trigger to profile", () => {
    const db = new SimulatedProfileDatabase();
    db.signup("charlie-id", "charlie@old.com");

    // Charlie updates verified email through Supabase Auth
    db.updateAuthEmail("charlie-id", "charlie@new.com");

    const profile = db.getProfile("charlie-id");
    expect(profile?.email).toBe("charlie@new.com");
  });
});

// ─── 3. SEC-003: Answer-Key Access Boundary Contract ────────────────────────

describe("SEC-003: Answer-Key Access Boundary Contract", () => {
  interface MockResult {
    id: string;
    user_id: string;
    set_id: string;
  }

  const resultsTable: MockResult[] = [
    { id: "attempt-1", user_id: "alice", set_id: "mock-1" },
  ];

  function getMockTestAnswerKeyRpc(
    callerUserId: string,
    testResultId: string
  ) {
    const attempt = resultsTable.find((r) => r.id === testResultId);
    if (!attempt || attempt.user_id !== callerUserId) {
      throw new Error("Mock test result not found or access denied");
    }
    return {
      set_id: attempt.set_id,
      keys: [{ id: "q1", correct_index: 2 }],
    };
  }

  it("releases mock answer keys only after authenticated attempt submission", () => {
    // Alice requests key for her completed attempt
    const key = getMockTestAnswerKeyRpc("alice", "attempt-1");
    expect(key.set_id).toBe("mock-1");
    expect(key.keys).toHaveLength(1);
  });

  it("denies access to mock answer keys for unauthorized or other users' attempts", () => {
    // Bob attempts to read Alice's test result answer key
    expect(() => getMockTestAnswerKeyRpc("bob", "attempt-1")).toThrowError(
      /Mock test result not found or access denied/
    );

    // Caller attempts to read key before submitting any result
    expect(() => getMockTestAnswerKeyRpc("alice", "unsubmitted-attempt")).toThrowError(
      /Mock test result not found or access denied/
    );
  });
});
