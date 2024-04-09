//////////////////////////////////////////
//                      通用函数文件               //
//////////////////////////////////////////
/**
* 将相对地址转换为绝对地址
*/
function ToAbsoluteURL(url, base) {
var ele = document.createElement('a');
ele.href = (base || '') + url;
return ele.href;
}

function SaveToFile(base64Content, fileName, fileExt) {//保存到文件
var c = window.atob(base64Content);
var ab = new ArrayBuffer(c.length);
var ia = new Uint8Array(ab);
for (var i = 0; i < c.length; i++) {
ia[i] = c.charCodeAt(i);
}
var b = new Blob([ab]);//这句，Windows版本的Safari执行不下去。

if (fileName == undefined || fileName == null || fileName == '') {
fileName = "noname";
}
fileName += '.';
fileName += fileExt;
saveAs(b, fileName);
}

/**Base64解码
* @strIn，输入字符串
* 成功返回一个数组，每一个元素包含一字节信息，失败返回null
*/
function decodeBase64(strIn) {
    if (!strIn.length || strIn.length % 4)
        return null;
    var str64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var index64 = [];
    for (var i = 0; i < str64.length; i++)
        index64[str64.charAt(i)] = i;
    var c0, c1, c2, c3, b0, b1, b2;
    var len = strIn.length;
    var len1 = len;
    if (strIn.charAt(len - 1) == '=')
        len1 -= 4;
    var result = [];
    for (var i = 0, j = 0; i < len1; i += 4) {
        c0 = index64[strIn.charAt(i)];
        c1 = index64[strIn.charAt(i + 1)];
        c2 = index64[strIn.charAt(i + 2)];
        c3 = index64[strIn.charAt(i + 3)];
        b0 = (c0 << 2) | (c1 >> 4);
        b1 = (c1 << 4) | (c2 >> 2);
        b2 = (c2 << 6) | c3;
        result.push(b0 & 0xff);
        result.push(b1 & 0xff);
        result.push(b2 & 0xff);
    }
    if (len1 != len) {
        c0 = index64[strIn.charAt(i)];
        c1 = index64[strIn.charAt(i + 1)];
        c2 = strIn.charAt(i + 2);
        b0 = (c0 << 2) | (c1 >> 4);
        result.push(b0 & 0xff);
        if (c2 != '=') {
            c2 = index64[c2];
            b1 = (c1 << 4) | (c2 >> 2);
            result.push(b1 & 0xff);
        }
    }
    return result;
}

/* FileSaver.js
* A saveAs() FileSaver implementation.
* 1.3.2
* 2016-06-16 18:25:19
*
* By Eli Grey, http://eligrey.com
* License: MIT
*   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
*/

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
    "use strict";
    // IE <10 is explicitly unsupported
    if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
        return;
    }
    var 
          doc = view.document
    // only get URL when necessary in case Blob.js hasn't overridden it yet
        , get_URL = function() {
            return view.URL || view.webkitURL || view;
        }
        , save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
        , can_use_save_link = "download" in save_link
        , click = function(node) {
            var event = new MouseEvent("click");
            node.dispatchEvent(event);
        }
        , is_safari = /constructor/i.test(view.HTMLElement) || view.safari
        , is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent)
        , throw_outside = function(ex) {
            (view.setImmediate || view.setTimeout)(function() {
                throw ex;
            }, 0);
        }
        , force_saveable_type = "application/octet-stream"
    // the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
        , arbitrary_revoke_timeout = 1000 * 40 // in ms
        , revoke = function(file) {
            var revoker = function() {
                if (typeof file === "string") { // file is an object URL
                    get_URL().revokeObjectURL(file);
                } else { // file is a File
                    file.remove();
                }
            };
            setTimeout(revoker, arbitrary_revoke_timeout);
        }
        , dispatch = function(filesaver, event_types, event) {
            event_types = [].concat(event_types);
            var i = event_types.length;
            while (i--) {
                var listener = filesaver["on" + event_types[i]];
                if (typeof listener === "function") {
                    try {
                        listener.call(filesaver, event || filesaver);
                    } catch (ex) {
                        throw_outside(ex);
                    }
                }
            }
        }
        , auto_bom = function(blob) {
            // prepend BOM for UTF-8 XML and text/* types (including HTML)
            // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
            if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
                return new Blob([String.fromCharCode(0xFEFF), blob], { type: blob.type });
            }
            return blob;
        }
        , FileSaver = function(blob, name, no_auto_bom) {
            if (!no_auto_bom) {
                blob = auto_bom(blob);
            }
            // First try a.download, then web filesystem, then object URLs
            var 
                  filesaver = this
                , type = blob.type
                , force = type === force_saveable_type
                , object_url
                , dispatch_all = function() {
                    dispatch(filesaver, "writestart progress write writeend".split(" "));
                }
            // on any filesys errors revert to saving with object URLs
                , fs_error = function() {
                    if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
                        // Safari doesn't allow downloading of blob urls
                        var reader = new FileReader();
                        reader.onloadend = function() {
                            var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
                            var popup = view.open(url, '_blank');
                            if (!popup) view.location.href = url;
                            url = undefined; // release reference before dispatching
                            filesaver.readyState = filesaver.DONE;
                            dispatch_all();
                        };
                        reader.readAsDataURL(blob);
                        filesaver.readyState = filesaver.INIT;
                        return;
                    }
                    // don't create more object URLs than needed
                    if (!object_url) {
                        object_url = get_URL().createObjectURL(blob);
                    }
                    if (force) {
                        view.location.href = object_url;
                    } else {
                        var opened = view.open(object_url, "_blank");
                        if (!opened) {
                            // Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
                            view.location.href = object_url;
                        }
                    }
                    filesaver.readyState = filesaver.DONE;
                    dispatch_all();
                    revoke(object_url);
                }
            ;
            filesaver.readyState = filesaver.INIT;

            if (can_use_save_link) {
                object_url = get_URL().createObjectURL(blob);
                setTimeout(function() {
                    save_link.href = object_url;
                    save_link.download = name;
                    click(save_link);
                    dispatch_all();
                    revoke(object_url);
                    filesaver.readyState = filesaver.DONE;
                });
                return;
            }

            fs_error();
        }
        , FS_proto = FileSaver.prototype
        , saveAs = function(blob, name, no_auto_bom) {
            return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
        }
    ;
    // IE 10+ (native saveAs)
    if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
        return function(blob, name, no_auto_bom) {
            name = name || blob.name || "download";

            if (!no_auto_bom) {
                blob = auto_bom(blob);
            }
            return navigator.msSaveOrOpenBlob(blob, name);
        };
    }

    FS_proto.abort = function() { };
    FS_proto.readyState = FS_proto.INIT = 0;
    FS_proto.WRITING = 1;
    FS_proto.DONE = 2;

    FS_proto.error =
    FS_proto.onwritestart =
    FS_proto.onprogress =
    FS_proto.onwrite =
    FS_proto.onabort =
    FS_proto.onerror =
    FS_proto.onwriteend =
        null;

    return saveAs;
} (
       typeof self !== "undefined" && self
    || typeof window !== "undefined" && window
    || this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
    module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
    define("FileSaver.js", function() {
        return saveAs;
    });
}


function SpecialCharInJson(source) {
	var str='';
	if(source==null || source==undefined) {
		return str;
	}
	var i, num = source.length;
	var ch;
	for (i = 0; i < num; i++) {
	    ch=source.charAt(i);
	    switch (ch) {
			case '\"':        
				str+="\\\"";        
				break;        
			case '\\':        
				str+="\\\\";        
				break;        
			case '/':        
				str+="\\/";        
				break;        
			case '\b':        
				str+="\\b";        
				break;        
			case '\f':        
				str+="\\f";        
				break;        
			case '\n':        
				str+="\\n";        
				break;        
			case '\r':        
				str+="\\r";        
				break;        
			case '\t':        
				str+="\\t";        
				break;        
			default:
			    str += ch;
				break;
		}
	}
	return str;
}

function SpecialCharInHtml4Json(source) {
	var str='';
	if(source==null || source==undefined) {
		return str;
	}
	var i, num = source.length;
	var ch;
	for (i = 0; i < num; i++) {
	    ch=source.charAt(i);
	    switch (ch) {
			//case '\"':        
				//str+="\\\"";        
			//	break;        
			case '\\':        
				str+="\\\\";        
				break;        
			//case '/':        
				//str+="\\/";        
			//	break;        
			case '\b':        
				str+="\\b";        
				break;        
			case '\f':        
				str+="\\f";        
				break;        
			case '\n':        
				//str+="\\n";        
				break;        
			case '\r':        
				//str+="\\r";        
				break;        
			case '\t':        
				str+="\\t";        
				break;
            case '<':
                str+='&lt;';
                break;
             case '>':
                str+='&gt;';
                break;
			default:
			    str += ch;
				break;
		}
	}
	return str;
}
/**
* 打天下
* 基于浏览器的JavaScript类
*/
function classPrintWorld(url) {
    this.downloadUrlForPdfPrint="";
    this.downloadUrlForTemplatePrint="";
    this.http2FlexPrint = null;
    this.syncHttp2FlexPrint = null;
    this.lastError = "";
    this.lastResponseText = "";
    if (url == null || url == undefined || url=="") {
        this.flexPrintURL = "http://127.0.0.1:8888"; //打天下打印服务器之缺省地址
    } else {
        this.flexPrintURL = this.NormalizedURL(url);
    }
}

classPrintWorld.prototype.IsWebsocket = function () {
    return false;
}

classPrintWorld.prototype.IsToGiliCloud = function () {
   if(typeof(this.isToGiliCloud)=="boolean") {
        return this.isToGiliCloud;
   }
   return false;
}


classPrintWorld.prototype.DownloadUrlForPdfPrint = function (url) {
    this.downloadUrlForPdfPrint=url;
     if(this.downloadUrlForPdfPrint==null || this.downloadUrlForPdfPrint==undefined) {
        this.downloadUrlForPdfPrint="";
    }
}

classPrintWorld.prototype.DownloadUrlForTemplatePrint = function (url) {
    this.downloadUrlForTemplatePrint=url;
    if(this.downloadUrlForTemplatePrint==null || this.downloadUrlForTemplatePrint==undefined) {
        this.downloadUrlForTemplatePrint="";
    }
}

classPrintWorld.prototype.CallbackOnVersion=function(callback) {
    this._Callback_OnVersion=callback;
}

