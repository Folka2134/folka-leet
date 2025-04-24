import { supabase } from "./supabase";
import { calculateNextReviewDate, formatDateForDB } from "./spaced-repetition";
import { leetcodeQuestions } from "./recommended-questions-array";
import Fuse from "fuse.js";

export type Question = {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  leetcode_id?: string;
};

export type UserQuestion = {
  id: number;
  question_id: number;
  question: Question;
  difficulty_rating: "Easy" | "Medium" | "Hard" | null;
  next_review_date: string;
  review_count: number;
  last_reviewed_at: string | null;
};

/**
 * Add a question to the user's revision bank
 */
export async function addQuestionToBank(
  question: Question,
): Promise<UserQuestion | null | boolean> {
  try {
    console.log("Adding question to bank:", question);

    // Get the current user first
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      return null;
    }

    if (!user) {
      console.error("No user found");
      return null;
    }

    console.log("User authenticated:", user.id);

    // First, check if the question already exists in the questions table
    const { data: existingQuestions, error: queryError } = await supabase
      .from("questions")
      .select("id, title")
      .eq("title", question.title);

    if (queryError) {
      console.error("Error querying existing questions:", queryError);
      return null;
    }

    console.log("Existing questions query result:", existingQuestions);

    let questionId: number;

    // If the question doesn't exist, insert it
    if (!existingQuestions || existingQuestions.length === 0) {
      console.log("Question doesn't exist, inserting new question");

      // Prepare the question data
      const questionData = {
        title: question.title,
        difficulty: question.difficulty,
        tags: question.tags || [],
        leetcode_id: question.leetcode_id || null,
      };

      console.log("Question data to insert:", questionData);

      // Insert the question
      const { data: newQuestion, error: insertError } = await supabase
        .from("questions")
        .insert(questionData)
        .select();

      if (insertError) {
        console.error("Error inserting question:", insertError);
        return null;
      }

      if (!newQuestion || newQuestion.length === 0) {
        console.error("No question data returned after insertion");
        return null;
      }

      console.log("New question inserted:", newQuestion);
      questionId = newQuestion[0].id;
    } else {
      console.log("Question already exists");
      questionId = existingQuestions[0].id;
    }

    // Check if the user already has this question in their bank
    const { data: existingUserQuestion, error: userQuestionQueryError } =
      await supabase
        .from("user_questions")
        .select("id")
        .eq("user_id", user.id)
        .eq("question_id", questionId);

    if (userQuestionQueryError) {
      console.error(
        "Error checking existing user question:",
        userQuestionQueryError,
      );
      return null;
    }

    if (existingUserQuestion && existingUserQuestion.length > 0) {
      console.log("Question already exists in user's bank");

      return true;
    }

    // Calculate the next review date (today for new questions)
    const nextReviewDate = new Date();
    const formattedDate = formatDateForDB(nextReviewDate);

    console.log("Adding new question to user's bank:", {
      user_id: user.id,
      question_id: questionId,
      next_review_date: formattedDate,
    });

    // Add the question to the user's bank
    const { data: userQuestion, error: userQuestionError } = await supabase
      .from("user_questions")
      .insert({
        user_id: user.id,
        question_id: questionId,
        next_review_date: formattedDate,
        review_count: 0,
      })
      .select(
        `
        id, 
        question_id, 
        difficulty_rating, 
        next_review_date, 
        review_count, 
        last_reviewed_at,
        questions:question_id (
          id,
          title,
          difficulty,
          tags,
          leetcode_id
        )
      `,
      )
      .single();

    if (userQuestionError) {
      console.error("Error adding question to bank:", userQuestionError);
      return null;
    }

    if (!userQuestion) {
      console.error("No user question data returned");
      return null;
    }

    console.log("User question added:", userQuestion);

    // Handle the case where questions might be an array
    const questionData = Array.isArray(userQuestion.questions)
      ? userQuestion.questions[0]
      : userQuestion.questions;

    if (!questionData) {
      console.error("Question data is missing");
      return null;
    }

    // Transform the data to match our UserQuestion type
    return {
      id: userQuestion.id,
      question_id: userQuestion.question_id,
      question: {
        id: questionData.id,
        title: questionData.title,
        difficulty: questionData.difficulty,
        tags: questionData.tags,
        leetcode_id: questionData.leetcode_id,
      },
      difficulty_rating: userQuestion.difficulty_rating,
      next_review_date: userQuestion.next_review_date,
      review_count: userQuestion.review_count,
      last_reviewed_at: userQuestion.last_reviewed_at,
    };
  } catch (error) {
    console.error("Unexpected error in addQuestionToBank:", error);
    return null;
  }
}

/**
 * Get all questions in the user's bank
 */
export async function getUserQuestions(): Promise<UserQuestion[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("No user found");
      return [];
    }

    const { data, error } = await supabase
      .from("user_questions")
      .select(
        `
        id, 
        question_id, 
        difficulty_rating, 
        next_review_date, 
        review_count, 
        last_reviewed_at,
        questions:question_id (
          id,
          title,
          difficulty,
          tags,
          leetcode_id
        )
      `,
      )
      .eq("user_id", user.id)
      .order("next_review_date");

    if (error || !data) {
      console.error("Error fetching user questions:", error);
      return [];
    }

    // Transform the data to match our UserQuestion type
    return data
      .map((item) => {
        // Handle the case where questions might be an array
        const questionData = Array.isArray(item.questions)
          ? item.questions[0]
          : item.questions;

        if (!questionData) {
          console.error("Question data is missing for item:", item);
          return null;
        }

        return {
          id: item.id,
          question_id: item.question_id,
          question: {
            id: questionData.id,
            title: questionData.title,
            difficulty: questionData.difficulty,
            tags: questionData.tags,
            leetcode_id: questionData.leetcode_id,
          },
          difficulty_rating: item.difficulty_rating,
          next_review_date: item.next_review_date,
          review_count: item.review_count,
          last_reviewed_at: item.last_reviewed_at,
        };
      })
      .filter(Boolean) as UserQuestion[];
  } catch (error) {
    console.error("Unexpected error in getUserQuestions:", error);
    return [];
  }
}

