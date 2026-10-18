export function focusFirstInvalid(errors: Readonly<Record<string, string | undefined>>, idPrefix: string): void {
  const firstField = Object.keys(errors).find((field) => errors[field]);
  if (firstField) document.getElementById(`${idPrefix}-${firstField}`)?.focus();
}
