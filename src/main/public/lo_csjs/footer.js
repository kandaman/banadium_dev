$(window).on('load', function() {
	$("footer:last-child").html(
		'<div class="bne-copyright row mb-5">'+
			'<div class="col-auto bg-left flex-grow-1"></div>'+
			'<div class="col-auto bne-copyright-text">&copy;2020 BANDAI NAMCO Entertainment Inc.</div>'+
			'<div class="col-auto bg-right flex-grow-1"></div>'+
		'</div>'+
		'<div class="bne-information row no-gutters">'+
			'<div class="col-auto ml-auto"><img src="lo_csjs/images/bne-logo.png" alt="BANDAI NAMCO Entertainment"></div>'+
			'<div class="col-auto mr-auto row mt-3">'+
				'<div class="col-6"><a href="https://bandainamcoent.co.jp/info/privacy/">プライバシーポリシー</a></div>'+
				'<div class="col-6"><a href="mailto:banadium-support@bandainamcoent.co.jp">お問い合わせ</a></div>'+
			'</div>'+
		'</div>'+
		'<div class="bne-color-band row"></div>'+
		'<div class="intra-mart row">'+
			'<div class="footer-text col-auto mr-auto text-left">Copyright &copy; 2010 NTT DATA INTRAMART CORPORATION</div>'+
			'<div class="footer-text col-auto text-right pr-0">Powered by</div>'+
			'<div class="col-auto pl-1"><img src="lo_csjs/images/footer-logo-im.png" alt="intra-martロゴ" /></div>'+
		'</div>'
	);
});
