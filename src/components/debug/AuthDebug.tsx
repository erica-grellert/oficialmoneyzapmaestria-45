
import React from 'react';
import { useAdaptiveContext } from '@/hooks/useAdaptiveContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AuthDebug: React.FC = () => {
  const { user, isLoading } = useAdaptiveContext();

  return (
    <Card className="fixed bottom-4 right-4 w-64 bg-background/95 backdrop-blur-sm border z-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Debug - Auth Status</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-1">
        <div>Loading: {isLoading ? 'true' : 'false'}</div>
        <div>User: {user ? 'Logado' : 'Não logado'}</div>
        {user && (
          <>
            <div>Email: {user.email}</div>
            <div>Name: {user.name}</div>
            <div>ID: {user.id}</div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthDebug;
