import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { XIcon } from './icons/XIcon';
import { Spinner } from './icons/Spinner';
import { CopyIcon } from './icons/CopyIcon';

interface ConnectPeerModalProps {
  offer: RTCSessionDescriptionInit | null;
  onClose: () => void;
  onAnswerSubmit: (answer: string) => void;
}

export const ConnectPeerModal: React.FC<ConnectPeerModalProps> = ({ offer, onClose, onAnswerSubmit }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const offerString = offer ? JSON.stringify(offer) : '';

  useEffect(() => {
    if (offer) {
      setIsLoading(true);
      QRCode.toDataURL(offerString, { errorCorrectionLevel: 'L', margin: 2 })
        .then(url => {
          setQrCodeUrl(url);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [offer, offerString]);
  
  const handleCopyOffer = () => {
    navigator.clipboard.writeText(offerString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onAnswerSubmit(answer.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
        <h2 className="text-2xl font-bold text-white mb-4">Подключить устройство</h2>
        <div className="space-y-6">
          <div>
            <p className="text-slate-300 mb-2">1. На другом устройстве отсканируйте этот QR-код.</p>
            <div className="aspect-square bg-white p-2 rounded-lg flex items-center justify-center mx-auto max-w-[256px]">
              {isLoading && <Spinner className="w-10 h-10" />}
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code Offer" />}
            </div>
            <div className="text-center mt-2">
                 <button onClick={handleCopyOffer} className="text-sm text-sky-400 hover:text-sky-300 flex items-center mx-auto">
                    <CopyIcon className="w-4 h-4 mr-2"/>
                    {copied ? 'Скопировано!' : 'Скопировать предложение'}
                 </button>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <p className="text-slate-300 mb-2">2. Вставьте сюда "ответ" со второго устройства.</p>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full h-28 bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
              placeholder="Вставьте сюда сгенерированный ответ..."
              required
            />
            <button type="submit" className="w-full mt-4 bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-500 transition-colors disabled:opacity-50" disabled={!answer.trim()}>
              Подключить
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};