declare module '@angular/forms/signals' {
  export interface FormValueControl<T = unknown> {}

  export type ValidationResult<T = unknown> = T | readonly T[] | null;
}
