// ==UserScript==
// @name         小米有品客服自动回复油猴脚本
// @namespace    https://www.techeek.cn/
// @version      1.0
// @description  小米有品客服平台太恶心，30S内必须回复，不然就罚款，因此写了个小工具监控并自动回复（求求小米工程师优化下有品客服工具的APP吧，2025年了，还必须一直打开APP才能看到消息，而且不支持IOS平台）。
// @author       Techeek
// @match        https://yp-janus.kefu.mi.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 保存原生的 WebSocket 构造函数
    const OriginalWebSocket = window.WebSocket;

    // 重写 WebSocket 构造函数
    window.WebSocket = function (...args) {
        const wsInstance = new OriginalWebSocket(...args);

        console.log('[WebSocket] 创建连接:', args);

        // 监听消息接收
        wsInstance.addEventListener('message', async function (event) {
            try {
                const message = JSON.parse(event.data);
                if (message.body) {
                    const contentJSON = JSON.parse(message.body.content)
                    if (contentJSON.roleType == 'MiCustomer') {
                        console.log('客户名称:', contentJSON.fromUserName);
                        console.log('客户会话:', contentJSON.content);
                        console.groupEnd();
                        const match = message.body.roomId.match(/^.*:(\d+):.*@.*$/);
                        const userTenantId = match[1];
                        const postData = {
                            roomId: message.body.roomId,
                            userId: message.body.toUserId,
                            connectionId: message.body.toUserConnectionId,
                            content: "亲亲，请稍等哈！",
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
})();