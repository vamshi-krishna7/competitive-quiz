import { EventEmitter } from "events";
import { generateQuestion, Question } from "./questions.js";

export type Winner = {
  userId: string;
  username: string;
  solveMs: number;
};

export type PublicQuestion = Omit<Question, "answer">;

type Round = {
  question: Question;
  winner: Winner | null;
};

const REVEAL_DELAY_MS = 3000;

export class GameEngine extends EventEmitter {
  private round: Round;
  private submitLocks = new Set<string>();

  constructor() {
    super();
    this.round = { question: generateQuestion(), winner: null };
  }

  getPublicQuestion(): PublicQuestion {
    const { answer, ...rest } = this.round.question;
    return rest;
  }

  getWinner(): Winner | null {
    return this.round.winner;
  }

  submit(
    userId: string,
    username: string,
    questionId: string,
    answerText: string
  ): { status: "stale" | "rate_limited" | "wrong" | "late" | "correct"; winner?: Winner } {
    if (this.submitLocks.has(userId)) return { status: "rate_limited" };
    this.submitLocks.add(userId);
    setTimeout(() => this.submitLocks.delete(userId), 500);

    if (questionId !== this.round.question.id) return { status: "stale" };
    if (this.round.winner) return { status: "late" };

    const parsed = Number(answerText.trim());
    if (!Number.isFinite(parsed)) return { status: "wrong" };
    if (parsed !== this.round.question.answer) return { status: "wrong" };

    if (this.round.winner) return { status: "late" };

    const winner: Winner = {
      userId,
      username,
      solveMs: Date.now() - this.round.question.createdAt,
    };
    this.round.winner = winner;
    this.emit("winner", winner, this.round.question);

    setTimeout(() => this.advance(), REVEAL_DELAY_MS);

    return { status: "correct", winner };
  }

  private advance() {
    this.round = { question: generateQuestion(), winner: null };
    this.emit("question", this.getPublicQuestion());
  }
}
