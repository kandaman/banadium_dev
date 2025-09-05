/**
 * 販売地域選択による項目活性・非活性
 */
/*
function ChangeSelect(objNo) {

	var change_str = document.getElementById("country" + objNo).value;
	// var money = document.getElementById("money" + objNo);

	if (change_str == "1") {
		// money.innerHTML = "<div value='jpy'>日本円（JPY）</div>";
		document.getElementById("sale-date" + objNo).disabled = false;
		document.getElementById("joudai" + objNo).disabled = true;
		document.getElementById("loy-per" + objNo).disabled = true;
		document.getElementById("loy-pri" + objNo).disabled = true;
		document.getElementById("kami" + objNo).disabled = true;
	} else if (change_str == "2") {
		// money.innerHTML = "<div value='usd' >米ドル（USD）</div>"
		document.getElementById("sale-date" + objNo).disabled = true;
		document.getElementById("joudai" + objNo).disabled = false;
		document.getElementById("loy-per" + objNo).disabled = false;
		document.getElementById("loy-pri" + objNo).disabled = false;
		document.getElementById("kami" + objNo).disabled = false;
	} else if (change_str == "3") {
		// money.innerHTML = "<div value='eur' >ユーロ（EUR）</div>"
		document.getElementById("sale-date" + objNo).disabled = true;
		document.getElementById("joudai" + objNo).disabled = false;
		document.getElementById("loy-per" + objNo).disabled = false;
		document.getElementById("loy-pri" + objNo).disabled = false;
		document.getElementById("kami" + objNo).disabled = false;
	} else if (change_str == "4") {
		// money.innerHTML = "<div value='hkd' >香港ドル（HKD）</div>"
		document.getElementById("sale-date" + objNo).disabled = true;
		document.getElementById("joudai" + objNo).disabled = false;
		document.getElementById("loy-per" + objNo).disabled = false;
		document.getElementById("loy-pri" + objNo).disabled = false;
		document.getElementById("kami" + objNo).disabled = false;
	} else if (change_str == "5") {
		// money.innerHTML = "<div value='twd' >台湾ドル（TWD）</div>"
		document.getElementById("sale-date" + objNo).disabled = true;
		document.getElementById("joudai" + objNo).disabled = false;
		document.getElementById("loy-per" + objNo).disabled = false;
		document.getElementById("loy-pri" + objNo).disabled = false;
		document.getElementById("kami" + objNo).disabled = false;
	} else if (change_str == "6") {
		// money.innerHTML = "<div value='krw' >ウォン（KRW）</div>"
		document.getElementById("sale-date" + objNo).disabled = true;
		document.getElementById("joudai" + objNo).disabled = false;
		document.getElementById("loy-per" + objNo).disabled = false;
		document.getElementById("loy-pri" + objNo).disabled = false;
		document.getElementById("kami" + objNo).disabled = false;
	} else if (change_str == "7") {
		// money.innerHTML = "<div value='sgd'>シンガポールドル（SGD）</div>"
		document.getElementById("sale-date" + objNo).disabled = true;
		document.getElementById("joudai" + objNo).disabled = false;
		document.getElementById("loy-per" + objNo).disabled = false;
		document.getElementById("loy-pri" + objNo).disabled = false;
		document.getElementById("kami" + objNo).disabled = false;
	} else if (change_str == "8") {
		// money.innerHTML = "<div value='other'><input
		// type='text'class='form-control'></div>"
		document.getElementById("sale-date" + objNo).disabled = true;
		document.getElementById("joudai" + objNo).disabled = false;
		document.getElementById("loy-per" + objNo).disabled = false;
		document.getElementById("loy-pri" + objNo).disabled = false;
		document.getElementById("kami" + objNo).disabled = false;
	}
	
	// 通貨設定
	document.getElementById("money" + objNo).value = change_str;
	ChangeMoney(objNo);
	
	//価格設定
	if(change_str == "1"){
        document.getElementById("price_label" + objNo).style.display="block";
        document.getElementById("price_select" + objNo).style.display="none";
    }else {
        document.getElementById("price_select" + objNo).style.display="block";
        document.getElementById("price_label" + objNo).style.display="none";
    }
    
	coln.find('#otherPlatform').attr('id', 'otherPlatform' + rowNo);
	
}


//通貨変更時
function ChangeMoney(objNo) {
	//その他ならテキストボックス表示
	if (document.getElementById("money" + objNo).value == "8"){
        document.getElementById("otherMoney" + objNo).style.display="block";
	}else{
        document.getElementById("otherMoney" + objNo).style.display="none";
	}
}

//プラットフォーム変更時
function ChangePlatform(objNo) {
	//その他ならテキストボックス表示
	if (document.getElementById("platform" + objNo).value == "その他"){
       document.getElementById("otherPlatform" + objNo).style.display="block";
	}else{
        document.getElementById("otherPlatform" + objNo).style.display="none";
	}
}

//ダウンロード価格
function dlflgY(objNo) {
	//表示
    document.getElementById("dlPrice" + objNo).style.display="block";
}
function dlflgN(objNo) {
	//非表示
    document.getElementById("dlPrice" + objNo).style.display="none";
}
// dl申請
function ChangeSelect3(objNo) {
	document.getElementById("dl_money" + objNo).value = document.getElementById("dl_country" + objNo).value;
}
*/
