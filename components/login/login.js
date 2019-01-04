/**
 *  !REPLACE <your-student-id-here> AND <your-password-here> BEFORE USE!
 */


const axio = require("axios").default;
const qs = require('qs');
//require key library to handle password encoding.
const { RSAKey } = require("./lib/rsa.js");
const { b64tohex, hex2b64 } = require("./lib/base64.js");
//define some useful url.
var LoginPageAddr = "http://xsjw2018.scuteo.com/xtgl/login_slogin.html";
var HomepageAddr = "http://xsjw2018.scuteo.com/xtgl/index_initMenu.html";
var GetPublicKeyAddr = "http://xsjw2018.scuteo.com/xtgl/login_getPublicKey.html?time=" + new Date().getTime();
//use regex to extract key info from login page
//need Csrf token, and cookie.

var MatchCsrfTokenRegex = "name=\"csrftoken\" value=\".*\"";
var ClearNoNeedCsrfTag = ["name=\"csrftoken\" value=\"", "\""];
var CookieExtracter = ["JSESSIONID=[0-9|A-Z]*;", "BIGipServerjwxtnew_BS80=[0-9]*.[0-9]*.[0-9]*;"];
//define a fake request header in order to perform actions like a browser.
var RequestHeader = {
    "Host": "xsjw2018.scuteo.com",
    "Origin": "http://xsjw2018.scuteo.com",
    "Upgrade-Insecure-Requests": "1",
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q:0.9,image/webp,image/apng,*/*;q:0.8",
    "Referer": "http://xsjw2018.scuteo.com/xtgl/login_slogin.html",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "zh-CN,zh;q:0.9,en;q:0.8,en-US;q:0.7,ja;q:0.6",
    "Cache-Control": "max-age:0"
};

// fiddler is useful to check req make by code.
var DebugFiddlerProxy = {
    host: "127.0.0.1",
    port: 8899
};

axio.defaults.withCredentials = true;//allow axio make a req with cookie.

async function GetEncodedPassword(passwd, cookie) {
    const res = await axio.get(GetPublicKeyAddr, {
        headers: {
            ...RequestHeader,
            Cookie: cookie
        }
    });
    const { exponent, modulus } = res.data;
    let rsaKey = new RSAKey();
    rsaKey.setPublic(b64tohex(modulus), b64tohex(exponent));
    let enPassword = hex2b64(rsaKey.encrypt(passwd));
    return enPassword;
}
function ClearCsrfHTMLTag(csrftoken) {
    ClearNoNeedCsrfTag.forEach(element => {
        csrftoken = csrftoken.replace(element, "")
    });
    return csrftoken;
}
async function GetToken() {
    let Fullpage = await axio.get(LoginPageAddr);
    let MatchCsrfResult = Fullpage.data.match(MatchCsrfTokenRegex);
    MatchCsrfResult = MatchCsrfResult[0];
    let PageCookie = Fullpage.headers["set-cookie"];
    PageCookie[0] = PageCookie[0].match(CookieExtracter[0])[0];
    PageCookie[1] = PageCookie[1].match(CookieExtracter[1])[0];
    return { Csrf: ClearCsrfHTMLTag(MatchCsrfResult), Cookie: PageCookie };
}
async function FakeLoginToJW() {
    let { Csrf, Cookie } = await GetToken();
    let CombineCookie = "";
    for (let i in Cookie) {
        CombineCookie += Cookie[i];
    }
    let passwd = await GetEncodedPassword("<your-password-here>", CombineCookie);
    let result = await axio.post(LoginPageAddr, {
        csrftoken: Csrf,
        yhm: "<your-student-id-here>",
        mm: passwd
    }, {
            transformRequest: (data, header) => qs.stringify(data),
            headers: {
                ...RequestHeader,
                Cookie: CombineCookie
            }
            //,proxy: DebugFiddlerProxy
        });
    console.log(result.status);
    let Homepage = await axio.get(HomepageAddr, {
        headers: {
            ...RequestHeader,
            Cookie: CombineCookie
        }
    })
    console.log(Homepage.data);//Haha, your homepage!
}

FakeLoginToJW()
