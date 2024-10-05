type StripExcessFields<T, U> = {
  [K in keyof T]: K extends keyof U ? U[K] : never
}

export const stripExcessFields = <T extends object, U extends Record<string, any>>(obj: U, type: T): T => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => key in type)
  ) as T;
}