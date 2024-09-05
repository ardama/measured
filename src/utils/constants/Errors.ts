export const NoError = { hasError: false, msg: '' };
export const EmptyError = { hasError: true, msg: '' };
export const Error = (msg: string) => ({ hasError: true, msg });