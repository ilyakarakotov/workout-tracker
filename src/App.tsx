import { useState } from 'react'
import type { ViewId } from './lib/views'
import { TabBar } from './components/TabBar'
import { useStore } from './store/store'
import { TodayView } from './features/today/TodayView'
import { ActiveSessionGate } from './features/today/ActiveSessionGate'
import { HistoryView } from './features/history/HistoryView'
import { ProgressView } from './features/progress/ProgressView'
import { PlanView } from './features/plan/PlanView'

export default function App() {
  const [view, setView] = useState<ViewId>('today')
  const hasActive = useStore((s) => s.activeSession !== null)
  const sessionMinimized = useStore((s) => s.sessionMinimized)

  return (
    <>
      <main>
        {view === 'today' && <TodayView />}
        {view === 'history' && <HistoryView />}
        {view === 'progress' && <ProgressView />}
        {view === 'plan' && <PlanView />}
      </main>
      {(!hasActive || sessionMinimized) && <TabBar active={view} onChange={setView} />}
      <ActiveSessionGate />
    </>
  )
}
