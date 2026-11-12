export interface SM2Card {
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export interface SM2Result {
  interval: number;
  easeFactor: number;
  repetitions: number;
  dueDate: Date;
}

export function calculateSM2(card: SM2Card, rating: 0 | 1 | 2 | 3): SM2Result {
  let { interval, easeFactor, repetitions } = card;

  switch (rating) {
    case 0: // Again
      repetitions = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;
    case 1: // Hard
      interval = Math.ceil(interval * 1.2);
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      break;
    case 2: // Good
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.ceil(interval * easeFactor);
      }
      repetitions++;
      break;
    case 3: // Easy
      if (repetitions === 0) {
        interval = Math.ceil(1 * 1.3);
      } else if (repetitions === 1) {
        interval = Math.ceil(6 * 1.3);
      } else {
        interval = Math.ceil(interval * easeFactor * 1.3);
      }
      easeFactor = easeFactor + 0.15;
      repetitions++;
      break;
  }

  interval = Math.min(interval, 36500);

  const dueDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

  return { interval, easeFactor, repetitions, dueDate };
}