classPrintWorld.prototype.CallbackOnPrintTaskStatus=function(callback) {
    this._Callback_OnPrintTaskStatus=callback;
}

classPrintWorld.prototype.CallBackOnNotReady=function(callback) {
    this._Callback_OnNotReady=callback;
}

classPrintWorld.prototype.CallbackOnPrinterList=function(callback) {
    this._Callback_OnPrinterList=callback;
}

classPrintWorld.prototype.CallbackOnPaperSource=function(callback) {
    this._Callback_OnPaperSource=callback;
}

classPrintWorld.prototype.CallbackOnMediaTypes=function(callback) {
    this._Callback_OnMediaTypes=callback;
}

classPrintWorld.prototype.CallbackOnPropSet=function(callback) {
    this._Callback_OnPropSet=callback;
}

classPrintWorld.prototype.CallbackOnPreviewImage=function(callback) {
    this._Callback_OnPreviewImage=callback;
}

classPrintWorld.prototype.CallbackOnFilePages=function(callback) {
    this._Callback_OnFilePages=callback;
}

classPrintWorld.prototype.CallbackOnPaperSize=function(callback) {
    this._Callback_OnPaperSize=callback;
}

classPrintWorld.prototype.CallbackOnGetFile=function(callback) {
    this._Callback_OnGetFile=callback;
}

classPrintWorld.prototype.CallbackOnPrinterStatus=function(callback) {
    this._Callback_OnPrinterStatus=callback;
}

function GetCloudPrint(url) {
    return new classCloudPrint(url);
}

function classCloudPrint(url) {
    this.PrintWorldObject=new classPrintWorld(url);
    this.PrintWorldObject.isToGiliCloud=true;
    this.PrintWorldObject.giliCloud=this;
    this.serverID="";
    this.authInfo="";
}

classCloudPrint.prototype.Header=function() {
    return "0:"+this.serverID+"\r\n"+this.authInfo+"\r\n\r\n";
}

classCloudPrint.prototype.ServerList=function() {
    return this.PrintWorldObject.Act("0:\r\n"+this.authInfo+"\r\n\r\n");//,null,true);
}

classCloudPrint.prototype.GetLastError = function() {
    return this.PrintWorldObject.GetLastError();
}

classCloudPrint.prototype.IsWebsocket = function () {
    return false;
}

classCloudPrint.prototype.PrintDialog = function (jsonData,CallbackPrinterSelectedInDlg) {
     PrintDialogNormal(this,jsonData,CallbackPrinterSelectedInDlg);
}

classCloudPrint.prototype.CallbackOnPrintTaskStatus=function(callback) {
     this.PrintWorldObject.CallbackOnPrintTaskStatus(callback);
}

classCloudPrint.prototype.CallbackOnVersion=function(callback) {
    this.PrintWorldObject.CallbackOnVersion(callback);
}

classCloudPrint.prototype.CallbackOnServerList=function(callback) {
    this.PrintWorldObject._Callback_OnServerList=callback;
}

classCloudPrint.prototype.CallbackOnPrinterList=function(callback) {
    this.PrintWorldObject.CallbackOnPrinterList(callback);
}

classCloudPrint.prototype.CallbackOnPreviewImage=function(callback) {
    this.PrintWorldObject.CallbackOnPreviewImage(callback);
}

classCloudPrint.prototype.CallbackOnPrinterStatus=function(callback) {
    this.PrintWorldObject.CallbackOnPrinterStatus(callback);
}

classCloudPrint.prototype.CallbackOnFilePages=function(callback) {
    this.PrintWorldObject.CallbackOnFilePages(callback);
}

classCloudPrint.prototype.CallbackOnPaperSize=function(callback) {
    this.PrintWorldObject.CallbackOnPaperSize(callback);
}

classCloudPrint.prototype.CallbackOnGetFile=function(callback) {
    this.PrintWorldObject.CallbackOnGetFile(callback);
}

classCloudPrint.prototype.Use=function(serverID,authInfo) {
    this.serverID=serverID;
    this.authInfo=authInfo;
    if (this.authInfo == undefined || this.authInfo == null) {
        this.authInfo="";
    }
     if (this.serverID == undefined || this.serverID == null) {
        this.serverID="";
    }
}

classCloudPrint.prototype.Act = function(json, callbackFunc) {
    try {
        if (typeof (json) === 'object') {
            if((typeof(json.printtask)==="string" && (json.action=="print" || json.action=="printfile")) || json.action=="printstatus") {//将给力云信息加到json中，在打印回调是可以返回，以便进一步调用给力云。
                json.cloud_serverid=this.serverID;
                json.cloud_authinfo=this.authInfo;
            }
            json = JSON.stringify(json); //转换为字符串
        } else {
            try {
                var jsonObj = JSON.parse(json);
                if((typeof(jsonObj.printtask)==="string" && (jsonObj.action=="print" || jsonObj.action=="printfile")) || jsonObj.action=="printstatus") {//将给力云信息加到json中，在打印回调是可以返回，以便进一步调用给力云。
                    jsonObj.cloud_serverid=this.serverID;
                    jsonObj.cloud_authinfo=this.authInfo;
                    json = JSON.stringify(jsonObj); //转换为字符串
                }
            } catch (err) {
                gLastError = "打天下JSON解析错误（JsonToXml），" + err; // +jsonText; // err;
                return xml;
            }
        }
    } catch (err) {
        this.lastError = err;
        return null;
    }

    json=this.Header()+json;
    return this.PrintWorldObject.Act(json, callbackFunc);//,true);
}

classCloudPrint.prototype.Direct=function(json) {
    try {
        if (typeof (json) === 'object') {
            json = JSON.stringify(json); //转换为字符串
        }
    } catch (err) {
        this.lastError = err;
        return null;
    }

    json=this.Header()+json;
    return this.PrintWorldObject.Direct(json);//,null,true);
}

/**
* 为打天下指定访问某资源的token。
* @url，网址。打天下访问该url路径及其子路径的资源，在http header中都会加上本token。
* @item，token名称，打天下打印服务将它与参数@val一起，加在http header中。
* @val，token的值
* 对于打天下服务器来说，在其运行期间，此token一直有效，除非你通过本方法更改了它。
*/
classPrintWorld.prototype.AccessToken=function(url, item, val) {
    var json = {};
    json.action = "token";
    json.url = url;
    json.item = item;
    json.val = val
    return this.Act(json); //直接发送数据到打印服务器（同步调用方法）
}

classPrintWorld.prototype.NormalizedURL = function (url) {
    url=url.trim();
    while (url.length>0 && url.lastIndexOf('/') == url.length - 1) {
        url = url.substr(0, url.length - 1);
    }
    return url;
}

classPrintWorld.prototype.PrintURL = function() {
    return this.flexPrintURL;
}

classPrintWorld.prototype.GetLastError = function() {
    return this.lastError;
}

classPrintWorld.prototype.GetResponseText = function() {
    return this.lastResponseText;
}

/**
* 获取HTTP对象
*/
classPrintWorld.prototype.GetHTTP = function() {
    if (this.http2FlexPrint == null) {
        this.http2FlexPrint = new XMLHttpRequest();

        if ("withCredentials" in this.http2FlexPrint) {
        } else if (typeof XDomainRequest != "undefined") {
            this.http2FlexPrint = new XDomainRequest();
        } else {
            this.http2FlexPrint = null;
            this.lastError = "浏览器创建HTTP对象失败，你可能需要升级或者更换浏览器。";
        }
    }
    return this.http2FlexPrint;
}

classPrintWorld.prototype.GetSyncHTTP = function() {
    if (this.syncHttp2FlexPrint == null) {
        this.syncHttp2FlexPrint = new XMLHttpRequest();

        if ("withCredentials" in this.syncHttp2FlexPrint) {
        } else if (typeof XDomainRequest != "undefined") {
            this.syncHttp2FlexPrint = new XDomainRequest();
        } else {
            this.syncHttp2FlexPrint = null;
            this.lastError = "浏览器创建HTTP对象失败，你可能需要升级或者更换浏览器。";
        }
    }
    return this.syncHttp2FlexPrint;
}

classPrintWorld.prototype.GetTempHTTP = function() {
    var http= new XMLHttpRequest();
    if ("withCredentials" in http) {
    } else if (typeof XDomainRequest != "undefined") {
        http = new XDomainRequest();
    } else {
        http = null;
        this.lastError = "浏览器创建HTTP对象失败，你可能需要升级或者更换浏览器。";
    }
    return http;
}

/**
* 向URL指向的打天下打印服务（FlexPrint）异步发送JSON数据。
* @jsonData，JSON格式数据，字符串类型
* @callbackFunc，回调函数
*/
classPrintWorld.prototype.Act = function(jsonData, callbackFunc) {//,gilicloud) {
    this.lastError = "";
    var http = null;
    if (callbackFunc == null || callbackFunc == undefined) {
        callbackFunc = this.DefaultAsyncCallbackForAct;
    }
    //if(typeof (gilicloud)!="boolean") {
    //    gilicloud=false;
   // }
    if (typeof (callbackFunc) === "function") {
        http = this.GetTempHTTP();
        //http = this.GetHTTP();
        if (http == null) {
            return false;
        }
        try {
            if (typeof (jsonData) === 'object') {
                if(jsonData.action=='print' || jsonData.action=='preview') {
                    if(typeof(jsonData.data)==='string') {
                        jsonData.data=JSON.parse(jsonData.data);
                    }
                }
                jsonData = JSON.stringify(jsonData); //转换为字符串
            }
        } catch (err) {
            this.lastError = err;
            return false;
        }
        try {
            http.PrintWorld=this;
            //http.gilicloud=gilicloud;
            http.onreadystatechange = callbackFunc;
            http.open("POST", this.flexPrintURL, true);
            http.send(jsonData); //发送数据到打印服务器FlexPrint
        } catch (err) {
            this.lastError = err;
            if(!this.IsToGiliCloud()) {//gilicloud) {
                 this.lastError+="\n可能的原因是：打天下（FlexPrint）尚未安装、启动，或者是URL指向错误。";
            }
            return false;
        }
        return true;
    } else {
        this.lastError = "Act参数错误：指定的回调参数callbackFunc不是函数。"
    }
    return false;
}

