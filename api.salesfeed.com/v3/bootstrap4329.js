/*
                   ,:::                                                       +++#             
  ,::::::          ::::                        #######:                       ####             
 ,:::::::           `::                       ########:                       `;##             
 ::.   ::           `::                      .##,...##;                        ;##             
 ::    ::  :::::,   `::     ,:::,    :::::   .##    ##, ####.    .####     ;######    :::::::  
 :::.      :::::::  `::    :::::::  ::::::   .##       #####+,  :######   ########  ,::::,::::.
 `:::::`   ,   `::` `::   .::  `::` ::  ::  ########  ###  ,##  ##:  ### `##,  ;##   :`     `: 
  `::::::     .:::. `::   ::,   ::, :::.    ########  ##    ## ,##    ## +##   ;##     ,:::.   
     `:::.`,::::::. `::   ::::::::: .::::,  `:##....  ########,'######## ##+   ;##     :::::   
 :`    :::`::,` ::. `::   :::::::::   ,:::.  ,##     `########,+######## ##+   ;##             
:::    ::::::   ::. `::   ::,      .:   ,::  .##      ##`      ,##       '##   ;##      .#.    
:::` `:::`,::  `::.  ::` ..::.  `, ::   :::  .##      ###`  ,+  +##   ;:  ##;  ;##      '#'    
:::::::::  ::::::::: ::::: :::::::::::::::  ######     #######  `#######  ;######+       `     
 `:::::`    :::.::::  ::::  `::::, `:::::   ######      ;####.`   +####    `#####             


  (c)2010-2018 SalesFeed Nederland B.V.
  SalesFeed is een geregistreerde handelsnaam van SalesFeed Nederland B.V.

  zie: https://www.salesfeed.com/

*/

