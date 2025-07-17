
import React from 'react';
import { FolderIcon } from './icons/FolderIcon';
import { QrcodeIcon } from './icons/QrcodeIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';

export const Instructions: React.FC = () => {
    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto text-slate-300">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Добро пожаловать в PeerSync!</h1>
            <p className="text-lg text-slate-400 mb-10">Это руководство поможет вам начать работу с P2P-синхронизацией файлов.</p>

            <div className="space-y-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-shrink-0 w-24 h-24 bg-sky-900/50 rounded-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-sky-400">1</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-3">Основная концепция: Что такое P2P?</h2>
                        <p>PeerSync работает по принципу **Peer-to-Peer (P2P)**. Это означает, что ваши файлы передаются **напрямую** с одного вашего устройства на другое, без промежуточных облачных серверов. Ваши данные не хранятся нигде, кроме ваших собственных устройств.</p>
                        <ul className="mt-4 space-y-2 list-disc list-inside text-slate-400">
                            <li><strong className="text-slate-200">Приватно:</strong> Никто, кроме вас, не имеет доступа к вашим файлам.</li>
                            <li><strong className="text-slate-200">Быстро:</strong> Скорость ограничена только вашей локальной сетью или интернет-соединением.</li>
                            <li><strong className="text-slate-200">Без ограничений:</strong> Нет лимитов на размер или количество файлов.</li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-shrink-0 w-24 h-24 bg-sky-900/50 rounded-full flex items-center justify-center">
                        <FolderIcon className="w-12 h-12 text-sky-400"/>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-3">Шаг 1: Добавьте папку</h2>
                        <p>Начните с добавления папки на вашем первом устройстве (например, на компьютере).</p>
                        <ol className="mt-4 space-y-2 list-decimal list-inside text-slate-400">
                            <li>Нажмите кнопку <strong className="text-slate-200">"Добавить папку"</strong> в левой панели.</li>
                            <li>В открывшемся окне выберите папку на вашем компьютере.</li>
                            <li>Предоставьте браузеру необходимые разрешения на чтение и запись.</li>
                            <li>Папка появится в списке.</li>
                        </ol>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-8">
                     <div className="flex-shrink-0 w-24 h-24 bg-sky-900/50 rounded-full flex items-center justify-center">
                        <QrcodeIcon className="w-12 h-12 text-sky-400"/>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-3">Шаг 2: Подключите второе устройство</h2>
                        <p>Теперь подключим второе устройство (например, телефон или другой компьютер).</p>
                         <ol className="mt-4 space-y-2 list-decimal list-inside text-slate-400">
                            <li><strong className="text-slate-200">На первом устройстве (с папкой):</strong> зайдите в детали папки и нажмите "Подключить новое устройство". Появится QR-код.</li>
                            <li><strong className="text-slate-200">На втором устройстве:</strong> нажмите "Присоединиться к синхронизации" и отсканируйте QR-код с первого устройства.</li>
                             <li>После сканирования на втором устройстве сгенерируется "Ответ". Скопируйте его.</li>
                             <li><strong className="text-slate-200">Вернитесь на первое устройство</strong> и вставьте скопированный "Ответ" в соответствующее поле.</li>
                             <li>Нажмите "Подключить". Устройства соединятся, и начнется синхронизация!</li>
                        </ol>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-shrink-0 w-24 h-24 bg-sky-900/50 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-12 h-12 text-sky-400"/>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-3">Важные особенности</h2>
                         <ul className="mt-4 space-y-3 text-slate-400">
                            <li className="flex items-start gap-3">
                                <ExclamationCircleIcon className="w-6 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong className="text-yellow-300">Повторные разрешения:</strong> Из соображений безопасности браузеры требуют повторного предоставления доступа к папке каждый раз после перезапуска. Если вы видите статус "Требуется разрешение", просто нажмите на папку и выберите ее снова.
                                </div>
                            </li>
                             <li className="flex items-start gap-3">
                                <ExclamationCircleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong className="text-yellow-300">Совместимость:</strong> Для полноценной работы требуется браузер на основе Chromium (Google Chrome, Microsoft Edge, Opera), так как он поддерживает необходимый File System Access API.
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