/**
* 向URL指向的打天下打印服务（FlexPrint）异步同步发送JSON数据。
*/
classPrintWorld.prototype.Direct = function(jsonData,jsonErrInfo) {//,gilicloud) {
    this.lastError = "";
    if (this.GetSyncHTTP() == null) {
        if(jsonErrInfo!=null && jsonErrInfo!=undefined && typeof (jsonErrInfo) === 'object') {
            jsonErrInfo.errno=1;
            jsonErrInfo.errinfo=this.lastError;
        }
        return null;
    }
    //if(typeof (gilicloud)!="boolean") {
    //    gilicloud=false;
    //}
    try {
        if (typeof (jsonData) === 'object') {
            if(jsonData.action=='print' || jsonData.action=='preview') {
                if(typeof(jsonData.data)==='string') {
                    jsonData.data=JSON.parse(jsonData.data);
                }
            }
            jsonData = JSON.stringify(jsonData); //转换为字符串
        }
    } catch (err) {
        this.lastError = err;
        if(jsonErrInfo!=null && jsonErrInfo!=undefined && typeof (jsonErrInfo) === 'object') {
            jsonErrInfo.errno=2;
            jsonErrInfo.errinfo=this.lastError;
        }
        return null;
    }

    try {
        this.syncHttp2FlexPrint.onreadystatechange = null;
        this.syncHttp2FlexPrint.open("POST", this.flexPrintURL, false);
        this.syncHttp2FlexPrint.send(jsonData); //发送数据
    } catch (err) {
        this.lastError = err;
        if(!this.IsToGiliCloud()) {
            this.lastError+= "\n可能的原因是：打天下（FlexPrint）尚未安装、启动，或者是URL指向错误。";
        }
        if(jsonErrInfo!=null && jsonErrInfo!=undefined && typeof (jsonErrInfo) === 'object') {
            jsonErrInfo.errno=3;
            jsonErrInfo.errinfo=this.lastError;
        }
        return null;
    }
    var json = null; // = eval("(" + this.http2FlexPrint.responseText + ")"); //返回，以JSON对象形式。
    this.lastResponseText = this.syncHttp2FlexPrint.responseText;
    //alert(this.syncHttp2FlexPrint.responseText);
    try {
        json = JSON.parse(this.syncHttp2FlexPrint.responseText);
    } catch (err) {
        this.lastError = "返回的JSON数据解析出错: " + err;
        if(jsonErrInfo!=null && jsonErrInfo!=undefined && typeof (jsonErrInfo) === 'object') {
            jsonErrInfo.errno=4;
            jsonErrInfo.errinfo=this.lastError;
        }
        return null;
    }
    if (json == null || (json.error != undefined)) {
        return json;
    } else if (json.cmd == "preview" || json.cmd == "topdf") {//跳转到预览页面
        window.open(this.PrintURL() + '/' + json.val, '_blank');
    } else if (json.cmd == "previewfile") {//跳转到预览页面
        window.open(this.PrintURL() + '/' + json.val+"&file=1", '_blank'); 
    } else if (json.cmd == 'print2file') {//打印到文件
        SaveToFile(json.val, json.name, json.ext);
    }
    return json;
}

/**
* 获取打天下服务器版本
*/
classPrintWorld.prototype.Version = function () {//同步方式获取打天下服务器版本
    var ver = "";
    var json = "{\"action\":\"whoareyou\"}";
    json = this.Direct(json);
    if (json != null && json.cmd == "whoareyou") {//打印服务已经启动
        ver = json.val.version;
    }
    return ver;
}

/**
* 检测打天下打印服务是否安装启动
* @version，版本号，字符串类型。若不提供此参数，则不检查版本。
* 返回值：-1或者<0，未安装/启动，需要安装；0，已经安装并启动不需要安装；1或者>0，有新版本，提示用户下载安装。
*/
classPrintWorld.prototype.CheckInstallation = function(version,checkpdf) {//同步方式检测本机是否安装启动了打天下服务
    var jsonInfo={};
    jsonInfo.errno=0;
    jsonInfo.errinfo="";
    var json ={};// "{\"action\":\"whoareyou\"}";
    json.action="whoareyou";
    json.checkpdf=checkpdf;
    json = this.Direct(json,jsonInfo);
    if (json != null && json.cmd == "whoareyou") {//打印服务已经启动
        if(checkpdf) {
            if(json.val.pdf=="Disabled") {//PDF打印版本未安装
                return -1;
            }
        }
        if (version != null && version != undefined && version != "") {
            if (version > json.val.version) {
                return 1; //有新版本
            } else if (version < json.val.version) {
                return 2; //用旧版本
            }
        }
        return 0; //安装并已启动
    } else if(jsonInfo.errno>0) {
        if(jsonInfo.errno==3) {//尚未安装/启动打印打天下服务器
        } else {    //出现错误
            alert(jsonInfo.errinfo);
            return 99;
        }
    }
    return -1; //尚未安装/启动打印打天下服务器
}

/**
* 有alert信息的版本。用于发现并提示CheckInstallation中的问题。
*/
classPrintWorld.prototype.CheckInstallationAlert = function (version) {//同步方式检测本机是否安装启动了打天下服务
    var json = "{\"action\":\"whoareyou\"}";
    json = this.Direct(json);
    if (json != null) {
        if (json.cmd == "whoareyou") {//打印服务已经启动
            if (version != null && version != undefined) {
                if (version > json.val.version) {
                    return 1; //有新版本
                } else if (version < json.val.version) {
                    return 2;//恢复旧版
                }
            }
            return 0; //安装并已启动
        } else {
            alert("Unexpected data: " + this.lastResponseText);
        }
    } else {// json == null
        if (this.lastError != "") {
            alert(this.lastError);
        }
        alert("Unexpected data: " + this.lastResponseText);
    }
    return -1; //尚未安装/启动打印打天下服务器
}

function TheSystemIsWindows() {
    return ((navigator.platform == "Win32") || (navigator.platform == "Windows"));
}

 function IsX64Windows() {
    var agent = navigator.userAgent.toLowerCase();
    if (agent.indexOf("win64") >= 0 || agent.indexOf("wow64") >= 0) {
        return true;
    }
    return false;
}

/**
* 检测本机打天下打印服务是否安装启动，根据检测结果提示下载安装。
* @downloadURL下载地址，可相对地址，形式如：/download/Install_c.exe
* @version，版本号，字符串类型。形式如：'1.0.0.5'，缺省，则不会更新下载。
* 返回值：true or false。
* 如果返回false，说明未安装/启动，或者下载了打天下。因此，这时候就需要退出执行打天下相关的代码，待到安装后再执行即可。
* 以下以预览(打印一样)为例说明：
*
* function OnPreview() {
*   if(!CheckInstallationPrompt("/download/Install_c.exe",'1.0.0.5') {
*       return;//需要安装或者启动打天下打印服务器
*   }
*   ...//预览相关代码
* }
*/
function CheckInstallationPrompt(downloadURL, version,checkpdf) {
    var printWorld = new classPrintWorld();
    document.body.style.cursor = "wait";
    var r = printWorld.CheckInstallation(version,checkpdf);
    document.body.style.cursor = "default";
    var bContinue = true;
    if (r != 0) {
        var prompt;
        if (r < 0) {
            bContinue = false;
            if(checkpdf) {
                prompt = "友情提示：尚未安装/启动打天下综合打印服务！\n请单击确定，下载安装。";
            } else {
                prompt = "友情提示：尚未安装/启动打天下打印服务！\n请单击确定，下载安装。";
            }
        } else if (r==1) {
            prompt = "友情提示：有新版本("+version+")的打天下打印服务！\n请单击确定，下载安装。";
        } else if (r == 2) {
            prompt = "友情提示：退回旧版本("+version+")的打天下打印服务？\n请单击确定，下载安装。";
        } else if (r==99) {//出错，且出错信息已在CheckInstallation中显示。
            return false;
        }
        if (confirm(prompt)) {
            printWorld.DownloadFile(downloadURL);
            bContinue = false;
        }
    }
    return bContinue;
}
        
function InstallationPrompt(downloadURL,prompt) {
    if (confirm(prompt)) {
           DownloadFile(downloadURL);
    }
}

function DownloadFile(downloadURL) {
    var form = document.createElement("form");
    document.body.appendChild(form);
    form.method = 'get';
    form.action = downloadURL;
    form.submit();
    document.body.removeChild(form);
}
/**
* 下载文件。主要用于下载安装程序。
*/
classPrintWorld.prototype.DownloadFile=function (downloadURL) {
    var form = document.createElement("form");
    document.body.appendChild(form);
    form.method = 'get';
    form.action = downloadURL;
    form.submit();
    document.body.removeChild(form);
}

/**
* 动态证书。这也是一种使用证书的方式。
* @content：证书字符串。
*/
classPrintWorld.prototype.Certificate = function(content) {
    var json = {};
    json.action = "certificate";
    json.content = content;
    return this.Direct(json);
}

classPrintWorld.prototype.DefaultAsyncCallbackForAct = function () {//异步调用打天下打印服务的回调函数
    if (this.readyState != 4) {// 4 = "loaded"
        return;
    }
    if (this.status == 200) {// 200 = OK
        ProcessContentFromAsyncCallback(this.PrintWorld,this.responseText,false);
    } else {
        if(this.status==0) {
            if((this.PrintWorld.downloadUrlForTemplatePrint!="" || this.PrintWorld.downloadUrlForPdfPrint!="")) {
                if(this.PrintWorld.downloadUrlForTemplatePrint!="") {
                    InstallationPrompt(this.PrintWorld.downloadUrlForTemplatePrint,"友情提示：尚未安装/启动打天下打印服务！\n请单击确定，下载安装。");
                } else {
                    InstallationPrompt(this.PrintWorld.downloadUrlForPdfPrint,"友情提示：尚未安装/启动打天下综合打印服务！\n请单击确定，下载安装。");
                }
            } else {
                if(this.PrintWorld.IsToGiliCloud()) {//gilicloud) {
                    alert("连接给力云失败！" + this.statusText);
                } else {
                    var p="尚未安装或者尚未启动打天下("+this.PrintWorld.PrintURL()+")!" ;
                     if(typeof(this.PrintWorld._Callback_OnNotReady)=="function") {
                        this.PrintWorld._Callback_OnNotReady(p);
                    } else {
                        alert(p);
                    }
                }
            }
        } else if (this.statusText != null && this.statusText != undefined && this.statusText != "") {
            alert("Http error status:" + this.status.toString() + " : " + this.statusText);
        } else {
            alert("Http error status:" + this.status.toString());
        }
    }
}

