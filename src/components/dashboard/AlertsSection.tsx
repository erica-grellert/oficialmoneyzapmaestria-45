
import React from 'react';
import { Bell, CreditCard, AlertTriangle, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Alert {
  id: string;
  type: 'notification' | 'due-date' | 'budget-warning';
  title: string;
  description: string;
  action: () => void;
}

interface AlertsSectionProps {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
}

const AlertsSection: React.FC<AlertsSectionProps> = ({ alerts, onAlertClick }) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'notification':
        return <Bell className="h-4 w-4 text-blue-600" />;
      case 'due-date':
        return <CreditCard className="h-4 w-4 text-amber-600" />;
      case 'budget-warning':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'notification':
        return 'bg-blue-50 border-blue-200';
      case 'due-date':
        return 'bg-amber-50 border-amber-200';
      case 'budget-warning':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {alerts.slice(0, 3).map((alert) => (
        <Card 
          key={alert.id}
          className={`cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${getAlertBgColor(alert.type)}`}
          onClick={() => onAlertClick(alert)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 text-sm leading-tight">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {alert.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AlertsSection;
