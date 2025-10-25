// Placeholder blockchain client for points mint/read
export async function getPoints(addressOrUid) {
  // TODO: integrate real chain. For now, return mock number.
  return 100
}

export async function mintPoints(addressOrUid, amount) {
  // TODO: interaction to mint tokens; return tx hash
  return { txHash: '0xDEMO', amount }
}
