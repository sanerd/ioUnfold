/**
 * Removes duplicate objects from an array based on a specific key.
 * Time Complexity: O(n)
 */
export function removeDuplicatesById<T extends Record<string, any>>(
  array: T[],
  key: keyof T = 'id'
): T[] {
  const seen = new Set();
  const result: T[] = [];

  for (let i = 0; i < array.length; i++) {
    const value = array[i][key];
    if (!seen.has(value)) {
      seen.add(value);
      result.push(array[i]);
    }
  }

  return result;
}
