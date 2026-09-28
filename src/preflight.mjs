export async function requireArrangementAbsent(readArrangement, arrangementId) {
  try {
    const existing = await readArrangement(arrangementId)
    if (existing) throw new Error("Arrangement already exists")
  } catch (error) {
    if (error instanceof Error && error.message === "Arrangement already exists") throw error
    // A missing-record read is the expected path. Transport errors must be
    // tagged explicitly by the adapter instead of being treated as absence.
    if (!error || error.code !== "ARRANGEMENT_NOT_FOUND") throw error
  }
  return true
}
