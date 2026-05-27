interface HeaderProps {
  apiBaseUrl: string;
  onApiBaseUrlChange: (value: string) => void;
  onSave: () => void;
}

export function Header({ apiBaseUrl, onApiBaseUrlChange, onSave }: HeaderProps) {
  return (
    <header className="header">
      <div className="brand-lockup">
        <img className="brand-logo" src="/truuth-logo.png" alt="truuth" />
        <div className="brand-subtitle">Screening Dashboard</div>
      </div>
      <div className="api-control">
        <label htmlFor="apiBase">API</label>
        <input
          id="apiBase"
          value={apiBaseUrl}
          onChange={(event) => onApiBaseUrlChange(event.target.value)}
        />
        <button className="btn primary" type="button" onClick={onSave}>
          Save
        </button>
      </div>
    </header>
  );
}