classPrintWorld.prototype.DirectEx = function (json, callback,wait_in_ms) {
    if (wait_in_ms == undefined || wait_in_ms == null) {
        wait_in_ms = 1000;//毫秒
    }
    if (callback == undefined || callback == null) {
        callback = this.DirectExCallback;
    }
    var THIS = this;
    var result=THIS.Direct(json);
    if (result==null) {//first try,failed
        setTimeout(function () {
            result = THIS.Direct(json);
            if (result == null) {//second try,failed
                setTimeout(function () {
                    result = THIS.Direct(json);
                    if (result == null) {//third try,failed
                        callback(THIS, result);
                    } else {//third try,success
                        callback(THIS, result);
                    }
                }, wait_in_ms);
            } else {//second try,success
                callback(THIS, result);
            }
        }, wait_in_ms);
    } else {    //first try,success
        callback(THIS, result);
    }
}

classPrintWorld.prototype.DirectExCallback = function (printWorld, result) {
    if (result == null) {//数据发送失败
        alert(printWorld.GetLastError());
    } else if (result.error != undefined) {//打天下打印服务返回的错误信息
        alert(result.error);
    }
}

classPrintWorld.prototype.IsWindows = function () {
    var ua=navigator.userAgent.toLowerCase();
     return (/windows/.test(ua));
}

classPrintWorld.prototype.Browser = function () {
//    var ua=navigator.userAgent.toLowerCase();
//    if(/trident/.test(ua)) {
//        return "msie"
//    } else  if(/edge/.test(ua)) {
//        return "edge"
//    } else if(/chrome/.test(ua)) {
//        return "chrome";
//    } else if(/firefox/.test(ua)) {
//        return "firefox";
//    }
//    return "unknown";
    return PW_Browser();
}
//////////////////////////////////////////////////////////
/**
* 打印机选择会话框
*/
classPrintWorld.prototype.PrintDialog = function (jsonData,CallbackPrinterSelectedInDlg) {
     PrintDialogNormal(this,jsonData,CallbackPrinterSelectedInDlg);//,false);
}
/*
    var THIS = this;
    var divDlg = document.getElementById("id_pw_divPrintDlg");
    if (null == divDlg) {
        divDlg = document.createElement('div');
        document.body.appendChild(divDlg);

        divDlg.setAttribute("id", "id_pw_divPrintDlg");
        divDlg.setAttribute("style", "box-shadow: 5px 5px 5px #888888;padding:0pt 0pt 0pt 0pt;width:-webkit-fit-content;width:-moz-fit-content;width:fit-content;height:-webkit-fit-content;color:Green");
        divDlg.style.backgroundColor = "LightGrey";
        divDlg.style.border = "solid 1px Gray";
       
         var browser=THIS.Browser();
        if(browser!="chrome" && browser!="firefox") {
            divDlg.style.width = "280pt";
        }
        if(browser!="chrome") {
            divDlg.style.height = "100pt";
       }
       divDlg.style.zIndex = "9999";
        divDlg.style.position = "fixed";
        divDlg.style.top = "0";
        divDlg.style.left = "0";
        divDlg.style.right = "0";
        divDlg.style.bottom = "0";
        divDlg.style.textAlign = "center";
        divDlg.style.margin = "auto";
        divDlg.style.fontSize="10pt";//small";
        divDlg.style.fontFamily="微软雅黑";
        divDlg.style.color="Black";
        var html = "<table  border='0px'  cellspacing='5pt' cellpadding='0' style='font-size:10pt;color:Black;font-family:微软雅黑';><tr ><td style='width:45pt;height:20pt' valign='bottom'>打印机：</td><td valign='bottom'><select  id='id_pwPrinterSelInDlg' name='PrinterSelInDlg'  style='width:195pt'></select></td>";
        html += "<td  valign='bottom'><a  id='idRefreshInDlg' style='cursor:pointer;' >刷新</a></td>";
        html +="</tr></table>";
        html += "<table  border='0px'  cellspacing='5pt' cellpadding='0' style='height:20pt;font-size:10pt;color:Black;font-family:微软雅黑'><tr><td style='width:45pt'>状　态：</td><td id='idPrinterStatusInDlg' style=' text-align:left;font-size:small; font-family:微软雅黑; color:Black'></td></tr></table>";
        html += "<table  border='0px'  cellspacing='5pt' cellpadding='0' style='height:20pt;font-size:10pt;color:Black;font-family:微软雅黑'><tr><td style='width:45pt'>份　数：</td><td><input type='number' id='idCopiesInDlg' value='1'  min='1' max='100' style='width:40pt'/></td></tr></table>";
        html += "<table border='0px'  cellspacing='5pt' cellpadding='0' style='font-size:10pt;color:Black;font-family:微软雅黑'><tr><td style='width:160pt'></td><td style='width:60pt'><button type='button' id='idBtnOKPrint' style='width:60pt'>打印</button></td>";
        html += "<td style='width:60pt'><button type='button' id='idBtnCancelPrint'  style='width:60pt'>取消</button></td></tr></table>";
        divDlg.innerHTML = html;

        PrinterListInDlg(false);

        var selPrinters = document.getElementById("id_pwPrinterSelInDlg");
        selPrinters.onchange = function () {
            PrinterChangedInDlg(selPrinters.value);
        }

        var aRefresh = document.getElementById("idRefreshInDlg");
        aRefresh.onclick = function () {//Refresh printer list
            PrinterListInDlg(true);
        }

        var btCancel = document.getElementById("idBtnCancelPrint");
        btCancel.onclick = function () {
            CancelPrintInDlg();
        }
    } else {
        document.getElementById('idCopiesInDlg').value='1';
    }
    divDlg.style.visibility = "visible"; //显示

    var btOK = document.getElementById("idBtnOKPrint");
    btOK.onclick = function () {//Do print
        DoPrintInDlg();
    }

    function PrinterListInDlg(refresh) {
        var json = {};
        json.action = "printers"; //获取打印机列表的JSON
        json.defaultprn = true;
        json.refresh=refresh;//true;
        json = THIS.Direct(json); //直接发送数据到打印服务器（同步调用方法）
        if (json == null) {//数据发送失败
        } else if (json.error != undefined) {//打天下打印服务返回的错误信息
        } else {
            var bLocalValid=false;
            if(localStorage.printerNameSelected!=null && localStorage.printerNameSelected!=undefined) {
                bLocalValid=true;
            }
            
            var sel = document.getElementById('id_pwPrinterSelInDlg'); 
            sel.options.length = 0; //清空列表
            sel.value="";
            //填充列表
            var prns = json.val;
            sel.options.add(new Option("", ""));
            for (var i = 0; i < prns.length; i++) {
                sel.options.add(new Option(prns[i].name, prns[i].name));
                if(bLocalValid) {
                    if(prns[i].name==localStorage.printerNameSelected) {
                        sel.value = prns[i].name;
                    }
                } else if (prns[i].default) {
                    sel.value = prns[i].name;
                }
            }
           
            if(sel.value=="" && prns.length>0) {
                sel.value = prns[0].name;
            }
            PrinterChangedInDlg(sel.value);
        }
    }

    function PrinterChangedInDlg(prnname) {
        localStorage.printerNameSelected = prnname;
        if (prnname == '') {
            document.getElementById("idPrinterStatusInDlg").innerHTML = "";
            return;
        }
        var json = {};
        json.action = "prnstatus";
        json.printer = prnname;
        json = THIS.Direct(json); //直接发送数据到打印服务器（同步调用方法)
        if (json == null) {//数据发送失败
        } else if (json.error != undefined) {//打天下打印服务返回的错误信息
        } else {
            document.getElementById("idPrinterStatusInDlg").innerHTML = json.printer.status;
        }
    }

    function CancelPrintInDlg() {
        if (divDlg != null) {
            divDlg.style.visibility = "hidden";
        }
    }

    function DoPrintInDlg() {
        if (divDlg == null) {
            return;
        }
        divDlg.style.visibility = "hidden";
       
        if (jsonData != null && jsonData != undefined) {
            var type = typeof (jsonData);
            if (type === 'object') {
            } else if (type === 'string') {
                try {
                    jsonData = JSON.parse(jsonData);
                } catch (err) {
                    gLastError = "Parse error in PrintDialog: " + err;
                    return;
                }
            } else {
                alert("PrintDialog: 不是JSON数据！");
                return;
            }
        }
        jsonData.printer = document.getElementById('id_pwPrinterSelInDlg').value; //打印机名称
        
        var copies=document.getElementById('idCopiesInDlg').value;
        if(copies=="") {
            jsonData.copies=1;
        } else {
            jsonData.copies=copies;
        }
       
        if (!THIS.Act(jsonData)) {
            alert(THIS.GetLastError()); //失败
        }
    }
}*/

pw_g_arrayWebsocket = new Array();//prinwolrld global array for websocket objects.
function GetPrintWorld(url) {
    var useWebsocket=true;
    if(url==null || url==undefined || url=="") {
        if(PW_Browser()=="msie") {//MS IE 必须使用HTTP
            useWebsocket=false;
            url = "http://127.0.0.1:8888"; 
        } else {
            url = "ws://127.0.0.1:8888"; //打天下打印服务器之缺省地址
        }
    } else {
        url=url.trim();
        if(url.indexOf("http://")==0 || url.indexOf("https://")==0) {
            useWebsocket=false;
        } else if(url.indexOf("ws://")==0 || url.indexOf("wss://")==0) {
        } else {
            url="ws://"+url;
        }
    }
    
    var pw=null;
    if(useWebsocket) {
        for(var i=0;i<pw_g_arrayWebsocket.length;i++) {
            if(pw_g_arrayWebsocket[i].flexPrintURL==url) {
                pw=pw_g_arrayWebsocket[i];
                break;
            }
        }
        if(pw==null) {
            pw=new classPrintWorldWS(url);
            pw_g_arrayWebsocket.push(pw);
        }
    } else {
        pw=new classPrintWorld(url);
    }
    return pw;
}

