# 小米有品客服自动回复油猴脚本
 - 小米有品客服平台太恶心，30S内必须回复，不然就罚款，因此写了个小工具监控并自动回复（求求小米工程师优化下有品客服工具的APP吧，2025年了，还必须一直打开APP才能看到消息，而且不支持IOS平台）。
 - 你知道半夜一点多因为忘了签出而要被平台扣200元的心情吗？！！！！！！

## 功能规划
- [x] 自动回复
- [x] Bark消息推送（解决IOS无法接收消息问题）
- [x] 开关（用于连续消息解答问题）
- [ ] 对接deepseek自动回复

## 使用
修改下面内容为你需要的内容

```javascript
const DEFAULT_BARK_TITLE = encodeURIComponent("小米有品客服通知"); // Bark通知标题
const DEFAULT_BARK_DEVICE_KEY = "123456789"; // Bark密钥，下载Bark后自动获取
const DEFAULT_REPLY_CONTENT = "您好，请问有什么可以帮您？"; // 默认回复内容
```