;(function(w,d,n,scr) {

    var $ = window._scoopi;

    $.init = function() {
      $.setupPolyfills();
      $.startTime = new Date();
      $.secure = document.location.protocol === "https:";
      $.v = 3;

      if ('function' == typeof $.onload) {
        try {
          $.onload($);
        } catch (ex) {
          console & console.log('SF: error in onload handler');
        }
      }

      
    };

    $.parseURL = function(href) {
      var parser = document.createElement('a');
      parser.href = href;
      var pairs = parser.search.replace(/^\?/, '').split('&');
      for (var querypairs = {}, i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        querypairs[pair[0]] = pair[1];
      }
      return {'href': href, 'protocol': parser.protocol, 'hostname': parser.hostname, 'port': parser.port, 'path': parser.pathname, 'query': parser.search, 'querypairs': querypairs, 'fragment': parser.hash, 'hash': parser.hash};
    };

    $.getCanonicalURL = function() {
      var linktags = document.getElementsByTagName('link');
      for (var i = 0; i < linktags.length; i++) {
        if (linktags[i].getAttribute('rel') === 'canonical') {
          return linktags[i].hasAttribute('href') ? linktags[i].href : null;
        }
      }
    };

    $.getMetatagContent = function(name) {
      var m = document.getElementsByTagName('meta');
      for (var i=0; i < m.length; i++) {
        if (m[i].name.toLowerCase() == name.toLowerCase()) {
          return m[i].content;
        }
      }
    };

    $.initFacts = function() {
      try {
        $.fact = {
          doc: {
            title: document.title.toLowerCase(),
            text: (document.body.innerText || document.body.textContent).toLowerCase(),
            html: document.documentElement.innerHTML.toLowerCase()
          },
          meta: {
            description: ($.getMetatagContent('description') || '').toLowerCase(),
            keywords: ($.getMetatagContent('keywords') || '').toLowerCase()
          },
          url: $.parseURL(window.location.href),
          canonicalurl: $.parseURL($.getCanonicalURL())
        };
      } catch(err) {
        console & console.log(err);
      }
    };

    $.getContentgroups = function() {
      var cg = [];
      $.initFacts();

      return cg;
    };

    $.guid = function() {
      return "................................".split('').map(function(){return 'abcdefghijklmnoqprstuvwxyz0123456789'.charAt(Math.floor(36*Math.random()));}).join('');
    };

    $.getSessionId = function(name) {
      var i = (document.cookie.match('(^|; )'+name+'=([^;]*)')||0)[2] || $.guid();
      document.cookie = name+'='+i+'; path=/; expires='+new Date(new Date().getTime() + 30*60*1000 ).toUTCString()+';';
      return i;
    };

    $.setUserId = function(id) {
      $.userid = id;
    };
    
    $.generateUID = function() {
      return Math.random().toString(36).substr(2,10);
    };

    $.trk = function(ent, ev, loc, ref, tit, dt) {
      var x = {entity: ent, event: ev, winloc: loc};
      if (ref !== null && ref !== undefined) { x.docref = ref; }
      if (tit !== null && tit !== undefined) { x.doctit = tit; }
      if (dt !== null && dt !== undefined) { x.data = dt; }
      $.send(x);
    };

    $.trkDocumentLoad = function() {
      if (/(crwebiossecurity|chromecheckurl|about:blank)/i.test(window.location)) return;

      try {
        var referrer = '' + window.top.document.referrer;
      } catch(e) {
        var referrer = '' + document.referrer;
      }
      
      try {
        var title = '' + window.top.document.title;
      } catch(e) {
        var title = '' + document.title;
      }        
      
      var d = {
        entity: 'document',
        event: 'load',
        winloc: window.location,
        docref: referrer.substring(0, 200),
        doctit: title.substring(0, 200)
      };
      if ($.getCanonicalURL()) d.cu = $.getCanonicalURL();
      var x = $.getNestedProperty(window, 'dataLayer.0.page.userID');
      if (x) d.xid = x;
      d.cgid = $.getContentgroups().join(',');
      $.send(d);
    };

    $.trkHeartbeat = function() {
      window.clearTimeout($.hbid);
      delete $.hbid;
      if ((new Date() - $.startTime) < 10*60*1000)
        $.send({entity: 'document', event: 'heartbeat', winloc: window.location});
    };
    
    $.encode = function(s) {
      return window.encodeURIComponent ? encodeURIComponent(s) : escape(s);
    };
    
    $.getRequestURL = function(dt) {
      var r = $.secure ? 'https://' : 'http://';
      r += 'api.salesfeed.com/v3/log.js?aid=ptchr16';
      r += '&cts=' + new Date().getTime().toString(36);
      r += '&sid=' + $.encode($.getSessionId('sfsid'));
      if (typeof $.userid != 'undefined') r += '&uid='+$.encode($.userid);
      dt.md = $.isMobile() ? 1 : 0;
      for(var n in dt) r += '&' + $.encode(n) + '=' + $.encode(dt[n]);
      return r;
    };
    
    $.delay = function(ms) {
      ms += new Date().getTime();
      while (new Date() < ms) {};
    };
    
    $.sendSynch = function(dt) {
      var req = window.XDomainRequest ? new window.XDomainRequest() : new XMLHttpRequest();
      req.open('GET', $.getRequestURL(dt), false);
      req.onreadystatechange = function() {  };
      req.send();
    }
    
    $.send = function(dt) {
      var s = document.createElement('script');
      s.type = 'application/javascript';
      s.async = true;
      s.src = $.getRequestURL(dt);
      var node = document.getElementsByTagName('script')[0];
      node.parentNode.insertBefore(s, node);
      node.parentNode.removeChild(node);
    };

    $.getCookie = function(key) {
      var tmp =  document.cookie.match((new RegExp(key +'=[a-zA-Z0-9.()=|%/_\-]+($|;)','g')));
      if(!tmp || !tmp[0]) {
        return null;
      } else return unescape(tmp[0].substring(key.length+1,tmp[0].length).replace(';','')) || null;
    };

    $.setCookie = function(key, value, ttl, path, domain, secure) {
      var cookie = [key+'='+ escape(value), 'path=' + ((!path || path=='')  ? '/' : path), 'domain='+  ((!domain || domain=='') ? window.location.host : domain)];
      cookie.push('expires='+$.hoursToExpireDate(ttl));
      if (secure) cookie.push('secure');
      document.cookie = cookie.join('; ');
      return value;
    };

    $.removeCookie = function(key, path, domain) {
      path = (!path || typeof path != 'string') ? '' : path;
      domain = (!domain || typeof domain != 'string') ? '' : domain;
      if ($.getCookie(key)) $.setCookie(key, '', 'Thu, 01-Jan-70 00:00:01 GMT', path, domain);
    };

    $.hoursToExpireDate = function(ttl) {
      if (parseInt(ttl) == 'NaN') {
        return '';
      } else {
        var now = new Date();
        now.setTime(now.getTime() + (parseInt(ttl) * 1000));
        return now.toGMTString();
      }
    };

    $.loadScript = function(url, callback) {
      if (!('string' === typeof url)) { return; }
      var s = document.createElement('script');
      s.type = 'application/javascript';
      if (typeof document.attachEvent === 'object') {
        s.onreadystatechange = function() {
          if ('function' === typeof callback && 'loaded' === s.readyState) {
            callback();
          }
        }
      } else {
        s.onload = function(){
          if ('function' === typeof callback) {
            callback();
          }
        }
      }
      s.src = url;
      s.async = false;
      s.defer = false;
      var head = document.getElementsByTagName('head')[0];
      head.insertBefore(s, head.lastChild);
    };

    $.loadCss = function(url, callback) {
      if (!('string' === typeof url)) { return; }
      var s = document.createElement('link');
      s.setAttribute('rel', 'stylesheet');
      s.setAttribute('type', 'text/css');
      if (typeof document.attachEvent === 'object') {
        s.onreadystatechange = function() {
          if ('function' === typeof callback && 'loaded' === s.readyState) {
            callback();
          }
        }
      } else {
        s.onload = function(){
          if ('function' === typeof callback) {
            callback();
          }
        }
      }
      s.setAttribute('href', url);
      var head = document.getElementsByTagName('head')[0];
      head.insertBefore(s, head.lastChild);
    };

    $.inArray = function(obj, item) {
      if (obj && obj.length) {
        for (var i = 0; i < obj.length; i++) {
          if (obj[i] === item) {
            return true;
          }
        }
      }
      return false;
    };

    $.getNestedProperty = function(obj, p) {
      var args = p.split('.');
      for (var i = 0; i < args.length; i++) {
        if (!obj || !obj.hasOwnProperty(args[i])) {
          return;
        }
        obj = obj[args[i]];
      }
      return obj;
    };

    $.addEventListener = function(obj, evt, ofnc, bubble) {
      var fnc = function(event) {
        if (!event || !event.target) {
          event = window.event;
          event.target = event.srcElement;
        }
        return ofnc.call(obj, event);
      };
      if (obj.addEventListener) {
        obj.addEventListener(evt, fnc, !!bubble);
        return true;
      } else if (obj.attachEvent) {
          return obj.attachEvent('on' + evt, fnc);
      } else {
        evt = 'on' + evt;
        if ('function' === typeof obj[evt]) {
          fnc = (function (f1, f2) {
            return function () {
              f1.apply(this, arguments);
              f2.apply(this, arguments);
            };
          }(obj[evt], fnc));
        }
        obj[evt] = fnc;
        return true;
      }
    };


    $.liveEvent = function(tag, evt, ofunc) {
      tag = tag.toUpperCase();
      tag = tag.split(',');
      $.addEventListener(document, evt, function(me) {
        var el = me.target;
        while (el && el.nodeName && el.nodeName.toUpperCase() !== 'HTML') {
          if ($.inArray(tag, el.nodeName)) {
            ofunc.call(el, me);
            break;
          }
          el = el.parentNode;
        }
      }, true);
    };


    $.setupOutboundLinkTracking = function() {
      $.setupOutboundLinkTracking = function() { return false; };
      $.liveEvent('a', 'mousedown', function(e) {
        if ((this.protocol === 'http:' || this.protocol === 'https:') && this.host !== window.location.host) {
          $.trk('document', 'load', this.href);
        }
      });
    };


    $.setupAjaxTracking = function() {
      XMLHttpRequest.prototype.___open = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url, async) {
        this.url = url;
        this.method = method;
        return this.___open.call(this, method, url, async);
      };

      XMLHttpRequest.prototype.___send = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function(data) {
        if(!/(crwebiossecurity|chromecheckurl)/i.test(this.url)) {
          $.trk('xmlhttprequest', this.method, this.url, window.location, '', data);
        }
        this.___send(data);
      };
    };
  
    $.ready = function() {
      if (/in/.test(document.readyState)) {
        setTimeout('_scoopi.ready()', 9);
      } else {
        if ('function' == typeof $.ondomready) {
          try {
            $.ondomready($);
          } catch (ex) {
            console.log('SF: error in domready handler');
          }
        }
      }
    };


    $.setupPolyfills = function() {
      if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position) {
          position = position || 0;
          return this.substr(position, searchString.length) === searchString;
        };
      }

      if (!String.prototype.endsWith) {
        String.prototype.endsWith = function(searchString, position) {
          var subjectString = this.toString();
          if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
          }
          position -= searchString.length;
          var lastIndex = subjectString.lastIndexOf(searchString, position);
          return lastIndex !== -1 && lastIndex === position;
        };
      }
    };

    $.isMobile = function() {
      if (/mobi|phone|ipad|ipod|android|blackberry|webos|nokia|opera mini|crios|fennec|minimo|bada/i.test(navigator.userAgent)) return true;
      return ('ontouchstart' in window) || navigator.msMaxTouchPoints;
    };


    $.init();
    
}(window, document, navigator, screen));


