import React from "react";
import CleanDashboard from "@/components/dashboard/CleanDashboard";

const Index = () => {
  return (
    <div>
      {/* Show premium debug only in development */}
      <CleanDashboard />
    </div>
  );
};

export default Index;
