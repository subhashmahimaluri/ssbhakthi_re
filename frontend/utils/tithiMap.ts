export const tithiMap: Record<string, number[]> = {
  padyami: [0, 15],
  vidhiya: [1, 16],
  thadiya: [2, 17],
  chaviti: [3, 18],
  panchami: [4, 19],
  shasti: [5, 20],
  saptami: [6, 21],
  ashtami: [7, 22],
  navami: [8, 23],
  dasami: [9, 24],
  ekadasi: [10, 25],
  dvadasi: [11, 26],
  trayodasi: [12, 27],
  chaturdasi: [13, 28],
  pournami: [14],
  amavasya: [29],
};

export function getTithiNumbersByName(name: string): number[] | null {
  return tithiMap[name.toLowerCase()] ?? null;
}
