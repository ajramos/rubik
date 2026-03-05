export type AlgSet = "OLL" | "PLL" | "F2L";

export type AlgItem = {
  id: string;
  set: AlgSet;
  name: string;
  alg: string;
  thumb?: string;
  alts?: string[];
  caseSetupAlg?: string;
};

export type F2LCase = {
  id: string;
  name: string;
  alg: string;
  caseSetupAlg?: string;
  note: string;
  setup?: string;
  tags: Array<
    | "right-slot"
    | "left-slot"
    | "intuitive"
    | "trigger"
    | "recovery"
    | "extraction"
    | "connected"
    | "pairing"
    | "advanced"
  >;
};

export type F2LSection = {
  key: string;
  title: string;
  description: string;
  tone: "sand" | "sage" | "rose" | "sky";
  cases: F2LCase[];
};

export type AlgsData = {
  oll: AlgItem[];
  pll: AlgItem[];
  f2lCanonicalSections: F2LSection[];
  f2lDrillSections: F2LSection[];
};
