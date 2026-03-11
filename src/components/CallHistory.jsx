import './CallHistory.css'

function formatDuration(seconds) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function CallHistory({ history }) {
  if (!history.length) {
    return (
      <div className="card call-history">
        <h2>📋 Call History</h2>
        <p className="empty-state">No calls yet. Start a call to see your history here.</p>
      </div>
    )
  }

  return (
    <div className="card call-history">
      <h2>📋 Call History</h2>
      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Phone Number</th>
              <th>Start Time</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((call, idx) => (
              <tr key={call.callSid || idx}>
                <td>{call.phoneNumber || '—'}</td>
                <td>{formatTime(call.startTime)}</td>
                <td>{formatDuration(call.duration)}</td>
                <td>
                  <span className="status-pill completed">Completed</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CallHistory
