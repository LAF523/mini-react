export const isObject = (v) => {
  return typeof v === "object" && v !== null;
};
export const { isArray } = Array;
export const isString = (v) => typeof v === "string";
