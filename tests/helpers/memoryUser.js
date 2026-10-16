// Atomic in-memory updates for exercising concurrent password recovery without
// a database. Match the query predicates used by the recovery operations.
export function memoryUser(initial) {
  let value = structuredClone(initial);
  const equal = (a, b) => a instanceof Date || b instanceof Date
    ? new Date(a).getTime() === new Date(b).getTime() : a === b;
  const matches = (query) => value && Object.entries(query).every(([key, expected]) => {
    if (key === '$or') return expected.some(matches);
    const actual = value[key];
    if (expected === null) return actual == null;
    if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
      return Object.entries(expected).every(([op, target]) => ({
        $ne: () => !equal(actual, target) && actual !== undefined,
        $lt: () => actual < target,
        $lte: () => actual <= target,
        $gt: () => actual > target,
      })[op]?.());
    }
    return equal(actual, expected);
  });
  return {
    get value() { return value; },
    set value(next) { value = next; },
    findById(id) {
      return { select: async () => value && value._id === id ? structuredClone(value) : null };
    },
    async findOneAndUpdate(query, update) {
      if (!matches(query)) return null;
      Object.assign(value, update.$set);
      for (const [key, amount] of Object.entries(update.$inc || {})) value[key] = (value[key] || 0) + amount;
      return structuredClone(value);
    },
  };
}
