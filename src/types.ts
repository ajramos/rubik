export type AlgSet = "OLL" | "PLL" | "F2L";

export type AlgItem = {
  id: string;
  set: AlgSet;
  name: string;
  alg: string;
  thumb?: string;
  alts?: string[];
};
