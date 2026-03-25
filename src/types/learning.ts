export type WordEntry = {
  id: string;
  dz: string;
  fr: string;
  type: "word" | "expression";
  frequencyScore: number;
  examples: string[];
};

export type Module = {
  id: string;
  name: string;
  description: string;
  order: number;
};

export type SubModule = {
  id: string;
  moduleId: string;
  name: string;
  order: number;
};

export type SubModuleItem = {
  id: string;
  subModuleId: string;
  wordId: string;
  order: number;
};

export type WordProgress = {
  word_id: string;
  success_count: number;
  failure_count: number;
  last_seen: string | null;
  mastery_level: 0 | 1 | 2 | 3;
};

export type SessionScope =
  | {
      type: "global";
    }
  | {
      type: "module";
      moduleId: string;
    }
  | {
      type: "submodule";
      moduleId: string;
      subModuleId: string;
    };

export type SessionItem = {
  word_id: string;
  mode: "mcq" | "recall";
  difficulty: number;
  options: string[];
};
