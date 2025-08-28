import { getConfigInfo } from "@/services/configService";

export const ConfigDebug = () => {
  const config = getConfigInfo();

  return (
    <div className="p-4 bg-gray-100 rounded-lg text-sm font-mono">
      <h3 className="font-bold mb-2">App Configuration Debug</h3>
      <div className="space-y-1">
        <div>
          <strong>Mode:</strong>{" "}
          <span className="text-blue-600">{config.mode}</span>
        </div>
        <div>
          <strong>Supabase URL:</strong>{" "}
          <span className="text-gray-600">
            {config.supabaseUrl || "Not set"}
          </span>
        </div>
        <div>
          <strong>Using Mock:</strong>{" "}
          <span
            className={config.shouldUseMock ? "text-red-600" : "text-green-600"}
          >
            {config.shouldUseMock ? "Yes" : "No"}
          </span>
        </div>
      </div>
    </div>
  );
};
