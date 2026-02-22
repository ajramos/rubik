export type AlgSet = "OLL" | "PLL";

export type AlgItem = {
  id: string;
  set: AlgSet;
  name: string;
  alg: string;
  thumb?: string;
};
