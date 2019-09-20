export type KeyValue<TValue> = {
  [identifier: string]: TValue
};

export const shallowEquals = (a, b) => {
  const toa = typeof a;
  const tob = typeof b;

  if (toa !== tob) {
    return false;
  }

  if (toa !== "object" || !a || !b) {
    return a === b;
  }

  if (Object.keys(a).length !== Object.keys(b).length) {
    return false;
  }

  for (const key in a) {
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
};

export const arraySplice = <T>(
  target: T[],
  index: number,
  count: number = 1,
  ...replacements: T[]
) => [
  ...target.slice(0, index), // [0, 0] [text],
  ...replacements,
  ...target.slice(index + count)
];


export const seed = `${Math.round(Math.random() * 9999)}`;
let _idCount = 0;

export const generateId = () => {
  return `${seed}${++_idCount}`;
}