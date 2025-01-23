// ==UserScript==
// @name         小米有品客服自动回复油猴脚本
// @namespace    https://www.techeek.cn/
// @version      1.1
// @description  小米有品客服平台太恶心，30S内必须回复，不然就罚款，因此写了个小工具监控并自动回复（求求小米工程师优化下有品客服工具的APP吧，2025年了，还必须一直打开APP才能看到消息，而且不支持IOS平台）。
// @author       Techeek
// @match        https://yp-janus.kefu.mi.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 定义 Bark 通知的默认变量
    const DEFAULT_BARK_TITLE = encodeURIComponent("小米有品客服通知"); // Bark通知标题
    const DEFAULT_BARK_DEVICE_KEY = "123456789"; // Bark密钥，下载Bark后自动获取
    const DEFAULT_REPLY_CONTENT = "您好，请问有什么可以帮您？"; // 默认回复内容

    // 等待页面加载完成
    function waitForElement(selector, callback) {
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                callback(element);
            }
        }, 100);
    }

    // 添加开关按钮到指定位置
    function addToggleButton(container) {
        const toggleButton = document.createElement('button');
        toggleButton.id = 'autoreply-toggle';
        toggleButton.style.marginLeft = '10px';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.backgroundColor = '#4CAF50';
        toggleButton.style.color = 'white';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '3px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.textContent = '自动回复: 关闭';

        container.appendChild(toggleButton);

        // 从本地存储获取开关状态
        let isMonitoring = localStorage.getItem('autoreply_enabled') === 'true';
        updateButtonState();

        // 更新按钮状态
        function updateButtonState() {
            toggleButton.textContent = `自动回复: ${isMonitoring ? '开启' : '关闭'}`;
            toggleButton.style.backgroundColor = isMonitoring ? '#4CAF50' : '#f44336';
        }

        // 按钮点击事件
        toggleButton.addEventListener('click', () => {
            isMonitoring = !isMonitoring;
            localStorage.setItem('autoreply_enabled', isMonitoring);
            updateButtonState();
        });

        // 保存原生的 WebSocket 构造函数
        const OriginalWebSocket = window.WebSocket;

        // 重写 WebSocket 构造函数
        window.WebSocket = function (...args) {
            const wsInstance = new OriginalWebSocket(...args);

            console.log('[WebSocket] 创建连接:', args);

            // 监听消息接收
            wsInstance.addEventListener('message', async function (event) {
                if (!isMonitoring) return; // 未开启监控则直接返回

                try {
                    const message = JSON.parse(event.data);
                    if (message.body) {
                        const contentJSON = JSON.parse(message.body.content);
                        if (contentJSON.roleType === 'MiCustomer') {
                            console.log('客户名称:', contentJSON.fromUserName);
                            console.log('客户会话:', contentJSON.content);
                            console.groupEnd();

                            const match = message.body.roomId.match(/^.*:(\d+):.*@.*$/);
                            const userTenantId = match[1];
                            const postData = {
                                roomId: message.body.roomId,
                                userId: message.body.toUserId,
                                connectionId: message.body.toUserConnectionId,
                                content: DEFAULT_REPLY_CONTENT, 
                                msgType: "TEXT",
                                umsgId: `KF|${Date.now()}`,
                                extraInfo: "{}",
                                tenantId: "youpin",
                                userTenantId: userTenantId
                            };

                            // 发送 POST 请求
                            try {
                                const response = await fetch('https://yp-janus.kefu.mi.com/mcc/web-api/chat/send', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(postData)
                                });

                                if (response.ok) {
                                    console.log('自动回复成功:', await response.json());

                                    // 自动回复成功后，通过 Bark 推送紧急消息
                                    const barkUrl = `https://api.day.app/${DEFAULT_BARK_DEVICE_KEY}/${DEFAULT_BARK_TITLE}?level=critical&volume=5`;
                                    fetch(barkUrl)
                                        .then(response => {
                                            if (response.ok) {
                                                console.log('Bark通知发送成功');
                                            } else {
                                                console.error('Bark通知发送失败:', response.status, response.statusText);
                                            }
                                        })
                                        .catch(error => {
                                            console.error('发送Bark通知时出错:', error);
                                        });
                                } else {
                                    console.error('自动回复失败:', response.status, response.statusText);
                                }
                            } catch (error) {
                                console.error('发送自动回复时出错:', error);
                            }
                        }
                    }
                } catch (error) {
                    console.error('[WebSocket] 消息解析失败:', error, '消息内容:', event.data);
                }
            });

            return wsInstance;
        };

        // 继承 WebSocket 原型链
        window.WebSocket.prototype = OriginalWebSocket.prototype;
    }

    // 等待 <div class="home-container-headbar"> 加载完成后添加按钮
    waitForElement('.home-container-headbar', addToggleButton);
})();