///////////////////////////////////////////////////////////////////////////////////////////////
function classPrintWorldWS(url) {
    if (url == null || url == undefined || url == "") {
        this.flexPrintURL = "ws://127.0.0.1:8888"; //打天下打印服务器之缺省地址
    } else {
        this.flexPrintURL = this.NormalizedURL(url);
    }
    this.downloadUrlForPdfPrint="";
    this.downloadUrlForTemplatePrint="";
    this.lastError = "";
    this.onmessageCallbackFunc=null;
    this.oncloseCallbackFunc=null;
    this.m_bIsOpen=false;
    var This = this;

    this.arrayWillBeSent = new Array();
    this.onopen = function () {
        This.m_bIsOpen=true;
        This.SendUncommitted();
    };
    this.onmessage = function (e) {
        if(This.onmessageCallbackFunc!=null) {
            This.onmessageCallbackFunc(e);
        }
    };
    this.onclose= function(e) {
        This.m_WebSock = null;
        This.arrayWillBeSent.length=0;
        if(This.oncloseCallbackFunc!=null) {
            This.oncloseCallbackFunc(e);
        } else {
            if(e.code == 1006) {//打天下已退出或者尚未运行。
                if((!This.m_bIsOpen) && (This.downloadUrlForTemplatePrint!="" || This.downloadUrlForPdfPrint!="")) {
                    if(This.downloadUrlForTemplatePrint!="") {
                        InstallationPrompt(This.downloadUrlForTemplatePrint,"友情提示：尚未安装/启动打天下打印服务！\n请单击确定，下载安装。");
                    } else {
                        InstallationPrompt(This.downloadUrlForPdfPrint,"友情提示：尚未安装/启动打天下综合打印服务！\n请单击确定，下载安装。");
                    }
                } else {
                    if(This.m_bIsOpen) {
                        console.warn("PrintWorld may be closed anomaly.");
                    } else {
                        var p="尚未安装或者尚未启动打天下("+This.PrintURL()+")!";
                        if(typeof(This._Callback_OnNotReady)=="function") {
                            This._Callback_OnNotReady(p);
                        } else {
                             alert(p);
                        }
                    }
                }
            } else {
                //alert(This.ErrorCodeToMsg(e.code));
            }
        }
        This.m_bIsOpen=false;
    };
    this.onerror = function (e) {
       //alert("There was an error with your websocket.");
    }
}

classPrintWorldWS.prototype.IsWebsocket = function () {
    return true;
}

classPrintWorldWS.prototype.IsToGiliCloud = function () {
   return false;
}

classPrintWorldWS.prototype.SendUncommitted = function () {
     if (this.arrayWillBeSent.length>0) {//发送尚未返送的数据
        //this.arrayWillBeSent.forEach(element => this.m_WebSock.send(element));
        for(var i=0;i<this.arrayWillBeSent.length;i++) {
            this.m_WebSock.send(this.arrayWillBeSent[i]);
        }
        this.arrayWillBeSent.length=0;
    }
}

classPrintWorldWS.prototype.PrepareWebSocket = function () {
    if (this.m_WebSock != null) {
        return true;
    }
    var This = this;
    if (typeof WebSocket == undefined) {
        this.m_WebSock = null;
        this.lastError = "Websocket is not supported by the browser.";
        return false;
    } else {
        this.m_WebSock = new WebSocket(this.flexPrintURL);
    }
    this.m_WebSock.onopen = function () {//已经连接好，可以发送数据了。
        if (This.onopen != null) {
            This.onopen();
        }
    }
    this.m_WebSock.onmessage = function (e) {
        if (This.onmessage != null) {
            This.onmessage(e);
        }
    }
    this.m_WebSock.onerror = function (e) {
        if (This.onerror != null) {
            This.onerror(e);
        }
    }
    this.m_WebSock.onclose = function (e) {
        if (This.onclose != null) {
            This.onclose(e);
        }
    }
    return true;
}

classPrintWorldWS.prototype.AccessToken=function(url, item, val) {
    var json = {};
    json.action = "token";
    json.url = url;
    json.item = item;
    json.val = val
    return this.Act(json); //直接发送数据到打印服务器（同步调用方法）
}

classPrintWorldWS.prototype.WhoAreYou = function () {
 var json ={};
    json.action="whoareyou";
    json.checkpdf=true;
    this.Act(json);
}

classPrintWorldWS.prototype.NormalizedURL = function (url) {
    url = url.trim();
    while (url.length > 0 && url.lastIndexOf('/') == url.length - 1) {
        url = url.substr(0, url.length - 1);
    }
    return url;
}

classPrintWorldWS.prototype.Close = function () {
    this.arrayWillBeSent.length = 0;
    if (this.m_WebSock == null) {
        return;
    }
    this.m_WebSock.close();
}

classPrintWorldWS.prototype.Send = function (text) {
    if (!this.PrepareWebSocket()) {
        return false;
    }
    switch (this.m_WebSock.readyState) {
        case WebSocket.CONNECTING:
            // do something
            break;
        case WebSocket.OPEN:
            this.SendUncommitted();
            this.m_WebSock.send(text); //发送数据
            return true;
        case WebSocket.CLOSING:
            // do something
            break;
        case WebSocket.CLOSED:
            // do something
            break;
        default:
            // this never happens
            break;
    }
    this.arrayWillBeSent.push(text);
    return true;
}

