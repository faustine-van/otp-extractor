type Props = {
  authenticated: boolean;
  onLogout: () => void;
};

export function Header({ authenticated, onLogout }: Props) {
  return (
    <div className="header">
      <div className="header-left">
        <img
          src="/icons/icon48.png"
          alt="OTP Extractor"
          width={24}
          height={24}
          style={{ borderRadius: 6 }}
        />
        <span className="header-title">OTP Extractor</span>
      </div>
      {authenticated && (
        <button className="btn-logout" onClick={onLogout}>
          Logout
        </button>
      )}
    </div>
  );
}