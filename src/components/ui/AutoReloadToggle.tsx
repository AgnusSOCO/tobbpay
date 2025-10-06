import { useState, useEffect } from 'react';

const AutoReloadToggle = ({
  onReload,
  interval = 5000,
}: {
  onReload: () => void;
  interval?: number;
}) => {
  const [autoReload, setAutoReload] = useState(false);

  useEffect(() => {
    if (!autoReload) return;

    onReload(); // immediate call

    const timer = setInterval(() => {
      onReload();
    }, interval);

    return () => clearInterval(timer);
  }, [autoReload, interval, onReload]);

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="auto-reload" className="text-sm font-medium text-gray-700">
        Auto Reload
      </label>
      <button
        id="auto-reload"
        onClick={() => setAutoReload(!autoReload)}
        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
          autoReload ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
            autoReload ? 'translate-x-4' : ''
          }`}
        ></div>
      </button>
    </div>
  );
};

export default AutoReloadToggle;
