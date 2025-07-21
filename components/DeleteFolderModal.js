import React from 'react';
import { XIcon } from './icons/XIcon.js';
import { TrashIcon } from './icons/TrashIcon.js';
import { Spinner } from './icons/Spinner.js';

export const DeleteFolderModal = ({ folder, onClose, onConfirm }) => {
  if (!folder) return null;
  
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = () => {
    setIsDeleting(true);
    // Simulate a small delay for visual feedback, then call the actual delete handler
    setTimeout(() => {
        onConfirm(folder.id);
        // No need to set isDeleting false as component will unmount
    }, 500);
  };

  return (
    React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50", 'aria-modal': "true", role: "dialog" },
      React.createElement('div', { className: "bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative" },
        React.createElement('button', {
          onClick: onClose,
          className: "absolute top-4 right-4 text-slate-400 hover:text-white transition-colors",
          disabled: isDeleting,
          'aria-label': "Закрыть"
        },
          React.createElement(XIcon, { className: "w-6 h-6" })
        ),
        React.createElement('div', { className: "text-center" },
            React.createElement('div', { className: "w-16 h-16 mx-auto flex items-center justify-center bg-red-900/30 rounded-full mb-4" },
              React.createElement(TrashIcon, { className: "w-8 h-8 text-red-400" })
            ),
            React.createElement('h2', { className: "text-2xl font-bold text-white mb-2", id: "modal-title" }, "Удалить папку?"),
            React.createElement('p', { className: "text-slate-400 mb-8" },
              "Вы уверены, что хотите удалить папку ", React.createElement('span', { className: "font-semibold text-slate-200" }, folder.name), "?",
              React.createElement('br'),
              "Это действие нельзя будет отменить."
            ),
            
            React.createElement('div', { className: "flex justify-center space-x-4" },
                 React.createElement('button', {
                  type: "button",
                  onClick: onClose,
                  disabled: isDeleting,
                  className: "px-8 py-3 rounded-md text-base font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50"
                },
                  "Отмена"
                ),
                React.createElement('button', {
                  type: "button",
                  onClick: handleConfirm,
                  disabled: isDeleting,
                  className: "px-8 py-3 rounded-md text-base font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center disabled:opacity-50"
                },
                  isDeleting ? (
                      React.createElement(React.Fragment, null,
                        React.createElement(Spinner, { className: "w-5 h-5 mr-3" }),
                        "Удаление..."
                      )
                  ) : 'Удалить'
                )
            )
        )
      )
    )
  );
};