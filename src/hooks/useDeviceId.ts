import { useEffect, useState } from 'react';
import { getDeviceId } from '@services/convex';

export function useDeviceId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    getDeviceId().then(setId);
  }, []);
  return id;
}
