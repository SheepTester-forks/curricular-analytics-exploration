export function chunks<T> (arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  let chunk: T[] = []
  for (const item of arr) {
    chunk.push(item)
    if (chunk.length === size) {
      chunks.push(chunk)
      chunk = []
    }
  }
  if (chunk.length > 0) {
    chunks.push(chunk)
  }
  return chunks
}
