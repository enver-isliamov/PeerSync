import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';
import { QrScanner } from './QrScanner';
import { CopyIcon } from './icons/CopyIcon';
import { Spinner } from './icons/Spinner';

interface JoinSyncModalProps {
  onClose: () => void;
  onOfferScanned: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit | null>;
}

export const JoinSyncModal: React.FC<JoinSyncModalProps> = ({ onClose, onOfferScanned }) => {
  const [step, setStep] = useState<'scan' | 'copy'>('scan');
  const [answer, setAnswer] = useState<RTCSessionDescriptionInit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleScan = async (data: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const offer = JSON.parse(data) as RTCSessionDescriptionInit;
      if (offer.type !== 'offer' || !offer.sdp) {
        throw new Error('Некорректный QR-код.');
      }
      const generatedAnswer = await onOfferScanned(offer);
      if (generatedAnswer) {
        setAnswer(generatedAnswer);
        setStep('copy');
      } else {
        throw new Error('Не удалось создать ответ.');
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Ошибка при обработке QR-кода.');
      // Stay on scan step to allow retry
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = () => {
    if (answer) {
      navigator.clipboard.writeText(JSON.stringify(answer));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
        <h2 className="text-2xl font-bold text-white mb-4">Присоединиться к синхронизации</h2>
        
        {step === 'scan' && (
          <div className="space-y-4">
            <p className="text-slate-300">Наведите камеру на QR-код на другом устройстве.</p>
            {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center">
                    <Spinner className="w-10 h-10 mb-4"/>
                    <p>Обработка...</p>
                </div>
            ) : (
                <QrScanner onScan={handleScan} onClose={onClose} />
            )}
            {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
          </div>
        )}

        {step === 'copy' && answer && (
          <div className="space-y-4">
            <p className="text-slate-300">Скопируйте этот ответ и вставьте его на первом устройстве.</p>
            <textarea
              readOnly
              value={JSON.stringify(answer, null, 2)}
              className="w-full h-40 bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-300 font-mono text-xs"
            />
            <button onClick={handleCopy} className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-sky-500 transition-colors">
              <CopyIcon className="w-5 h-5 mr-2" />
              {copied ? 'Скопировано!' : 'Скопировать ответ'}
            </button>
            <p className="text-xs text-slate-500 text-center">После подключения это окно можно будет закрыть.</p>
          </div>
        )}

      </div>
    </div>
  );
};