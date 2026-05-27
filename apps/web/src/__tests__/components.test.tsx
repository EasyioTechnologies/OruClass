import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { QuizRenderer } from "../components/tools/QuizRenderer";
import { ReflectionJournal } from "../components/tools/ReflectionJournal";

const baseModule = {
  id: "m1",
  trainingId: "t1",
  title: "Test Module",
  moduleType: "quiz" as const,
  position: 0,
  isUnlocked: true,
  config: {
    questions: [
      {
        id: "q1",
        text: "What is 2+2?",
        type: "multiple_choice" as const,
        options: ["3", "4", "5"],
      },
    ],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("QuizRenderer", () => {
  it("renders question text", () => {
    render(<QuizRenderer module={baseModule as any} trainingId="t1" />);
    expect(screen.getByText("What is 2+2?")).toBeTruthy();
  });

  it("renders answer options", () => {
    render(<QuizRenderer module={baseModule as any} trainingId="t1" />);
    expect(screen.getByText("4")).toBeTruthy();
  });
});

describe("ReflectionJournal", () => {
  it("renders textarea", () => {
    const mod = { ...baseModule, moduleType: "reflection" as const, config: {} };
    render(<ReflectionJournal module={mod as any} trainingId="t1" />);
    expect(screen.getByRole("textbox")).toBeTruthy();
  });
});
