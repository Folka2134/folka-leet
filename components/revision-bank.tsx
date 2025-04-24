"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type UserQuestion,
  deleteUserQuestion,
  getUserQuestions,
} from "@/lib/api";
// import { useToast } from "@/components/ui/use-toast"
import { toast } from "sonner";

export function RevisionBank() {
  const [userQuestions, setUserQuestions] = useState<UserQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<UserQuestion[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // const { toast } = useToast();

  const fetchUserQuestions = async () => {
    setLoading(true);
    try {
      const questions = await getUserQuestions();
      setUserQuestions(questions);
      setFilteredQuestions(questions);
    } catch (error) {
      console.error("Error fetching user questions:", error);
      toast("Error", {
        description: "Failed to fetch your questions",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserQuestions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredQuestions(userQuestions);
    } else {
      const filtered = userQuestions.filter(
        (q) =>
          q.question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.question.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
      setFilteredQuestions(filtered);
    }
  }, [searchQuery, userQuestions]);

  const handleDelete = async (id: number) => {
    try {
      const success = await deleteUserQuestion(id);
      if (success) {
        toast("Sucess", {
          description: "Question removed from your bank",
        });
        // Update the list
        setUserQuestions(userQuestions.filter((q) => q.id !== id));
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast("Error", {
        description: "Failed to delete question",
      });
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          View Revision Bank
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Revision Bank</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Input
            type="search"
            placeholder="Search for Questions"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {loading ? (
            <div className="text-center py-8">Loading your questions...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {userQuestions.length === 0
                ? "No questions in your revision bank yet."
                : "No questions match your search."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Next Review</TableHead>
                  <TableHead>Review Count</TableHead>
                  <TableHead className="w-12">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuestions.map((question, index) => (
                  <TableRow key={question.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {question.question.title}
                    </TableCell>
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
                    <TableCell>
                      {formatDate(question.next_review_date)}
                    </TableCell>
                    <TableCell>{question.review_count}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(question.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Back to Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
