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

const INT_16 = 65536;

let _idCounter = 0;
const MACHINE_ID = Math.floor(Math.random() * (INT_16)).toString(16);
const PID = Math.floor(Math.random() * (INT_16)).toString(16);

export const generateId = () => {
  const ts = Math.floor(Date.now() / 1000).toString(16);
  const count = (_idCounter++).toString(16);
  return "00000000".substr(0, 8 - ts.length) + ts +
    "000000".substr(0, 6 - MACHINE_ID.length) + MACHINE_ID +
    "0000".substr(0, 4 - PID.length) + PID +
    "000000".substr(0, 6 - count.length) + count;
};

export const getIDParts = (id: string) => {
  var ctr = 0;
  var timestamp   = parseInt(id.slice(ctr, ctr+=8), 16);
  var machineID   = parseInt(id.slice(ctr, ctr+=6), 16);
  var processID   = parseInt(id.slice(ctr, ctr+=4), 16);
  var counter     = parseInt(id.slice(ctr, ctr+=6), 16);
  return { timestamp, machineID, processID, counter};
};