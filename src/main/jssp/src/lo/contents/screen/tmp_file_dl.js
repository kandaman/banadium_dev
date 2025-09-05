function init(request) {
	// TODO:ライセンシーごとに参照するディレクトリを変更し、他のライセンシーから参照できないようにする。
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	if ("filePath" in request) {
		var filePath = request.filePath;
		if (filePath.length > 0) {
			var pubStrage = Constant.LO_PATH_PUBLIC_TEMPLATE + filePath;
			var storage = new PublicStorage(pubStrage);
			var fileName = request.fileName ? request.fileName : storage.getName();
			if(storage.isFile()) {
				// ファイルをクライアントへ送信します。
				Module.download.send(storage, fileName);
			}
		}
	}
	
}