export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimit: number; // in minutes
}

export interface UserAnswer {
  questionId: string;
  selectedOption: string;
}

export interface TestResult {
  id: string;
  userId: string;
  testId: string;
  score: number;
  totalPoints: number;
  answers: UserAnswer[];
  submittedAt: Date;
}
