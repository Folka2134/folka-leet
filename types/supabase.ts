export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      questions: {
        Row: {
          id: number
          title: string
          difficulty: "Easy" | "Medium" | "Hard"
          tags: string[]
          leetcode_id: string | null
          created_at: string
        }
        Insert: {
          id?: number
          title: string
          difficulty: "Easy" | "Medium" | "Hard"
          tags?: string[]
          leetcode_id?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          title?: string
          difficulty?: "Easy" | "Medium" | "Hard"
          tags?: string[]
          leetcode_id?: string | null
          created_at?: string
        }
      }
      user_questions: {
        Row: {
          id: number
          user_id: string
          question_id: number
          difficulty_rating: "Easy" | "Medium" | "Hard" | null
          next_review_date: string
          review_count: number
          last_reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          question_id: number
          difficulty_rating?: "Easy" | "Medium" | "Hard" | null
          next_review_date: string
          review_count?: number
          last_reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          question_id?: number
          difficulty_rating?: "Easy" | "Medium" | "Hard" | null
          next_review_date?: string
          review_count?: number
          last_reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
