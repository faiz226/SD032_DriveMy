export interface Database {
  public: {
    Tables: {
      kpp_questions: {
        Row: {
          id: string;
          category: string;
          set_id: string;
          order_index: number;
          question_en: string;
          question_ms: string;
          options_en: string[];
          options_ms: string[];
          correct_index: number;
          explanation_en: string | null;
          explanation_ms: string | null;
          image_url: string | null;
          source_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          set_id: string;
          order_index: number;
          question_en: string;
          question_ms: string;
          options_en: string[];
          options_ms: string[];
          correct_index: number;
          explanation_en?: string | null;
          explanation_ms?: string | null;
          image_url?: string | null;
          source_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["kpp_questions"]["Insert"]>;
      };

      quiz_results: {
        Row: {
          id: string;
          user_id: string;
          quiz_title: string;
          score: number;
          total_questions: number;
          percentage: number;
          duration_seconds: number;
          language: "en" | "ms";
          question_ids: string[];
          answers: Record<string, number>;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_title: string;
          score: number;
          total_questions: number;
          percentage: number;
          duration_seconds: number;
          language: "en" | "ms";
          question_ids?: string[];
          answers?: Record<string, number>;
          completed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_results"]["Insert"]>;
      };

      mock_test_results: {
        Row: {
          id: string;
          user_id: string;
          set_id: string;
          score: number;
          total_questions: number;
          percentage: number;
          passed: boolean;
          duration_seconds: number;
          answers: Record<string, number>;
          language: "en" | "ms";
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          set_id: string;
          score: number;
          total_questions: number;
          percentage: number;
          passed?: boolean;
          duration_seconds: number;
          answers?: Record<string, number>;
          language: "en" | "ms";
          completed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mock_test_results"]["Insert"]>;
      };

      simulation_results: {
        Row: {
          id: string;
          user_id: string;
          maneuver_id: string;
          mode: "practice" | "assessment";
          score: number;
          errors: number;
          passed: boolean;
          completion_seconds: number | null;
          stall_count: number;
          rollback_cm: number;
          language: "en" | "ms";
          attempt_data: Record<string, unknown>;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          maneuver_id: string;
          mode: "practice" | "assessment";
          score: number;
          errors?: number;
          passed?: boolean;
          completion_seconds?: number | null;
          stall_count?: number;
          rollback_cm?: number;
          language: "en" | "ms";
          attempt_data?: Record<string, unknown>;
          completed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["simulation_results"]["Insert"]>;
      };

      theory_progress: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_id: string;
          completed?: boolean;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["theory_progress"]["Insert"]>;
      };

      colorblind_results: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          total_plates: number;
          percentage: number;
          answers: Record<string, string>;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score: number;
          total_plates: number;
          percentage: number;
          answers?: Record<string, string>;
          completed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["colorblind_results"]["Insert"]>;
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type KppQuestion = Database["public"]["Tables"]["kpp_questions"]["Row"];
export type QuizResult = Database["public"]["Tables"]["quiz_results"]["Row"];
export type MockTestResult = Database["public"]["Tables"]["mock_test_results"]["Row"];
export type SimulationResult = Database["public"]["Tables"]["simulation_results"]["Row"];
export type TheoryProgress = Database["public"]["Tables"]["theory_progress"]["Row"];
export type ColorblindResult = Database["public"]["Tables"]["colorblind_results"]["Row"];

export type InsertQuizResult = Database["public"]["Tables"]["quiz_results"]["Insert"];
export type InsertMockTestResult = Database["public"]["Tables"]["mock_test_results"]["Insert"];
export type InsertSimulationResult = Database["public"]["Tables"]["simulation_results"]["Insert"];
export type InsertTheoryProgress = Database["public"]["Tables"]["theory_progress"]["Insert"];
export type InsertColorblindResult = Database["public"]["Tables"]["colorblind_results"]["Insert"];