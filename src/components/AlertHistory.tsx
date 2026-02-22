/**
 * AlertHistory Component - Display list of alert history
 */

'use client';

import { AlertMessage } from '@/types';

interface AlertHistoryProps {
  alerts: AlertMessage[];
  type: 'sent' | 'received';
}

export default function AlertHistory({ alerts, type }: AlertHistoryProps) {
  if (alerts.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">
          {type === 'sent' ? 'Belum ada alert yang dikirim' : 'Belum ada alert yang diterima'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-bold text-white mb-4">
        {type === 'sent' ? 'Riwayat Alert Terkirim' : 'Riwayat Alert Diterima'}
      </h2>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-gray-700 rounded-lg p-4 border-l-4 border-red-500"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-white font-semibold">{alert.message}</span>
              {alert.acknowledged && (
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                  ✓ Diterima
                </span>
              )}
            </div>
            <div className="text-sm text-gray-400">
              <p>Lokasi: {alert.location}</p>
              <p>{new Date(alert.timestamp).toLocaleString('id-ID')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
