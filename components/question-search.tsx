"use client";

import type React from "react";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  type Question,
  addQuestionToBank,
  searchLeetCodeQuestions,
} from "@/lib/api";
import { toast } from "sonner";

export function QuestionSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Question[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchLeetCodeQuestions(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching questions:", error);
      toast("Error", {
        description: "Failed to search for questions",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddQuestion = async (question: Question) => {
    try {
      console.log("Adding question:", question);
      const result = await addQuestionToBank(question);

      if (result == true) {
        toast("Info", {
          description: `${question.title} is already in your revision bank`,
        });
        return;
      }

      if (result) {
        toast("Success", {
          description: `Added "${question.title}" to your revision bank`,
        });

        // Refresh the page to show the new question in the due questions list
        window.location.reload();
      } else {
        toast("Error", {
          description:
            "Failed to add question to your bank. Check console for details.",
        });
      }
    } catch (error) {
      console.error("Error adding question:", error);
      toast("Error", {
        description: `Failed to add question: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  };

  // Function to get color based on difficulty
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500";
      case "Medium":
        return "bg-yellow-500";
      case "Hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Add a LeetCode Question to Revision Bank:
      </h2>
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="search"
          placeholder="Search for Questions"
          value={searchQuery}
          onChange={(e) => {
            const input = e.target.value;
            setSearchQuery(input);

            if (!input.trim()) {
              setSearchResults([]);
            }
          }}
          className="flex-1"
        />
        <Button type="submit" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 font-medium text-gray-400">
            <div>Title</div>
            <div>Difficulty</div>
            <div>Tags</div>
          </div>
          {searchResults.map((question) => (
            <div
              key={question.id}
              className="grid grid-cols-3 gap-4 items-center border-b p-2 cursor-pointer transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted rounded-md"
              onClick={() => handleAddQuestion(question)}
            >
              <div className="font-medium">{question.title}</div>
              <div>
                <span
                  className={`inline-block px-2 py-1 rounded text-white text-xs ${getDifficultyColor(
                    question.difficulty,
                  )}`}
                >
                  {question.difficulty}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {question.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
