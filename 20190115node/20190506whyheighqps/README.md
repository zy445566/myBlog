# 为什么说node具有高并发优势
很多人质疑node的高并发优势，并且以输出HelloWorld或输出计算结果来和传统的Java对比证明node并没有web的高并发优势，但事实真的是这样么？为什么说只输出HelloWorld性能还是比不过传统Java？异步是否还难道是不如多线程？

尤其是对于node的高并发优势，很多人却说的很模糊，所以我觉得是时候以更通俗的语言和更接近Web编程的实际场景来解释异步模型的优势。

# 先讲个小故事
C是建筑工，Q是搬运工，Y是包工头。

故事一:第一天C建墙建了一天发现没砖了，C告诉包工头Y没砖了，于是Y通知Q去搬点砖来，结果Q搬砖搬了一天，C就休息了一天。后来C建了一天屋顶又发现没瓦了,C告诉包工头Y没瓦了，于是Y通知Q再去搬点瓦来，结果Q搬瓦搬了一天，C就又休息了一天。后来C建了一天窗户又发现没玻璃了，C告诉包工头Y没玻璃了，于是Y通知Q再去搬点玻璃来，结果Q搬玻璃搬了一天，C就又休息了一天。后来C建了一天电路又发现没电线了，C告诉包工头Y没电线了，于是Y通知Q再去搬点电线来，结果Q搬电线搬了一天，C就又休息了一天。以此类推，最终导致工期没有按时完成，Y被处分了。

故事二:吸取了故事一的教训，Y扩充了三倍团队人数。C1,C2,C3一起来建房子。结果C1,C2,C3都没有砖了，C1,C2,C3告诉Y，Y于是叫Q1，Q2，Q3去搬砖。同样Q1,Q2,Q3搬砖搬了一天，C1,C2,C3就休息了一天，和上面差不多都出现了搬瓦搬玻璃电线等等事件，但由于人多，建的速度快，还好没延期，但多招了很多人，Y亏本破产了。

故事三:吸取了故事二的教训，Y决定弄个排期表还是不能让C闲着，当C建了一天墙发现没砖了后，Y让Q把砖搬回来的同时也让C先建设一天屋顶。正好C发现没瓦后，正好S的砖也搬回来了，C又可以去建墙，同时S又可以去拉瓦。当瓦拉回来后，C又可以建屋顶了。以此类推，最终工期按时完成，同时Y也赚到盆满钵满。

故事一就是传统的单线程阻塞模式，故事二就是多线程的阻塞模式，故事三就是非阻塞的异步模式。而C就是CPU，C休息就是CPU空转。Q就是查询，Q搬东西就是查询需要等待的时间。C1,C2,C3的工资就是开线程的成本。Y就是你，你就是包工头。所以非阻塞的异步模式，主要解决了两个问题：
* 解决了CPU空转大量浪费问题
* 节约了开线程和线程切换上下文的成本问题

# 再谈什么情况能超越传统Java
根据上面的情况，无论是只输出HelloWorld也好，进行少量计算也好，这都是无需等待的操作，相当于上面那个故事里面的砖从来没有缺过的情况，但是一旦涉及到需要阻塞的等待，那么node的异步模式将起了极大的作用，而Web编程这种需要阻塞的等待又是极多的，比如说查询。

我将用一段Java和node的等待操作进行压测来证明我的所说的情况。

java代码:
```java
package test;

import javax.servlet.http.HttpServlet;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.*;

@WebServlet("/")
public class TestServlet extends HttpServlet {

	public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
		// 暂停三秒
		int sleepTime = 3000;
		try {
			Thread.sleep(sleepTime);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
		PrintWriter out = response.getWriter();
    // 读取文件并显示,unuseData.txt是一个40M的文件
		File f = new File("/xxx/unuseData.txt");
        FileInputStream fip = new FileInputStream(f);
        InputStreamReader reader = new InputStreamReader(fip, "UTF-8");
        StringBuffer sb = new StringBuffer();
        while (reader.ready()) {
            sb.append((char) reader.read());
        }
        reader.close();
        fip.close();
		out.println("Java Stop The World " + sleepTime/1000 + "s"+",unuseData:"+ sb.toString());
	}

}
```

node代码:
```js
const http = require("http");
const fs = require("fs");
const port = 4000;
function nodeSleep(time) {
    return new Promise((resolve,reject)=>{
        setTimeout(() => {
            resolve(true)
        }, time);
    });
}
function getUnseData() {
    return new Promise((resolve,reject)=>{
        // unuseData.txt是一个40M的文件
        fs.readFile('/xxx/unuseData.txt', (err, data) => {
            if (err) reject(err);
            resolve(data)
        });
    });
}
http.createServer( async function (request, response) {
    let sleepTime = 3000;
    // 暂停三秒
    await nodeSleep(sleepTime);
    // 读取文件并显示
    let unuseData = await getUnseData();
    response.end(`Node Stop The World ${sleepTime}s,unseDate:${unuseData}`);  
}).listen(port);
console.log(`listen http://localhost:${port}/`)
```

压测结果：
```sh
# Java
ab -n 50 -c 5 http://localhost:8080/test/
Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.1      0       1
Processing:  4181 5645 883.3   5579    7495
Waiting:     4075 5443 838.2   5394    7215
Total:       4181 5645 883.3   5579    7496

# Node
ab -n 50 -c 5 http://localhost:4000/
Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.3      0       2
Processing:  3210 3487 232.7   3487    3908
Waiting:     3182 3349 167.8   3328    3835
Total:       3210 3487 232.7   3488    3908
```
`注意：并发为5，总请求数为50是因为我电脑是公司的低配mini扛不住，机器好的可以适当调高`

可以看到

Java最快在5秒左右，最慢在7秒左右。

Node最快在3秒左右，最慢也在3秒左右。

传统的Java写法居然比Node慢了2到4秒！

# 为什么呢？
先解释一下代码，这两段代码都是先sleep一段时间，再读取文件展示给页面上。但Node在等待的时候让另一个已经等待完成的请求来读文件了，传统的Java却只能将等待彻底完成，才开始读文件，并且由于服务tomcat的worker恒定，worker池用完后，则需要等待worker释放，导致后一个worker的时间极大延长，而Node的队列却足够长到可以应付。

所以为什么只是少量计算或直接输出HelloWorld，压测时性能还不如Java是因为这个时候CPU直接打满，这会导致node直接就阻塞了，无法发挥其优势，而这时Java的多worker反而使得CPU打满充分利用CPU来计算，所以速度反而快了。

但是Web编程的大部分情况都不是简单的少量计算或直接输出HelloWorld，而是往往有更多的查询或文件读写操作和更复杂的情况，所以导致Node在通用Web开发中具有更大高并发优势！