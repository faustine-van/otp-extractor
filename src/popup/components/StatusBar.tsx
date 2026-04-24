type Props = {
  showClear: boolean;
  onClear: () => void;
};

export function StatusBar({ showClear, onClear }: Props) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-dot pulse-dot" />
        <span className="status-text">Monitoring Gmail</span>
      </div>
      {showClear && (
        <button className="btn-clear" onClick={onClear}>
          Clear all
        </button>
      )}
    </div>
  );
}