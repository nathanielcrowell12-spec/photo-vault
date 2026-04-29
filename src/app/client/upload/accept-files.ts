export function filterDroppedImages(fileList: FileList | File[] | null): File[] {
  if (!fileList) return []
  return Array.from(fileList).filter((f) => f.type.startsWith('image/'))
}
