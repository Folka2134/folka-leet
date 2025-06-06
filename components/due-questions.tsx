"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type UserQuestion, getDueQuestions, reviewQuestion } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "lucide-react";

export function DueQuestions() {
  const [dueQuestions, setDueQuestions] = useState<UserQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingQuestion, setReviewingQuestion] =
    useState<UserQuestion | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const fetchDueQuestions = async () => {
    setLoading(true);
    try {
      const questions = await getDueQuestions();
      setDueQuestions(questions);
    } catch (error) {
      console.error("Error fetching due questions:", error);
      toast("Error", {
        description: "Failed to fetch due questions",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueQuestions();
  }, []);

  const handleReview = (question: UserQuestion) => {
    setReviewingQuestion(question);
  };

  const handleDifficultySelection = async (
    difficulty: "Easy" | "Medium" | "Hard",
  ) => {
    if (!reviewingQuestion) return;

    setIsReviewing(true);
    try {
      const result = await reviewQuestion(reviewingQuestion.id, difficulty);
      if (result) {
        toast("Success", {
          description: `Question reviewed successfully. Next review: ${formatDate(result.next_review_date)}`,
        });
        // Refresh the due questions
        fetchDueQuestions();
      } else {
        toast("Error", {
          description: "Failed to review question",
        });
      }
    } catch (error) {
      console.error("Error reviewing question:", error);
      toast("Error", {
        description: "Failed to review question",
      });
    } finally {
      setIsReviewing(false);
      setReviewingQuestion(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Questions due for revision:</h2>
        <div className="flex items-center gap-2">
          <div className="text-right">
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDueQuestions}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center">Loading due questions...</div>
      ) : dueQuestions.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No questions due for revision today.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Current Review Date</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Revision Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dueQuestions.map((question, index) => (
              <TableRow
                key={question.id}
                onClick={() => handleReview(question)}
                className="hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer transition-colors"
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">
                  {question.question.title}
                </TableCell>
                <TableCell>{formatDate(question.next_review_date)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {question.question.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{question.question.difficulty}</TableCell>
                <TableCell>{question.review_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={!!reviewingQuestion}
        onOpenChange={(open) => !open && setReviewingQuestion(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <a
                className="flex items-center gap-2 underline underline-offset-2 transition-all hover:opacity-70"
                href={reviewingQuestion?.question.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {reviewingQuestion?.question.title}
                <Link size={14} />
              </a>
            </DialogTitle>
            <DialogDescription>
              How difficult did you find this question?
            </DialogDescription>
          </DialogHeader>

          {reviewingQuestion && (
            <div className="pb-4">
              <div className="mt-2 flex flex-wrap gap-1">
                {reviewingQuestion.question.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Review count: {reviewingQuestion.review_count}
                {reviewingQuestion.last_reviewed_at &&
                  ` | Last reviewed: ${formatDate(reviewingQuestion.last_reviewed_at)}`}
              </p>
            </div>
          )}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              className="border-green-300 bg-green-100 hover:bg-green-200"
              onClick={() => handleDifficultySelection("Easy")}
              disabled={isReviewing}
            >
              Easy
            </Button>
            <Button
              variant="outline"
              className="border-yellow-300 bg-yellow-100 hover:bg-yellow-200"
              onClick={() => handleDifficultySelection("Medium")}
              disabled={isReviewing}
            >
              Medium
            </Button>
            <Button
              variant="outline"
              className="border-red-300 bg-red-100 hover:bg-red-200"
              onClick={() => handleDifficultySelection("Hard")}
              disabled={isReviewing}
            >
              Hard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
