export default function RewardsList({ rewards = [], onRedeem }) {
  if (!rewards.length) return <div className="text-gray-500">No rewards yet.</div>
  return (
    <ul className="grid sm:grid-cols-2 gap-3">
      {rewards.map(r => (
        <li key={r.id} className="border rounded p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-sm text-gray-500">Cost: {r.cost} pts</div>
          </div>
          <button className="px-3 py-1.5 rounded bg-indigo-600 text-white" onClick={() => onRedeem?.(r)}>Redeem</button>
        </li>
      ))}
    </ul>
  )
}
