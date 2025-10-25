export default function PointsBalance({ points = 0 }) {
  return (
    <div className="px-3 py-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
      Points: <span className="font-semibold">{points}</span>
    </div>
  )
}
