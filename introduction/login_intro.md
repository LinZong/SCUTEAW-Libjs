## 介绍Login模块及网站Login的原理

### 0x0 写在前面

&nbsp;&nbsp;&nbsp;&nbsp;平成30年大约10月的时候，无意间不知道从哪里看到了SCUT招标开发新版教务系统的标书，这次中标的貌似还是正方软件股份有限公司。
    
&nbsp;&nbsp;&nbsp;&nbsp;早年SCUT在使用旧版教务系统的时候，该系统的设计风格给人一种本世纪初互联网方兴未艾时的陈旧感。笔者也在兴趣的驱使之下抓过该教务系统的包。彼时，该教务系统的"Server-side rendering"做的相当到位(笑)，页面上的每一个功能模块是一个一个服务器端渲染完成后回传的iframe。当该模块的内容出现变化，服务器都会回传一整个完成内容更改之后的iframe到客户端。如今ajax妇孺皆知，家喻户晓，亦有React, Vue等优秀的前端框架，在处理服务器端同构的场景时青出于蓝胜于蓝。看见如此饱含历史沧桑感的实现不禁令人捧腹。
    
&nbsp;&nbsp;&nbsp;&nbsp;平成31年1月2日，SCUT开始使用仍旧是由正方软件股份有限公司开发的新版教务系统。笔者在当天仍然体验到了同往年使用教务系统无法选到通选课的沮丧。于是笔者手脚又不听使唤地打开了Postman和Fiddler。于是就有了这篇文章和这个仓库。

### 0x1 原理 & 过程
1. GET http://xsjw2018.scuteo.com 得到两个Cookie。
    ```
    JSESSIONID = 00DD5914478AAAAAA2CGGGGDDA267F0C //已经经过无效化处理
    BIGipServerjwxtnew_BS80 = 621088990.20480.0000
    ```
&nbsp;&nbsp;&nbsp;&nbsp;BIGipServerjwxtnew_BS80并不是十分重要，实际进行Post测试保持BIGipServerjwxtnew_BS80不变并未出现请求错误。而JSESSIONID十分重要，它随后将被用于请求计算RSA的modulus和exponent，用于生成密码加密后的密文，同时在登陆完成后记录此次登陆的会话信息，作为其他功能模块从服务器请求信息的凭据。
        
&nbsp;&nbsp;&nbsp;&nbsp;需要特别注意的是，如果请求modulus和exponent时的JSESSIONID和登陆时的JSESSIONID不一致，将会生成错误的密码密文。使用错误的密码密文去登陆会报密码错误。

2. GET http://xsjw2018.scuteo.com/xtgl/login_getPublicKey.html?time="当前时间的毫秒数"; 得到一个JSON，其中包含exponent和modulus两个item.
3.  ```
    let rsaKey = new RSAKey();
    rsaKey.setPublic(b64tohex(modulus), b64tohex(exponent));
    let enPassword = hex2b64(rsaKey.encrypt(passwd));
    return enPassword; //得到加密后密码
    /*
        这里特别想吐槽，加密所用的库基本上全是browser-only的版本，而不是npm版。笔者将它们移植到node上真是痛苦。
    */
    ```
4. 使用从登录页一个hidden的input tag中得到的csrftoken，你的学号，步骤3加密后的密码，步骤1得到的Cookie，以及预定义的请求头去请求步骤1网页中form里的action地址。如果你跟我一样想用axio (吹一波await)，要知道axio要设withCredentials=true，并且把data transformRequest成queryString形态。关键代码如下。LoginPageAddr参考模块实现。
   ```
        let result = await axio.post(LoginPageAddr, {
            csrftoken: Csrf,
            yhm: "<your-student-id-here>",
            mm: passwd
            }, 
            {
               transformRequest: (data, header) => qs.stringify (data),
              headers: {
                 ...RequestHeader,
                 Cookie: CombineCookie
            }
        });
    ```
5. 不出意外的话，步骤4的result将会有302的status code. 检查response头部的location是不是跳到了 http://xsjw2018.scuteo.com/xtgl/index_initMenu.html。
   如果是，恭喜你。


### 0x02 写在最后
&nbsp;&nbsp;&nbsp;&nbsp;本来想写一些挖掘该接口的实践历程。奈何期末考试时间紧迫，并且感觉实在没什么可以拿来献丑的，随之作罢。

&nbsp;&nbsp;&nbsp;&nbsp;相信读者从头读到这里，会发现其实这个登陆的实现算是比较简单的了。一开始笔者抓教务登录包的时候也感到十分惊讶，甚至怀疑这教务会不会用了什么黑科技是Fiddler抓不到的。哇怎么从头到尾就只有两个Cookie，一眼就看得懂是怎么产生的WebForms。

&nbsp;&nbsp;&nbsp;&nbsp;并且玩过tomcat的朋友会马上反应过来，JSESSION不就是tomcat内置的那种保持SESSION的东西吗？直接把JSESSION写进Cookie送给客户端完事？按道理如今那些前后端分离的项目，要想很好的把接口保护起来的话，首先，HTTPS。其次，请求逻辑肯定不能被人一下子看懂，JS起码混淆一下吧？再弄一坨复杂的Cookie，对请求签名，校验，发各种有效时间贼短的token，之类的措施也是必不可少的。（尽管花时间还是能理清思路）
        
&nbsp;&nbsp;&nbsp;&nbsp;反观该新版教务系统，前端JS不压缩，不混淆，开发阶段的大段大段的注释留到过年（雾）。从源代码不难看出，新版教务的前端十有八九是手撸jquery完成的。几乎可以说没有现代工具如npm, webpack, babel的影子。看上去界面确实是现代了一点，但是依笔者愚见，支撑起该系统的代码仍旧落后于目前前端发展阶段至少一个世代。
        
&nbsp;&nbsp;&nbsp;&nbsp;除此之外，开发人员的中文能力令笔者由衷敬佩，不少请求参数，变量名取自中文拼音声母。不知道他们的开发人员是否需要准备一个接口文档专门介绍这些由拼音声母构成的参数到底是什么意思。

&nbsp;&nbsp;&nbsp;&nbsp;最后，笔者在源代码中发现了一个貌似是还没写完的接口。用来查询用户名是不是存在。这类接口存在的错误性笔者认为无需多谈。为了学生账号的安全，笔者就不谈及这个接口在哪里能看到了。