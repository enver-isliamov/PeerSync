import React from 'react';
import { FolderIcon } from './icons/FolderIcon.js';
import { PlusIcon } from './icons/PlusIcon.js';
import { QrcodeIcon } from './icons/QrcodeIcon.js';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon.js';

export const BottomNav = ({ onAdd, onJoin, onHelp, onShowFolders, activeView }) => {
    const baseClasses = "flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200";
    const activeClasses = "text-sky-400";
    const inactiveClasses = "text-slate-400 hover:text-sky-400";

    const isFoldersActive = activeView === 'folders' || activeView === 'detail';

    return React.createElement('div', { className: "md:hidden fixed bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-lg border-t border-slate-700 z-40" },
        React.createElement('div', { className: "flex justify-around items-center h-16" },
            React.createElement('button', {
                onClick: onShowFolders,
                className: `${baseClasses} ${isFoldersActive ? activeClasses : inactiveClasses}`
            },
                React.createElement(FolderIcon, { className: "w-6 h-6" }),
                React.createElement('span', { className: "text-xs mt-1" }, "Папки")
            ),
             React.createElement('button', {
                onClick: onAdd,
                className: `${baseClasses} ${inactiveClasses}`
            },
                React.createElement(PlusIcon, { className: "w-6 h-6" }),
                React.createElement('span', { className: "text-xs mt-1" }, "Добавить")
            ),
             React.createElement('button', {
                onClick: onJoin,
                className: `${baseClasses} ${inactiveClasses}`
            },
                React.createElement(QrcodeIcon, { className: "w-6 h-6" }),
                React.createElement('span', { className: "text-xs mt-1" }, "Присоединиться")
            ),
            React.createElement('button', {
                onClick: onHelp,
                className: `${baseClasses} ${activeView === 'help' ? activeClasses : inactiveClasses}`
            },
                React.createElement(QuestionMarkCircleIcon, { className: "w-6 h-6" }),
                React.createElement('span', { className: "text-xs mt-1" }, "Помощь")
            )
        )
    );
};
