// Shape returned by the Privacy, Settings and Summary server actions.
// ok = true means success. errors are per-field messages, message is a general one.
export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};
