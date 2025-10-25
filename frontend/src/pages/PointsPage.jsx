import { useEffect, useState } from 'react'
import PointsBalance from '../components/PointsBalance'
import RewardsList from '../components/RewardsList'
import { getUserPoints, redeemReward } from '../utils/FastAPIClient'
import { subscribeAuth } from '../utils/FirebaseAuth'

const DEMO_REWARDS = [
  { id: 'r1', name: 'Coffee', cost: 50 },
  { id: 'r2', name: 'Museum Pass', cost: 120 },
]

export default function PointsPage() {
  const [user, setUser] = useState(null)
  const [points, setPoints] = useState(0)

  useEffect(() => subscribeAuth(setUser), [])
  useEffect(() => {
    if (!user) return
    (async () => {
      try {
        const data = await getUserPoints(user.uid)
        setPoints(data?.points ?? 0)
      } catch (e) {
        console.warn('Using demo points (backend unavailable)')
        setPoints(100)
      }
    })()
  }, [user])

  const onRedeem = async (reward) => {
    if (!user) return alert('Login required')
    try {
      await redeemReward(user.uid, reward.id)
      setPoints(p => Math.max(0, p - reward.cost))
      alert('Redeemed!')
    } catch (e) {
      console.warn('Demo redeem (backend unavailable)')
      setPoints(p => Math.max(0, p - reward.cost))
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Your Points</h1>
      <PointsBalance points={points} />
      <div>
        <h2 className="text-lg font-medium mt-6 mb-2">Rewards</h2>
        <RewardsList rewards={DEMO_REWARDS} onRedeem={onRedeem} />
      </div>
    </div>
  )
}
