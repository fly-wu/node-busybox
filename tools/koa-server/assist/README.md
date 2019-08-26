### intro

展示ajax的基本功能

```
```

### XMLHttpRequest和本地文件

网页中可以使用相对URL的能力通常意味着我们能使用本地文件系统开发和测试HTML，并避免对Web服务器进行不必要的部署。然而，使用XMLHttpRequest进行Ajax编程时，这通常是不可行的。XMLHttpRequest用于通HTTP和HTTPS协议一起工作。所以，进行XMLHttpRequest操作时应该启动一个Web服务。

### readstatechange

UNSENT            0     open()尚未使用
OPENED            1     open()已调用
HEADERS_RECEIVED  2     收到头部信息
LOADING           3     接收到响应主体
DONE              4     响应完成