classPrintWorldWS.prototype.ErrorCodeToMsg = function (code) {
    var msg;
    if (code == 1000)
        msg = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
    else if(code == 1001)
        msg = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
    else if(code == 1002)
        msg = "An endpoint is terminating the connection due to a protocol error";
    else if(code == 1003)
        msg = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
    else if(code == 1004)
        msg = "Reserved. The specific meaning might be defined in the future.";
    else if(code == 1005)
        msg = "No status code was actually present.";
    else if(code == 1006) {//打天下已退出后者尚未运行。
       msg = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
    } else if(code == 1007)
        msg = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
    else if(code == 1008)
        msg = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This msg is given either if there is no other sutible msg, or if there is a need to hide specific details about the policy.";
    else if(code == 1009)
       msg = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
    else if(code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
        msg = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.msg;
    else if(code == 1011)
        msg = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
    else if(code == 1015)
        msg = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
    else
        msg = "Unknown msg";
    
    return msg;
}

classPrintWorldWS.prototype.PrintURL = function() {
    return this.flexPrintURL;
}

classPrintWorldWS.prototype.GetLastError = function() {
    return this.lastError;
}

classPrintWorldWS.prototype.Act = function (jsonData, callbackFunc) {
    this.lastError = "";
    this.onmessageCallbackFunc=callbackFunc;
    if( this.onmessageCallbackFunc==null ||  this.onmessageCallbackFunc==undefined) {
         this.onmessageCallbackFunc=this.DefaultAsyncCallbackForAct;
    }
    try {
        if (typeof (jsonData) === 'object') {
            if (jsonData.action == 'print' || jsonData.action == 'preview') {
                if (typeof (jsonData.data) === 'string') {
                    jsonData.data = JSON.parse(jsonData.data);
                }
            }
            jsonData = JSON.stringify(jsonData); //转换为字符串
        }
    } catch (err) {
        this.lastError = err;
        return false;
    }
    return this.Send(jsonData);
}

classPrintWorldWS.prototype.DefaultAsyncCallbackForAct = function (e) {//异步调用打天下打印服务的回调函数
    ProcessContentFromAsyncCallback(this,e.data);//,true);
}

function CloudPrintStatueLoop(data,giliCloud,callback) {
    if (data instanceof Array) {
        if (data.length > 0) {
            if (data[data.length-1].stage != "ending") {
                window.setTimeout(GetPrintStatus, 1000, data[data.length - 1].taskid, data[data.length - 1].cloud_serverid, data[data.length - 1].cloud_authinfo);
            }
        }
        for (var i in data) {
            callback(data[i]);
        }
    } else if (typeof (data) === 'object') {
        if (data.stage != "ending") {
            window.setTimeout(GetPrintStatus, 1000, data.taskid, data.cloud_serverid, data.cloud_authinfo);
        }
        if (data.stage != undefined) {
            callback(data);
        }
    }

    function GetPrintStatus(id, cloudServerID, CloudAuthInfo) {
        if (id == undefined || id == null || id == "") {
            return;
        }
        var json = {};
        json.action = "printstatus";
        json.taskid = id;
        giliCloud.Use(cloudServerID, CloudAuthInfo); 
        if (!giliCloud.Act(json)) {
            alert(giliCloud.GetLastError());
        }
    }
}

function ProcessContentFromAsyncCallback(pwObject,content) {//,isWebsocket) {
    var json;
    try {
        json = JSON.parse(content);
    } catch (err) {
        alert("返回了无效数据，可能是指定的URL不是打天下或给力云。JSON parse error: " + err);//可能的原因：指向url不是打天下或者给力云，则可能返回的数据不符合规范要求。
        return;
    }
    if (json.error != undefined) {//返回错误信息
        if(json.err_code==128) {//未安装PDF打印
            if(pwObject.downloadUrlForPdfPrint!="") {
                InstallationPrompt(pwObject.downloadUrlForPdfPrint,"友情提示：尚未安装/启动打天下（相应版本的打印服务）！\n请单击确定，下载安装。");
                return;
            }
        }
        if(json.error=="") {
            if(pwObject.IsToGiliCloud()) {
                alert("给力云没有返回适当的信息。");//云打印在更改了监听绑定之后，会如此。
            } else {
                alert("出错，但未返回错误信息。");
            }
        } else {
            alert(json.error);
        }
    } else if (json.cmd == "printers") {//打印机列表
        if(typeof(pwObject._Callback_OnPrinterList)=="function") {
            pwObject._Callback_OnPrinterList(json);
        }
    } else if (json.cmd == "print" || json.cmd == "printstatus" || json.cmd == "multiprint") {//打印状态信息
         if(typeof(pwObject._Callback_OnPrintTaskStatus)=="function") {
            if(pwObject.giliCloud==undefined || pwObject.giliCloud==null) {
                pwObject._Callback_OnPrintTaskStatus(json.val);
            } else {//给力云采用的是http，因此通过循环“拉”的方式来获取打印状态
                CloudPrintStatueLoop(json.val,pwObject.giliCloud,pwObject._Callback_OnPrintTaskStatus);
            }
        }
    } else if (json.cmd == 'print2file') {//打印到文件
        SaveToFile(json.val, json.name, json.ext); //保存文件
    } else if (json.cmd == "preview" || json.cmd == "previewfile" || json.cmd == "topdf") {//跳转到预览页面
        var url=pwObject.PrintURL() + '/' + json.val;
        if(json.cmd == "previewfile") {
            url+="&file=1";
        }
        if(pwObject.IsWebsocket()) {
            if(url.indexOf("ws://")==0) {
                url=url.substring(5);
                url="http://"+url;
            } else if(url.indexOf("wss://")==0) {
                url=url.substring(6);
                url="https://"+url;
            } 
            url+="&ws=1";
        }
        window.open(url, '_blank'); //另启窗口预览（浏览器可能会出现阻止弹窗提示）。  
    } else if (json.cmd == "prnstatus") {//打印机状态
        if(typeof(pwObject._Callback_OnPrinterStatus)=="function") {
            pwObject._Callback_OnPrinterStatus(json);
        }
    } else if (json.cmd == "whoareyou") {
        if(typeof(pwObject._Callback_OnVersion)=="function") {
            pwObject._Callback_OnVersion(json);
        }
    } else if (json.cmd == "serverlist") {//给力云返回的打天下打印服务器列表
        if(typeof(pwObject._Callback_OnServerList)=="function") {
            pwObject._Callback_OnServerList(json);
        }
    } else if (json.cmd == "image" || json.cmd == "imagefile") {
         if(typeof(pwObject._Callback_OnPreviewImage)=="function") {
            pwObject._Callback_OnPreviewImage(json);
        } else {
            alert("CallbackOnPreviewImage is not specified for action=\"image\".");
        }
    } else if(json.cmd=="papersource") {
        if(typeof(pwObject._Callback_OnPaperSource)=="function") {
            pwObject._Callback_OnPaperSource(json.val);
        }
    } else if(json.cmd=="mediatypes") {
         if(typeof(pwObject._Callback_OnMediaTypes)=="function") {
            pwObject._Callback_OnMediaTypes(json.val);
        }
    } else if(json.cmd=="propset") {
        if(typeof(pwObject._Callback_OnPropSet)=="function") {
            pwObject._Callback_OnPropSet(json.val);
        }
    } else if(json.cmd == "filepages") {//获取PDF等文档的总页数
        if(typeof(pwObject._Callback_OnFilePages)=="function") {
            pwObject._Callback_OnFilePages(json);
        }
    } else if(json.cmd == "papersize") {//获取PDF等文档的总页数
        if(typeof(pwObject._Callback_OnPaperSize)=="function") {
            pwObject._Callback_OnPaperSize(json);
        }
    }else if(json.cmd == "getfile") {//获取PDF等文档的总页数
        if(typeof(pwObject._Callback_OnGetFile)=="function") {
            pwObject._Callback_OnGetFile(json);
        }
    } else {
        if( json.cmd==undefined || json.cmd==null) {//可能的原因：指向url不是打天下或者给力云，即使其返回JSON，但是没有json.cmd。
            alert("返回了无效数据，可能是指定的URL不是打天下或给力云。");
        }
    }
}

classPrintWorldWS.prototype.Browser = function () {
    return PW_Browser();
}

function PW_Browser() {
    var ua=navigator.userAgent.toLowerCase();
    if(/trident/.test(ua)) {
        return "msie"
    } else  if(/edge/.test(ua)) {
        return "edge"
    } else if(/chrome/.test(ua)) {
        return "chrome";
    } else if(/firefox/.test(ua)) {
        return "firefox";
    }
    return "unknown";
}

classPrintWorldWS.prototype.PrintDialog = function (jsonData,CallbackPrinterSelectedInDlg) {
    PrintDialogNormal(this,jsonData,CallbackPrinterSelectedInDlg);
}

function PrintDialogNormal(pwObj,jsonData,CallbackPrinterSelectedInDlg) {//,isWebsocket) {
    var THIS = pwObj;//this;
    var divDlg = document.getElementById("id_pw_divPrintDlg");
    var isWebsocket=pwObj.IsWebsocket();
    if (null == divDlg) {
        divDlg = document.createElement('div');
        document.body.appendChild(divDlg);

        divDlg.setAttribute("id", "id_pw_divPrintDlg");
        divDlg.setAttribute("style", "box-shadow: 5px 5px 5px #888888;padding:0pt 0pt 0pt 0pt;width:-webkit-fit-content;width:-moz-fit-content;width:fit-content;height:-webkit-fit-content;color:Green");
        divDlg.style.backgroundColor = "LightGrey";
        divDlg.style.border = "solid 1px Gray";
       
         var browser=PW_Browser();//THIS.Browser();
        if(browser!="chrome" && browser!="firefox") {
            divDlg.style.width = "280pt";
        }
        if(browser!="chrome") {
            divDlg.style.height = "100pt";
       }
       divDlg.style.zIndex = "9999";
        divDlg.style.position = "fixed";
        divDlg.style.top = "0";
        divDlg.style.left = "0";
        divDlg.style.right = "0";
        divDlg.style.bottom = "0";
        divDlg.style.textAlign = "center";
        divDlg.style.margin = "auto";
        divDlg.style.fontSize="10pt";//small";
        divDlg.style.fontFamily="微软雅黑";
        divDlg.style.color="Black";
        var html = "<table  border='0px'  cellspacing='5pt' cellpadding='0' style='font-size:10pt;color:Black;font-family:微软雅黑';><tr ><td style='width:45pt;height:20pt' valign='bottom'>打印机：</td><td valign='bottom'><select  id='id_pwPrinterSelInDlg' name='PrinterSelInDlg'  style='width:195pt'></select></td>";
        html += "<td  valign='bottom'><a  id='idRefreshInDlg' style='cursor:pointer;' >刷新</a></td>";
        html +="</tr></table>";
        html += "<table  border='0px'  cellspacing='5pt' cellpadding='0' style='height:20pt;font-size:10pt;color:Black;font-family:微软雅黑'><tr><td style='width:45pt'>状　态：</td><td id='idPrinterStatusInDlg' style=' text-align:left;font-size:small; font-family:微软雅黑; color:Black'></td></tr></table>";
        html += "<table  border='0px'  cellspacing='5pt' cellpadding='0' style='height:20pt;font-size:10pt;color:Black;font-family:微软雅黑'><tr><td style='width:45pt'>份　数：</td><td><input type='number' id='idCopiesInDlg' value='1'  min='1' max='100' style='width:40pt'/></td></tr></table>";
        html += "<table border='0px'  cellspacing='5pt' cellpadding='0' style='font-size:10pt;color:Black;font-family:微软雅黑'><tr><td style='width:160pt'></td><td style='width:60pt'><button type='button' id='idBtnOKPrint' style='width:60pt'>打印</button></td>";
        html += "<td style='width:60pt'><button type='button' id='idBtnCancelPrint'  style='width:60pt'>取消</button></td></tr></table>";
        divDlg.innerHTML = html;

        PrinterListInDlg(false);

        var selPrinters = document.getElementById("id_pwPrinterSelInDlg");
        selPrinters.onchange = function () {
            PrinterChangedInDlg(selPrinters.value);
        }

        var aRefresh = document.getElementById("idRefreshInDlg");
        aRefresh.onclick = function () {//Refresh printer list
            PrinterListInDlg(true);
        }

        var btCancel = document.getElementById("idBtnCancelPrint");
        btCancel.onclick = function () {
            CancelPrintInDlg();
        }
    } else {
        document.getElementById('idCopiesInDlg').value='1';
    }
    divDlg.style.visibility = "visible"; //显示

    var btOK = document.getElementById("idBtnOKPrint");
    btOK.onclick = function () {//Do print
        DoPrintInDlg();
    }

    function PrinterListInDlg(refresh) {
        var json = {};
        json.action = "printers"; //获取打印机列表的JSON
        json.defaultprn = true;
        json.refresh=refresh;//true;
        THIS.Act(json,CallbackForPrinters);//Direct(json); //直接发送数据到打印服务器（同步调用方法）
    }

    function CallbackForPrinters(e) {
        var json = null;
        if(isWebsocket) {
            json=e.data;
        } else {//http
            if (this.readyState != 4) {// 4 = "loaded"
                return;
            }
            if (this.status == 200) {// 200 = OK
                json=this.responseText;
            }
        }
        try {
            json = JSON.parse(json);
        } catch (err) {
            return;
        }
        if (json.error != undefined) {//打天下打印服务返回的错误信息
        } else {
            var bLocalValid=false;
            if(localStorage.printerNameSelected!=null && localStorage.printerNameSelected!=undefined) {
                bLocalValid=true;
            }
            
            var sel = document.getElementById('id_pwPrinterSelInDlg'); 
            sel.options.length = 0; //清空列表
            sel.value="";
            //填充列表
            var prns = json.val;
            sel.options.add(new Option("", ""));
            for (var i = 0; i < prns.length; i++) {
                sel.options.add(new Option(prns[i].name, prns[i].name));
                if(bLocalValid) {
                    if(prns[i].name==localStorage.printerNameSelected) {
                        sel.value = prns[i].name;
                    }
                } else if (prns[i].default) {
                    sel.value = prns[i].name;
                }
            }
           
            if(sel.value=="" && prns.length>0) {
                sel.value = prns[0].name;
            }
            PrinterChangedInDlg(sel.value);
        }
    }

    function PrinterChangedInDlg(prnname) {
        localStorage.printerNameSelected = prnname;
        if (prnname == '') {
            document.getElementById("idPrinterStatusInDlg").innerHTML = "";
            return;
        }
        var json = {};
        json.action = "prnstatus";
        json.printer = prnname;
        THIS.Act(json,CallbackForPrinterStatus);
    }

    function CallbackForPrinterStatus(e) {
        var json = null;
        if(isWebsocket) {
            json=e.data;
        } else {//http
            if (this.readyState != 4) {// 4 = "loaded"
                return;
            }
            if (this.status == 200) {// 200 = OK
                json=this.responseText;
            }
        }
        try {
            json = JSON.parse(json);
        } catch (err) {
            return;
        }
       if (json.error != undefined) {//打天下打印服务返回的错误信息
        } else {
            document.getElementById("idPrinterStatusInDlg").innerHTML = json.printer.status;
        }
    }

    function CancelPrintInDlg() {
        if (divDlg != null) {
            divDlg.style.visibility = "hidden";
        }
    }

    function DoPrintInDlg() {
        if (divDlg == null) {
            return;
        }
        divDlg.style.visibility = "hidden";
       
        if (jsonData != null && jsonData != undefined) {
            var type = typeof (jsonData);
            if (type === 'object') {
            } else if (type === 'string') {
                try {
                    jsonData = JSON.parse(jsonData);
                } catch (err) {
                    gLastError = "Parse error in PrintDialog: " + err;
                    return;
                }
            } else {
                alert("PrintDialog: 不是JSON数据！");
                return;
            }
        }
        if(jsonData.action != "print" && jsonData.action != "printfile") {
            alert("action 必须是print 或者 printfile。");
            return;
        }
        jsonData.printer = document.getElementById('id_pwPrinterSelInDlg').value; //打印机名称
        
        if(typeof(CallbackPrinterSelectedInDlg)=="function") {
            CallbackPrinterSelectedInDlg(jsonData.printer);
        }
        var copies=document.getElementById('idCopiesInDlg').value;
        if(copies=="") {
            jsonData.copies=1;
        } else {
            jsonData.copies=copies;
        }
       
        if (!THIS.Act(jsonData)) {
            alert(THIS.GetLastError()); //失败
        }
    }
}

classPrintWorldWS.prototype.DownloadUrlForPdfPrint = function (url) {
    this.downloadUrlForPdfPrint=url;
     if(this.downloadUrlForPdfPrint==null || this.downloadUrlForPdfPrint==undefined) {
        this.downloadUrlForPdfPrint="";
    }
}

classPrintWorldWS.prototype.DownloadUrlForTemplatePrint = function (url) {
    this.downloadUrlForTemplatePrint=url;
    if(this.downloadUrlForTemplatePrint==null || this.downloadUrlForTemplatePrint==undefined) {
        this.downloadUrlForTemplatePrint="";
    }
}

classPrintWorldWS.prototype.CallbackOnVersion=function(callback) {
    this._Callback_OnVersion=callback;
}

classPrintWorldWS.prototype.CallbackOnPrintTaskStatus=function(callback) {
    this._Callback_OnPrintTaskStatus=callback;
}

classPrintWorldWS.prototype.CallBackOnNotReady=function(callback) {
    this._Callback_OnNotReady=callback;
}

classPrintWorldWS.prototype.CallbackOnPrinterList=function(callback) {
    this._Callback_OnPrinterList=callback;
}

classPrintWorldWS.prototype.CallbackOnPaperSource=function(callback) {
    this._Callback_OnPaperSource=callback;
}

classPrintWorldWS.prototype.CallbackOnMediaTypes=function(callback) {
    this._Callback_OnMediaTypes=callback;
}

classPrintWorldWS.prototype.CallbackOnPropSet=function(callback) {
    this._Callback_OnPropSet=callback;
}

classPrintWorldWS.prototype.CallbackOnPreviewImage=function(callback) {
    this._Callback_OnPreviewImage=callback;
}

classPrintWorldWS.prototype.CallbackOnFilePages=function(callback) {
    this._Callback_OnFilePages=callback;
}

classPrintWorldWS.prototype.CallbackOnPaperSize=function(callback) {
    this._Callback_OnPaperSize=callback;
}

classPrintWorldWS.prototype.CallbackOnGetFile=function(callback) {
    this._Callback_OnGetFile=callback;
}

classPrintWorldWS.prototype.CallbackOnPrinterStatus=function(callback) {
    this._Callback_OnPrinterStatus=callback;
}
///////////////////////////////////////////////////////////////////////////////////////

function classPrintStatusContainer() {
    this.Container=new Array();
}

classPrintStatusContainer.prototype.Remove = function (printWorldWS) {
    
}

classPrintStatusContainer.prototype.StatusMonitor = function (id, callback) {
    var pWS = new classPrintWorldWS();
    this.Container.push(pWS);
    pWS.Container=this;
    pWS.onmessage = callback;
    var json = "{\"action\":\"print_task_status\",\"taskid\":\"";
    json+=id;
    id+="\"}";
    pWS.Send(json);
}

////////////////////////////////////////////////////////////////////////////
//                          print dialog with preview: begin                                  //
////////////////////////////////////////////////////////////////////////////
function PWD_PrintDialog(json,printWorld,dialogParam) {
    Init();
    gPWD_Params.printWorld=printWorld;
    if(gPWD_Params.printWorld==undefined || gPWD_Params.printWorld==null) {
        gPWD_Params.printWorld=GetPrintWorld();
    }
    //gPWD_Params.json=json;
    if(typeof (json) === 'object') {
        gPWD_Params.json=JSON.parse(JSON.stringify(json));//不直接将json赋值给 gPWD_Params.json，是为了在更改gPWD_Params.json时，不影响json。仅此而已。
    } else if (typeof (json) === 'string') {
         try {
            gPWD_Params.json = JSON.parse(json);
        } catch (err) {
            alert(err);
            return;
        }
    }
    gPWD_Params.initializedParam.used=false;
    gPWD_Params.initializedParam.duplex=gPWD_Params.json.duplex;
    gPWD_Params.initializedParam.colorful=gPWD_Params.json.colorful;

    if(typeof(dialogParam)==='object') {
        gPWD_Params.callbackOnClose=dialogParam.callbackOnClose;
        gPWD_Params.callbackOnPrint=dialogParam.callbackOnPrint;
        if(typeof (dialogParam.width)==='number') {
            gPWD_Params.dialogWidth=dialogParam.width;
        }
        if(typeof (dialogParam.height)==='number') {
            gPWD_Params.dialogHeight=dialogParam.height;
        }
    }
    
    if (typeof (gPWD_Params.json)=== 'object') {
        if(gPWD_Params.json.action=="preview" || gPWD_Params.json.action=="print") {
            gPWD_Params.json.action="image";
        } else if(gPWD_Params.json.action=="previewfile" || gPWD_Params.json.action=="printfile") {
             gPWD_Params.json.action="imagefile";
        }
        if(gPWD_Params.json.action!="image" && gPWD_Params.json.action!="imagefile") {
            alert("The action is not for PrintDialog: "+gPWD_Params.json.action);
            return;
        }
    }
   
    var dialog = document.getElementById("pwd_dialogPrint");
    if (null == dialog) {
        dialog = document.createElement('dialog');
        document.body.appendChild(dialog);
        dialog.setAttribute("id", "pwd_dialogPrint");
        dialog.setAttribute("style", "background-color:Gray; border-width:1px; padding:0 0 0 0; border-color:Gray;user-select:none");
        dialog.innerHTML="";
        PWD_GetDialogInnerhtml();
    } else if(dialog.innerHTML=="") {
        PWD_GetDialogInnerhtml();
    } else {
        dialog.showModal();
        PWD_OpenCheck(dialog);
    }
}

var gPWD_Params={};
function Init() { 
    gPWD_Params.jsonReturned={};
    gPWD_Params.json={};
    gPWD_Params.initializedParam={};
    gPWD_Params.initializedParam.used=false;
    gPWD_Params.dialogWidth=1100;
    gPWD_Params.dialogHeight=600;
    gPWD_Params.printWorld=null;
}
        
function PWD_Header4ReleasePreviewObjInServer() {
    if(gPWD_Params.printWorld==null || gPWD_Params.printWorld==undefined) {
        return '';
    }
    if(typeof (gPWD_Params.printWorld.Header) === "function") {//for gilicloud
        return gPWD_Params.printWorld.Header();
    }
    return '';
}
function PWD_ReleasePreviewObjInServer() {
    var url = location.protocol + "//" + location.host;
    var json={};
    json.action="objectrelease";
    json.data={};
    json.data.type="preview";
    json.data.ptr=gPWD_Params.jsonReturned.object;
    json=JSON.stringify(json);
    if (navigator.sendBeacon) {
        navigator.sendBeacon(url, PWD_Header4ReleasePreviewObjInServer()+json);
    } else {
    }
}
function PWD_CallbackImage(json) {//回调函数
    gPWD_Params.jsonReturned=json;
    document.getElementById("pwd_imageview").innerHTML = "<img style='border-style:solid;border-width:1px;border-color:Gray;box-shadow: 5px 5px 5px #888888;' src='" + json.val + "'/>";   //在divImage中显示预览图像
    
    //如果某个预览有多页图像，可以保留json.object，获取后续页图像时可引用object，以提高效率。
    PWD_CmdUI();
}
function PWD_Waiting() {
    document.getElementById("pwd_imageview").innerHTML = "<img  src='img/waiting.gif'/>";   //在divImage中显示预览图像
}

function PWD_Preview() {//预览
    PWD_Waiting();
    gPWD_Params.printWorld.CallbackOnPreviewImage(PWD_CallbackImage);   //指定回调（该回调见后面的代码）
    if (!gPWD_Params.printWorld.Act(gPWD_Params.json)) {
        alert(gPWD_Params.printWorld.GetLastError());
    }
}

function PWD_OnNext() {//预览下一页
    if(PWD_CanNextImage()) {
        PWD_ToPage(gPWD_Params.jsonReturned.page+1);
    }
}

function PWD_OnPrev() {//预览前一页
    if(PWD_CanPrevImage()) {//gPWD_Params.jsonReturned.page-1>=0) {
        PWD_ToPage(gPWD_Params.jsonReturned.page-1);
    }
}

function PWD_OnFirst() {//预览首页
    if(PWD_CanPrevImage()) {
        PWD_ToPage(0);
    }
}

function PWD_OnLast() {//预览尾页
    if(PWD_CanNextImage()) {
        PWD_ToPage(-1);
    }
}
function PWD_ToPage(page) {//预览指定页
    PWD_Waiting();
    gPWD_Params.json.object=gPWD_Params.jsonReturned.object;
    gPWD_Params.json.page=page;
    gPWD_Params.printWorld.CallbackOnPreviewImage(PWD_CallbackImage);   //指定回调（该回调见后面的代码）
    if (!gPWD_Params.printWorld.Act(gPWD_Params.json)) {
        alert(gPWD_Params.printWorld.GetLastError());
    }
}

    function PWD_OnPrinterStatus() {//获取当前选择的打印机状态
    var json = "{\"action\":\"prnstatus\",\"printer\":\"";
    json += SpecialCharInJson(document.getElementById('pwd_selectPrinterList').value); //构建JSON字符串需要SpecialCharInJson。JSON对象赋值：json.printer=xxx方式，就不需要SpecialCharInJson了。
    json += "\"}";
    gPWD_Params.printWorld.CallbackOnPrinterStatus(PWD_PrinterStatus);
    if (!gPWD_Params.printWorld.Act(json)) {//异步发送json到打印服务
        alert(gPWD_Params.printWorld.GetLastError());
    }
           
}

function PWD_PrinterStatus(json) {//打印机状态显示，并根据打印机的属性来设置彩色等选项。
    document.getElementById('pwd_labelPrinterState').innerText=json.printer.status; //$("#pwd_labelPrinterState").text(json.printer.status);//打印机状态描述文本
    if (json.printer.color == "yes") {//支持彩色打印
        document.getElementById("pwd_selColor").disabled=false;//$("#pwd_selColor").prop('disabled', false);
        if(!gPWD_Params.initializedParam.used) { 
            if(gPWD_Params.initializedParam.colorful>0 && gPWD_Params.initializedParam.colorful<=2) {
                document.getElementById('pwd_selColor').selectedIndex=gPWD_Params.initializedParam.colorful;
            } else {
                document.getElementById('pwd_selColor').selectedIndex=0;
            }
        }
    } else {
        document.getElementById('pwd_selColor').selectedIndex=0;
        document.getElementById("pwd_selColor").disabled=true;//$("#pwd_selColor").prop('disabled', true);
    }

    if (json.printer.duplex == "yes") {//支持双面打印
        document.getElementById("pwd_selDoubleSide").disabled=false;//$("#pwd_selDoubleSide").prop('disabled', false);
        if(!gPWD_Params.initializedParam.used) {
            if(gPWD_Params.initializedParam.duplex-1>=0) {
                 document.getElementById('pwd_selDoubleSide').selectedIndex=gPWD_Params.initializedParam.duplex-1;
            }
        }
    } else {
        document.getElementById('pwd_selDoubleSide').selectedIndex=0;
        document.getElementById("pwd_selDoubleSide").disabled=true;//$("#pwd_selDoubleSide").prop('disabled', true);
    }

    gPWD_Params.initializedParam.used=true;//gPWD_Params.initializedParam只使用一次。
}

    function PWD_OnPrinters() {  //获取打印机列表
    var json = "{\"action\":\"printers\",\"defaultprn\":true}";     //获取打印机列表的JSON文本
    gPWD_Params.printWorld.CallbackOnPrinterList(PWD_Printers2List);
    if (!gPWD_Params.printWorld.Act(json)) {//异步发送json到打印服务
        alert(gPWD_Params.printWorld.GetLastError());
    }
}

function PWD_Printers2List(json) {//将打印机填充到下拉列表组合框
    var lastSelected = "";//PrinterNameSelectedFromStorage();
    var sel = document.getElementById('pwd_selectPrinterList');
    var lastPrinterSelected = sel.value;
    sel.options.length = 0; //清空列表
    //填充列表
    var prns = json.val;
    for (var i = 0; i < prns.length; i++) {
        sel.options.add(new Option(prns[i].name, prns[i].name));
        if (prns[i].default) {
            if(lastSelected == undefined || lastSelected == null || lastSelected == "") {//无lastSelected
                sel.value=prns[i].name;
            }
        }
    }
    if(lastSelected!=null && lastSelected!=undefined && lastSelected!="") {//有lastSelected
        for (var i = 0; i < prns.length; i++) {
            if (prns[i].name == lastSelected) {
                sel.value = lastSelected;
                break;
            }
        }
    }
    if(gPWD_Params.json!=null && gPWD_Params.json.printer!=null && gPWD_Params.json.printer!=undefined) {
        for (var i = 0; i < prns.length; i++) {
            if(gPWD_Params.json!=null) {
                if(gPWD_Params.json.printer==prns[i].name) {
                        sel.value = prns[i].name;
                        break;
                }
            }
        }
    }
           
    PWD_OnPrinterStatus();
}

function PWD_GetDialogInnerhtml() {//获取页面HTML内容，该页面把内容由打天下打印服务器返回。
    var json={};
    json.action="getfile";
    json.file="/web/dialoginner.txt";
    gPWD_Params.printWorld.CallbackOnGetFile(PWD_GetFileCallback);
    if (!gPWD_Params.printWorld.Act(json)) {//异步发送json到打印服务
        alert(gPWD_Params.printWorld.GetLastError());
    }
}

function PWD_GetFileCallback(json) {
    var dialog = document.getElementById("pwd_dialogPrint");
    if(dialog!=null && dialog!=undefined) {
        dialog.innerHTML=json.val;
        dialog.showModal();
        PWD_OpenCheck(dialog);
    }
}

function PWD_OpenCheck(dialog) {
    if (dialog.open) {
        PWD_OnDialogOpen();
    } else {
        PWD_OnDialogClose();
    }
}

function PWD_OnCloseClicked() {
    CloseDialog();
}

function CloseDialog() {
    var dialog = document.getElementById('pwd_dialogPrint');
    dialog.close(document.getElementById("pwd_selectPrinterList").value);
    PWD_OpenCheck(dialog);
}

function PWD_OnPrintClicked() {//打印
    var json=JSON.parse(JSON.stringify(gPWD_Params.json));//不直接将gPWD_Params.json赋值给json ，是为了在更改json时，不影响gPWD_Params.json。
    if(gPWD_Params.json.action == "imagefile") {
        json.action="printfile";
    } else {
        json.action="print";
    }
    json.printer=document.getElementById('pwd_selectPrinterList').value; //打印机名称;
    json.duplex=document.getElementById('pwd_selDoubleSide').value;
    json.colorful=document.getElementById('pwd_selColor').value;//取值为整数：2，彩色打印；1，黑白打印；-1，系统默认。缺省为-1。
    var copies=document.getElementById('pwd_inputCopies').value;
    if(copies=="") {
        json.copies=1;
    } else {
        json.copies=copies;
    }
    var scope=document.getElementById('pwd_selScope').value;
    if(scope=="partial") {
        json.pages2print = document.getElementById('pwd_inputCustomPages').value;
    } else {
        if(scope=="o") {
             json.pages2print="o";
        } else if(scope=="e") {
             json.pages2print="e";
        } else if(scope=="c") {
            if(gPWD_Params.jsonReturned.page>=0) {
                json.pages2print=gPWD_Params.jsonReturned.page+1;
            }
        }
    }
    if (!gPWD_Params.printWorld.Act(json)) {//异步发送json到打印服务
        alert(gPWD_Params.printWorld.GetLastError());
    } else {
        if (typeof gPWD_Params.callbackOnPrint === "function") {
            if(gPWD_Params.callbackOnPrint(document.getElementById("pwd_selectPrinterList").value)) {
                CloseDialog();
            }
        }
    }
}

function PWD_SizeDialog() {
    var dialog=document.getElementById('pwd_dialogPrint');
    dialog.style.width=gPWD_Params.dialogWidth;
    dialog.style.height=gPWD_Params.dialogHeight;

    gPWD_Params.dialogWidth=dialog.offsetWidth;
    gPWD_Params.dialogHeight=dialog.offsetHeight;
    var previewHeadderHeight=25;
    var imageWidth=gPWD_Params.dialogWidth-300;
    var imageHeight=gPWD_Params.dialogHeight-previewHeadderHeight-25;
    document.getElementById('pwd_tdPreview').style.width=imageWidth;//$("#pwd_tdPreview").width(imageWidth);
    document.getElementById('pwd_divimage').style.width=imageWidth;//$("#pwd_divimage").width(imageWidth).height(imageHeight);
    document.getElementById('pwd_divimage').style.height=imageHeight;
}

function PWD_CanPrevImage() {
    return (gPWD_Params.jsonReturned.page>0);
}
function PWD_CanNextImage() {
    return (gPWD_Params.jsonReturned.totalpages<=0 || gPWD_Params.jsonReturned.page<gPWD_Params.jsonReturned.totalpages-1) 
}

function PWD_CmdUI() {
    if(gPWD_Params.jsonReturned.page!=undefined && gPWD_Params.jsonReturned.page>=0) {
        if(gPWD_Params.jsonReturned.totalpages>0) {
            document.getElementById('pwd_lableCurPage').innerText=gPWD_Params.jsonReturned.page+1+'/'+gPWD_Params.jsonReturned.totalpages; 
        } else {
            document.getElementById('pwd_lableCurPage').innerText=gPWD_Params.jsonReturned.page+1;
        }

        if(PWD_CanPrevImage()) {
            document.getElementById("pwd_buttonFirst").disabled=false;
            document.getElementById("pwd_buttonPrev").disabled=false;
        } else {
             document.getElementById("pwd_buttonFirst").disabled=true;
             document.getElementById("pwd_buttonPrev").disabled=true;
        }
        if(PWD_CanNextImage()) {
            document.getElementById("pwd_buttonLast").disabled=false;
            document.getElementById("pwd_buttonNext").disabled=false;
        } else {
            document.getElementById("pwd_buttonLast").disabled=true;
            document.getElementById("pwd_buttonNext").disabled=true;
        }
    } else {
        document.getElementById('pwd_lableCurPage').innerText="";
        document.getElementById("pwd_buttonLast").disabled=true;
        document.getElementById("pwd_buttonNext").disabled=true;
        document.getElementById("pwd_buttonFirst").disabled=true;
        document.getElementById("pwd_buttonPrev").disabled=true;
    }
}
function PWD_OnRatioChanged() {
    gPWD_Params.json.ratio=document.getElementById('pwd_selectRatio').value;
    PWD_Preview();
}

function PWD_OnDialogClose() {
    PWD_ReleasePreviewObjInServer();
    if (typeof gPWD_Params.callbackOnClose === "function") {
        var dialog = document.getElementById('pwd_dialogPrint');
        gPWD_Params.callbackOnClose(dialog.returnValue);
    }
}

function PWD_OnDialogOpen() {
    if(gPWD_Params.json.ratio==undefined) {
        document.getElementById('pwd_selectRatio').value = 100;
    } else {
        document.getElementById('pwd_selectRatio').value = gPWD_Params.json.ratio;
    }
    PWD_SizeDialog();
    PWD_OnPrinters();
    PWD_Preview();
    PWD_CmdUI();
}

function PWD_OnScopeChanged() {
    if(document.getElementById('pwd_selScope').value=="partial") {
        document.getElementById("pwd_trCustomPages").style.visibility="visible";//$("#pwd_trCustomPages").css('visibility','visible');
    } else {
        document.getElementById("pwd_trCustomPages").style.visibility="hidden";//$("#pwd_trCustomPages").css('visibility','hidden');
    }
}

function PWD_OnKeyDown(e) {
     var b=true;
    switch (e.keyCode) {
        case 37:
            PWD_OnPrev();
            b=false;
            break;
        case 39:
            PWD_OnNext();
            b= false;
            break;
        default:
            break;
    }
    return b;
}
////////////////////////////////////////////////////////////////////////////
//                          print dialog with preview: end                                    //
////////////////////////////////////////////////////////////////////////////