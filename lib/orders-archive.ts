export function isMissingArchiveColumnError(message: string) {
  return (
    /archived/i.test(message) &&
    (/does not exist/i.test(message) || /could not find/i.test(message))
  )
}
