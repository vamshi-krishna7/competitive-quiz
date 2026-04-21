import { randomUUID } from "crypto";

export type Question = {
  id: string;
  prompt: string;
  answer: number;
  createdAt: number;
};

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

type Template = () => { prompt: string; answer: number };

const templates: Template[] = [
  () => {
    const a = randInt(10, 99);
    const b = randInt(10, 99);
    return { prompt: `${a} + ${b}`, answer: a + b };
  },
  () => {
    const a = randInt(20, 99);
    const b = randInt(1, a);
    return { prompt: `${a} - ${b}`, answer: a - b };
  },
  () => {
    const a = randInt(2, 12);
    const b = randInt(2, 12);
    return { prompt: `${a} × ${b}`, answer: a * b };
  },
  () => {
    const b = randInt(2, 12);
    const q = randInt(2, 12);
    return { prompt: `${b * q} ÷ ${b}`, answer: q };
  },
  () => {
    const a = randInt(2, 9);
    const b = randInt(1, 20);
    const x = randInt(1, 15);
    const c = a * x + b;
    return { prompt: `Solve for x: ${a}x + ${b} = ${c}`, answer: x };
  },
  () => {
    const base = randInt(2, 9);
    const exp = randInt(2, 4);
    return { prompt: `${base}^${exp}`, answer: Math.pow(base, exp) };
  },
];

export function generateQuestion(): Question {
  const template = templates[randInt(0, templates.length - 1)];
  const { prompt, answer } = template();
  return { id: randomUUID(), prompt, answer, createdAt: Date.now() };
}
