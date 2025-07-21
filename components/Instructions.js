import React from 'react';
import { FolderIcon } from './icons/FolderIcon.js';
import { QrcodeIcon } from './icons/QrcodeIcon.js';
import { CheckCircleIcon } from './icons/CheckCircleIcon.js';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon.js';

export const Instructions = () => {
    return (
        React.createElement('div', { className: "p-6 md:p-10 max-w-4xl mx-auto text-slate-300 pb-20 md:pb-10" },
            React.createElement('h1', { className: "text-3xl md:text-4xl font-bold text-white mb-4" }, "Добро пожаловать в PeerSync!"),
            React.createElement('p', { className: "text-lg text-slate-400 mb-10" }, "Это руководство поможет вам начать работу с P2P-синхронизацией файлов."),

            React.createElement('div', { className: "space-y-12" },
                React.createElement('div', { className: "flex flex-col md:flex-row items-center gap-8" },
                    React.createElement('div', { className: "flex-shrink-0 w-24 h-24 bg-sky-900/50 rounded-full flex items-center justify-center" },
                        React.createElement('span', { className: "text-4xl font-bold text-sky-400" }, "1")
                    ),
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-2xl font-bold text-white mb-3" }, "Основная концепция: Что такое P2P?"),
                        React.createElement('p', null, "PeerSync работает по принципу ", React.createElement('strong', null, "Peer-to-Peer (P2P)"), ". Это означает, что ваши файлы передаются ", React.createElement('strong', null, "напрямую"), " с одного вашего устройства на другое, без промежуточных облачных серверов. Ваши данные не хранятся нигде, кроме ваших собственных устройств."),
                        React.createElement('ul', { className: "mt-4 space-y-2 list-disc list-inside text-slate-400" },
                            React.createElement('li', null, React.createElement('strong', { className: "text-slate-200" }, "Приватно:"), " Никто, кроме вас, не имеет доступа к вашим файлам."),
                            React.createElement('li', null, React.createElement('strong', { className: "text-slate-200" }, "Быстро:"), " Скорость ограничена только вашей локальной сетью или интернет-соединением."),
                            React.createElement('li', null, React.createElement('strong', { className: "text-slate-200" }, "Без ограничений:"), " Нет лимитов на размер или количество файлов.")
                        )
                    )
                ),

                React.createElement('div', { className: "flex flex-col md:flex-row items-center gap-8" },
                    React.createElement('div', { className: "flex-shrink-0 w-24 h-24 bg-sky-900/50 rounded-full flex items-center justify-center" },
                        React.createElement(FolderIcon, { className: "w-12 h-12 text-sky-400" })
                    ),
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-2xl font-bold text-white mb-3" }, "Шаг 1: Добавьте папку"),
                        React.createElement('p', null, "Начните с добавления папки на вашем первом устройстве (например, на компьютере)."),
                        React.createElement('ol', { className: "mt-4 space-y-2 list-decimal list-inside text-slate-400" },
                            React.createElement('li', null, "Нажмите кнопку ", React.createElement('strong', { className: "text-slate-200" }, "\"Добавить папку\""), " в левой панели."),
                            React.createElement('li', null, "В открывшемся окне выберите папку на вашем компьютере."),
                            React.createElement('li', null, "Предоставьте браузеру необходимые разрешения на чтение и запись."),
                            React.createElement('li', null, "Папка появится в списке.")
                        )
                    )
                ),
                
                React.createElement('div', { className: "flex flex-col md:flex-row items-center gap-8" },
                     React.createElement('div', { className: "flex-shrink-0 w-24 h-24 bg-sky-900/50 rounded-full flex items-center justify-center" },
                        React.createElement(QrcodeIcon, { className: "w-12 h-12 text-sky-400" })
                    ),
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-2xl font-bold text-white mb-3" }, "Шаг 2: Подключите второе устройство"),
                        React.createElement('p', null, "Теперь подключим второе устройство (например, телефон или другой компьютер)."),
                         React.createElement('ol', { className: "mt-4 space-y-2 list-decimal list-inside text-slate-400" },
                            React.createElement('li', null, React.createElement('strong', { className: "text-slate-200" }, "На первом устройстве (с папкой):"), " зайдите в детали папки и нажмите \"Подключить новое устройство\". Появится QR-код."),
                            React.createElement('li', null, React.createElement('strong', { className: "text-slate-200" }, "На втором устройстве:"), " нажмите \"Присоединиться к синхронизации\" и отсканируйте QR-код с первого устройства."),
                             React.createElement('li', null, "После сканирования на втором устройстве сгенерируется \"Ответ\". Скопируйте его."),
                             React.createElement('li', null, React.createElement('strong', { className: "text-slate-200" }, "Вернитесь на первое устройство"), " и вставьте скопированный \"Ответ\" в соответствующее поле."),
                             React.createElement('li', null, "Нажмите \"Подключить\". Устройства соединятся, и начнется синхронизация!")
                        )
                    )
                ),

                React.createElement('div', { className: "flex flex-col md:flex-row items-center gap-8" },
                    React.createElement('div', { className: "flex-shrink-0 w-24 h-24 bg-sky-900/50 rounded-full flex items-center justify-center" },
                        React.createElement(CheckCircleIcon, { className: "w-12 h-12 text-sky-400" })
                    ),
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-2xl font-bold text-white mb-3" }, "Важные особенности"),
                         React.createElement('ul', { className: "mt-4 space-y-3 text-slate-400" },
                            React.createElement('li', { className: "flex items-start gap-3" },
                                React.createElement(ExclamationCircleIcon, { className: "w-6 h-5 text-yellow-400 flex-shrink-0 mt-0.5" }),
                                React.createElement('div', null,
                                    React.createElement('strong', { className: "text-yellow-300" }, "Повторные разрешения:"), " Из соображений безопасности браузеры требуют повторного предоставления доступа к папке каждый раз после перезапуска. Если вы видите статус \"Требуется разрешение\", просто нажмите на папку и выберите ее снова."
                                )
                            ),
                             React.createElement('li', { className: "flex items-start gap-3" },
                                React.createElement(ExclamationCircleIcon, { className: "w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" }),
                                React.createElement('div', null,
                                    React.createElement('strong', { className: "text-yellow-300" }, "Совместимость:"), " Для полноценной работы требуется браузер на основе Chromium (Google Chrome, Microsoft Edge, Opera), так как он поддерживает необходимый File System Access API."
                                )
                            )
                        )
                    )
                )
            )
        )
    );
}