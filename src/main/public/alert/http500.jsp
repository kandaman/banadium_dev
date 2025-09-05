<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isErrorPage="true" %>
<%@page import="jp.co.intra_mart.common.aid.jdk.java.lang.StringEscapeUtil"%>
<%@page import="jp.co.intra_mart.common.platform.log.Logger"%>
<%@page import="jp.co.intra_mart.foundation.Env"%>
<%@page import="jp.co.intra_mart.foundation.security.message.MessageManager"%>
<%@page import="jp.co.intra_mart.system.platform.ServerContext"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="imtag" uri="http://www.intra-mart.co.jp/taglib/core/standard" %>
<%
// Status Code
response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);

// Gather Exception Information
Logger logger = Logger.getLogger("error-page.http-500");
String stackTrace = "";
String key = request.getParameter("key");
if (exception == null) {
    logger.error(MessageManager.getInstance().getMessage("CAP.Z.IWP.UI.ALERT.HTTP.500.NO.THROWABLE"));
}
boolean include = false;
String location = "alert/http500.jsp";
String message = MessageManager.getInstance().getMessage("CAP.Z.IWP.UI.ALERT.HTTP.500.ERROR.MESSAGE");
%>
<%@ include file="common/include.jspf" %>
<%
// response html
if(!include){
    String baseUrl = ServerContext.getInstance().getBaseURL(request) + "/";
    String title = MessageManager.getInstance().getMessage("CAP.Z.IWP.UI.ALERT.HTTP.500.ERROR.TITLE");
    String detail = MessageManager.getInstance().getMessage("CAP.Z.IWP.UI.ALERT.HTTP.500.ERROR.DETAIL");
%>
<%
java.util.Date dNow = new java.util.Date();
java.text.SimpleDateFormat ft = new java.text.SimpleDateFormat ("yyyy-MM-dd HH:mm:ss");
%>
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, maximum-scale=1.0, minimum-scale=1.0" />
        <meta http-equiv="Content-Style-Type" content="text/css">
        <meta name="author" content="NTT DATA INTRAMART CORPORATION">
        <meta name="description" content="">
        <meta name="keywords" content="">
        <base href="<%= baseUrl %>" target="_self">

        <title><%= StringEscapeUtil.escapeXmlWithoutApos(title).replaceAll("\\n", "<br/>") %></title>

        <link type="text/css" href="ui/css/error.css" rel="stylesheet"/>
        <script type="text/javascript">
            function onLoadBody() {
            	document.getElementById('crnt_url').innerHTML = location.href;
                try {
                    var parentUrl = parent.location.href;
                    if(parentUrl != location.href) {
                        document.getElementById('imui-footer').style.display = 'none';
                    }
                } catch (e) {}
            }
            function show() {
                document.getElementById('show_trace').style.display = 'none';
                document.getElementById('hide_trace').style.display = '';
                document.getElementById('trace').style.display = '';
            }
            function hide() {
                document.getElementById('show_trace').style.display = '';
                document.getElementById('hide_trace').style.display = 'none';
                document.getElementById('trace').style.display = 'none';
            }
        </script>
    </head>
    <body onload="onLoadBody();">
        <div id="imui-container">
            <div id="imui-container-inner">
                <div class="imui-box-error">
                    <div class="imui-box-error-inner">
                        <dl>
                            <dt><%= StringEscapeUtil.escapeXmlWithoutApos(message).replaceAll("\\n", "<br/>") %></dt>
                            <dd>
                            <%= StringEscapeUtil.escapeXmlWithoutApos(detail).replaceAll("\\n", "<br/>") %>
                            <br/>・ログインユーザ：<imtag:loginUser style="name"/>(<imtag:loginUser style="code"/>)
                            <br/>・日時：<%= ft.format(dNow) %>
                            <br/>・URL：<span id="crnt_url"></span>
                            <br/>
                            
<%
if(!stackTrace.isEmpty()) {
%>
                            <br/>
                            <a id="show_trace" href="javascript:show();">[show]</a>
                            <a id="hide_trace" href="javascript:hide();" style="display:none">[hide]</a>
                            <br/>
                            <div id="trace" style="display:none">
                                <pre><%= stackTrace %></pre>
                            </div>
<%
}
%>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            <input type="hidden" id="im_error_url" name="location" value="<%= location %>" />
            <input type="hidden" id="im_error_key" name="key" value="<c:out value="${param.key}" />" />
        </div>

        <div id="imui-footer">
            <div class="imui-footer-inner">
                <p class="imui-copy">Copyright &#169; 2012 NTT DATA INTRAMART CORPORATION</p>
                <ul class="imui-footer-utility">
                  <li><img src="ui/images/poweredbyim.png"/></li>
                </ul>
            </div>
        </div>
    </body>
</html>
<%
}
%>
