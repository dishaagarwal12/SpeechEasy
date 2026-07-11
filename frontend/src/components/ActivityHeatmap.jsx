// src/components/ActivityHeatmap.jsx

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getColorForCount(count) {
  if (count === 0) return 'var(--border-color)';
  if (count === 1) return '#f6e3c4';
  if (count === 2) return '#efc783';
  if (count === 3) return '#e08e1d';
  return '#e8961f';
}

function ActivityHeatmap({ activityByDate }) {
  const year = new Date().getFullYear();

  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);

  // Pad out to complete weeks so columns align to Sunday-start rows,
  // but we'll render the padding days as INVISIBLE cells below —
  // the visible calendar itself only ever shows Jan 1 through Dec 31.
  const rangeStart = new Date(jan1);
  rangeStart.setDate(rangeStart.getDate() - rangeStart.getDay());

  const rangeEnd = new Date(dec31);
  rangeEnd.setDate(rangeEnd.getDate() + (6 - rangeEnd.getDay()));

  const days = [];
  const cursor = new Date(rangeStart);
  while (cursor <= rangeEnd) {
    const dateKey = cursor.toISOString().split('T')[0];
    days.push({
      date: new Date(cursor),
      count: activityByDate[dateKey] || 0,
      inYear: cursor >= jan1 && cursor <= dec31,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthLabels = weeks.map((week) => {
    const firstOfMonth = week.find((day) => day.inYear && day.date.getDate() === 1);
    return firstOfMonth ? MONTH_LABELS[firstOfMonth.date.getMonth()] : '';
  });

  const ROW_GAP = 3;
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
    gap: `${ROW_GAP}px`,
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', width: '100%' }}>
        <div style={{ width: '30px', flexShrink: 0 }} />
        <div style={{ ...gridStyle, flex: 1 }}>
          {monthLabels.map((label, i) => (
            <span key={i} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', width: '100%', marginTop: '4px' }}>
        <div
          style={{
            width: '30px',
            flexShrink: 0,
            display: 'grid',
            gridTemplateRows: `repeat(7, 1fr)`,
            gap: `${ROW_GAP}px`,
          }}
        >
          {DAY_LABELS.map((label, i) => (
            <span key={i} style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              {label}
            </span>
          ))}
        </div>

        <div style={{ ...gridStyle, gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', flex: 1 }}>
          {weeks.map((week, wi) =>
            week.map((day, di) =>
              day.inYear ? (
                <div
                  key={`${wi}-${di}`}
                  title={`${day.date.toISOString().split('T')[0]}: ${day.count} session${day.count === 1 ? '' : 's'}`}
                  style={{
                    aspectRatio: '1 / 1',
                    borderRadius: '2px',
                    backgroundColor: getColorForCount(day.count),
                  }}
                />
              ) : (
                // Out-of-year padding day — invisible, just holds grid position
                <div key={`${wi}-${di}`} style={{ aspectRatio: '1 / 1' }} />
              )
            )
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', marginLeft: '30px' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {year} activity
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Less</span>
          {[0, 1, 2, 3, 4].map((n) => (
            <div key={n} style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: getColorForCount(n) }} />
          ))}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>More</span>
        </div>
      </div>
    </div>
  );
}

export default ActivityHeatmap;