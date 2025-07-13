export type Department = 
  | 'Python Developer'
  | 'R&D'
  | 'Sales'
  | 'Marketing'
  | 'Project Coordinators'
  | 'QA'
  | 'Delivery Manager'
  | 'IT'
  | 'General';

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
  department: Department;
}

export interface UserAnswer {
  questionId: string;
  selectedOption: string;
}

export interface TestResult {
  _id: string; // Changed from ObjectId to string for simplicity with JSON files
  userId: string;
  testId: string;
  score: number;
  totalPoints: number;
  answers: UserAnswer[];
  submittedAt: Date;
  testTitle: string;
  department: Department;
}