/**
 * Get questions due for review today
 */
export async function getDueQuestions(): Promise<UserQuestion[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("No user found");
      return [];
    }

    const today = formatDateForDB(new Date());

    const { data, error } = await supabase
      .from("user_questions")
      .select(
        `
        id, 
        question_id, 
        difficulty_rating, 
        next_review_date, 
        review_count, 
        last_reviewed_at,
        questions:question_id (
          id,
          title,
          difficulty,
          tags,
          leetcode_id
        )
      `,
      )
      .eq("user_id", user.id)
      .lte("next_review_date", today)
      .order("next_review_date");

    if (error || !data) {
      console.error("Error fetching due questions:", error);
      return [];
    }

    // Transform the data to match our UserQuestion type
    return data
      .map((item) => {
        // Handle the case where questions might be an array
        const questionData = Array.isArray(item.questions)
          ? item.questions[0]
          : item.questions;

        if (!questionData) {
          console.error("Question data is missing for item:", item);
          return null;
        }

        return {
          id: item.id,
          question_id: item.question_id,
          question: {
            id: questionData.id,
            title: questionData.title,
            difficulty: questionData.difficulty,
            tags: questionData.tags,
            leetcode_id: questionData.leetcode_id,
          },
          difficulty_rating: item.difficulty_rating,
          next_review_date: item.next_review_date,
          review_count: item.review_count,
          last_reviewed_at: item.last_reviewed_at,
        };
      })
      .filter(Boolean) as UserQuestion[];
  } catch (error) {
    console.error("Unexpected error in getDueQuestions:", error);
    return [];
  }
}

/**
 * Review a question and update its next review date
 */
export async function reviewQuestion(
  userQuestionId: number,
  difficultyRating: "Easy" | "Medium" | "Hard",
): Promise<UserQuestion | null> {
  try {
    // Get the current user question to get the review count
    const { data: userQuestion, error: fetchError } = await supabase
      .from("user_questions")
      .select("*")
      .eq("id", userQuestionId)
      .single();

    if (fetchError || !userQuestion) {
      console.error("Error fetching user question:", fetchError);
      return null;
    }

    // Calculate the next review date based on the difficulty rating and review count
    const nextReviewDate = calculateNextReviewDate(
      difficultyRating,
      userQuestion.review_count,
    );

    // Update the user question with the new review date and increment the review count
    const { data: updatedUserQuestion, error: updateError } = await supabase
      .from("user_questions")
      .update({
        difficulty_rating: difficultyRating,
        next_review_date: formatDateForDB(nextReviewDate),
        review_count: userQuestion.review_count + 1,
        last_reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userQuestionId)
      .select(
        `
        id, 
        question_id, 
        difficulty_rating, 
        next_review_date, 
        review_count, 
        last_reviewed_at,
        questions:question_id (
          id,
          title,
          difficulty,
          tags,
          leetcode_id
        )
      `,
      )
      .single();

    if (updateError || !updatedUserQuestion) {
      console.error("Error updating user question:", updateError);
      return null;
    }

    // Handle the case where questions might be an array
    const questionData = Array.isArray(updatedUserQuestion.questions)
      ? updatedUserQuestion.questions[0]
      : updatedUserQuestion.questions;

    if (!questionData) {
      console.error("Question data is missing");
      return null;
    }

    // Transform the data to match our UserQuestion type
    return {
      id: updatedUserQuestion.id,
      question_id: updatedUserQuestion.question_id,
      question: {
        id: questionData.id,
        title: questionData.title,
        difficulty: questionData.difficulty,
        tags: questionData.tags,
        leetcode_id: questionData.leetcode_id,
      },
      difficulty_rating: updatedUserQuestion.difficulty_rating,
      next_review_date: updatedUserQuestion.next_review_date,
      review_count: updatedUserQuestion.review_count,
      last_reviewed_at: updatedUserQuestion.last_reviewed_at,
    };
  } catch (error) {
    console.error("Unexpected error in reviewQuestion:", error);
    return null;
  }
}

/**
 * Delete a question from the user's bank
 */
export async function deleteUserQuestion(
  userQuestionId: number,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_questions")
      .delete()
      .eq("id", userQuestionId);

    if (error) {
      console.error("Error deleting user question:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in deleteUserQuestion:", error);
    return false;
  }
}

/**
 * Search for LeetCode questions
 */
export async function searchLeetCodeQuestions(
  query: string,
): Promise<Question[]> {
  // Return empty array if query is empty
  if (!query.trim()) return [];

  const options = {
    keys: ["title", "tags"],
    threshold: 0.4,
    includeScore: true,
  };

  const fuse = new Fuse(leetcodeQuestions, options);
  const result = fuse.search(query);

  return result.map((res: any) => res.item);

  // // Filter questions based on the query
  // return leetcodeQuestions.filter(
  //   (q) =>
  //     q.title.toLowerCase().includes(query.toLowerCase()) ||
  //     q.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())) ||
  //     q.leetcode_id === query,
  // );
}
