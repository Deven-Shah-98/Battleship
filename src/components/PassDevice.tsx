interface PassDeviceProps {
  playerName: string;
  onReady: () => void;
}

export default function PassDevice({ playerName, onReady }: PassDeviceProps) {
  return (
    <div className="pass-device-overlay" role="alertdialog" aria-label="Pass device">
      <div className="pass-device">
        <h2>Pass the device</h2>
        <p>
          It&apos;s <strong>{playerName}&apos;s</strong> turn.
        </p>
        <p className="pass-device__hint">
          Hand the device to {playerName}, then press Ready.
        </p>
        <button
          type="button"
          className="btn-primary pass-device__btn"
          onClick={onReady}
          autoFocus
        >
          Ready
        </button>
      </div>
    </div>
  );
}
