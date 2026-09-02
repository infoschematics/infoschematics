export type InterfaceConfig = {
  id: string;
  prefix: string;
  owner: string;
  document: "none" | "ours" | "theirs";
  contract?: string;
  href?: string;
  label: string;
  description: string;
  operations?: readonly { id: string; summary: string }[];
};
