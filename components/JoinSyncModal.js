import React, { useState } from 'react';
import { XIcon } from './icons/XIcon.js';
import { QrScanner } from './QrScanner.js';
import { CopyIcon } from './icons/CopyIcon.js';
import { Spinner } from './icons/Spinner.js';

export const JoinSyncModal = ({ onClose, onOfferScanned }) => {
  const [step, setStep] = useState('scan');
  const [answer, setAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleScan = async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      const offer = JSON.parse(data);
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
    React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" },
      React.createElement('div', { className: "bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative" },
        React.createElement('button', { onClick: onClose, className: "absolute top-4 right-4 text-slate-400 hover:text-white" }, React.createElement(XIcon, { className: "w-6 h-6" })),
        React.createElement('h2', { className: "text-2xl font-bold text-white mb-4" }, "Присоединиться к синхронизации"),
        
        step === 'scan' && (
          React.createElement('div', { className: "space-y-4" },
            React.createElement('p', { className: "text-slate-300" }, "Наведите камеру на QR-код на другом устройстве."),
            isLoading ? (
                React.createElement('div', { className: "h-64 flex flex-col items-center justify-center" },
                    React.createElement(Spinner, { className: "w-10 h-10 mb-4" }),
                    React.createElement('p', null, "Обработка...")
                )
            ) : (
                React.createElement(QrScanner, { onScan: handleScan, onClose: onClose })
            ),
            error && React.createElement('p', { className: "text-red-400 text-sm text-center mt-2" }, error)
          )
        ),

        step === 'copy' && answer && (
          React.createElement('div', { className: "space-y-4" },
            React.createElement('p', { className: "text-slate-300" }, "Скопируйте этот ответ и вставьте его на первом устройстве."),
            React.createElement('textarea', {
              readOnly: true,
              value: JSON.stringify(answer, null, 2),
              className: "w-full h-40 bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-300 font-mono text-xs"
            }),
            React.createElement('button', { onClick: handleCopy, className: "w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-sky-500 transition-colors" },
              React.createElement(CopyIcon, { className: "w-5 h-5 mr-2" }),
              copied ? 'Скопировано!' : 'Скопировать ответ'
            ),
            React.createElement('p', { className: "text-xs text-slate-500 text-center" }, "После подключения это окно можно будет закрыть.")
          )
        )
      )
    )
  );
};