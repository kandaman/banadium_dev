Constant.load("lo/common_libs/lo_const");
var $userInfo = {
	userCd : ""
    , userName : ""
    , licenseeFlg : "0" // ライセンシーフラグ
    , bneFlg : "0" // BNEフラグ
	, licenseProductionFlg : "0" //ライセンスプロダクションフラグ
    , contractFlg : "0" // 契約担当フラグ
    , accountFlg : "0" // 計上担当フラグ
	, userCompanyDepartment : {
		companyCd : ""
		, companyName : ""
		, companyShortName : ""
		, departmentCd : ""
		, departmentName : ""
		, departmentFullName : ""
	}
};

var	$matter_items = [
    {item_cd : "licensee_user", item_nm : "ライセンシー担当者", checked : false}
    , {item_cd : "licensee_company", item_nm : "ライセンシー（会社）", checked : false}
    , {item_cd : "ip_in_charge_user", item_nm : "IP担当者", checked : false}
    , {item_cd : "ip_in_charge_group", item_nm : "IP担当グループ", checked : false}
    , {item_cd : "primary_approver", item_nm : "一次承認者", checked : false}
    , {item_cd : "secondary_approver", item_nm : "二次承認者", checked : false}
];

var $company_list = "[]";

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	loadUserInfo();

	var result = $userInfo = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveLicenseeCompanyList");
	if (result.countRow > 0) {
		$company_list = ImJson.toJSONString(result.data, false);
	}

}

/**
 * ユーザー情報読み込み処理
 * 
 */
function loadUserInfo() {

	$userInfo = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "getUserInfo"); 
	
}

function retrieveUserList(request) {
	if ('kaisha_id' in request) {
		return Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveUserList", request.kaisha_id);
	}
}

function retrievePresetList(request) {
	return Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveCommentDestinationPresetList", true);
}

function retrievePreset(request) {
	Logger.getLogger().info(' [retrievePreset]　request ' + ImJson.toJSONString(request, true));
	var preset = {
	    preset_id : ""
	    , preset_nm : ""
	    , koushin_bi : ""
		, dest_to : {
			matter_items : []
			, public_group_items : []
			, user_items : []
		}
		, dest_cc : {
			matter_items : []
			, public_group_items : []
			, user_items : []
		}
		, licensee_items : []
	};

	if ('preset_id' in request) {
		var result = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveCommentDestinationPreset", request.preset_id);
		if (result.countRow == 0) {
			return {preset : preset};
		}
		var data = result.data[0];
		preset.preset_id = data.preset_id;
		preset.preset_nm = data.preset_nm;
		preset.koushin_bi = data.koushin_bi;

		result = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveCommentDestinationPresetTarget", request.preset_id);
		if (result.countRow == 0) {
			return {preset : preset};
		}
		for (var key in result.data) {
			var target = result.data[key];
			if (target.target_type == Constant.LO_PRESET_TARGET_TYPE_MATTER) {
				var item = {
					itemCd : target.matter_attr_cd
				};
				
				var matchMatterItems = $matter_items.filter(function(element, index, array){
					return element.item_cd == item.itemCd;
				});
				if (matchMatterItems.length > 0) {
					item.itemNm = matchMatterItems[0].item_nm;
				} else {
					item.itemNm = item.itemCd;
				}

				if (target.recipient_type == Constant.LO_RECIPIENT_TYPE_TO) {
					preset.dest_to.matter_items.push(item);
				} else if (target.recipient_type == Constant.LO_RECIPIENT_TYPE_CC) {
					preset.dest_cc.matter_items.push(item);
				}
			}
			if (target.target_type == Constant.LO_PRESET_TARGET_TYPE_PUBLIC_GROUP) {
				var item = {
					itemCd : target.public_group_cd
					, itemNm : target.public_group_name
				};
				if (target.recipient_type == Constant.LO_RECIPIENT_TYPE_TO) {
					preset.dest_to.public_group_items.push(item);
				} else if (target.recipient_type == Constant.LO_RECIPIENT_TYPE_CC) {
					preset.dest_cc.public_group_items.push(item);
				}
			}
			if (target.target_type == Constant.LO_PRESET_TARGET_TYPE_USER) {
				var item = {
					itemCd : target.user_cd
					, itemNm : target.user_name
				};
				if (target.recipient_type == Constant.LO_RECIPIENT_TYPE_TO) {
					preset.dest_to.user_items.push(item);
				} else if (target.recipient_type == Constant.LO_RECIPIENT_TYPE_CC) {
					preset.dest_cc.user_items.push(item);
				}
			}
			if (target.target_type == Constant.LO_PRESET_TARGET_TYPE_LICENSEE) {
				preset.licensee_items.push(target);
			}
		}
		
	}
	return {preset : preset};
}
function deletePreset(request) {
	var functionResult = {
	    error: false,
	    preset_id: "",
		message: MessageManager.getMessage('KE03I002')
	};
	var presetId;
	// DB接続
	var db = new TenantDatabase();
	Transaction.begin(function() {
		if ('preset' in request) {
			var preset = request.preset;
			presetId = preset.preset_id;
			Logger.getLogger().info(' [deletePreset]　presetId ' + presetId);
			if (presetId) {
				db.remove("lo_m_comment_destination_preset_target", "preset_id = ?", [DbParameter.string(presetId)]);
				db.remove("lo_m_comment_destination_preset", "preset_id = ?", [DbParameter.string(presetId)]);
				functionResult.preset_id = presetId;
			}
		}
	});
	return functionResult;
}


function updatePreset(request) {

	Logger.getLogger().info(' [updatePreset]　request ' + ImJson.toJSONString(request, true));

	loadUserInfo();

	var functionResult = {
	    error: false,
	    preset_id: "",
		message: MessageManager.getMessage('KE03I012')
	};
	var presetId;
	// DB接続
	var db = new TenantDatabase();
	Transaction.begin(function() {
		if ('preset' in request) {
			var preset = request.preset;
			var upObject = {
				preset_nm : preset.preset_nm
				, owner_id : $userInfo.userCd
			};
			presetId = preset.preset_id;
			Logger.getLogger().info(' [updatePreset]　presetId ' + presetId);
			if (!presetId) {

				// 登録
				Logger.getLogger().info(' [updatePreset]　!presetId ');
				presetId = "PRESET-" + Identifier.get();
				upObject.preset_id = presetId;
				upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
				Logger.getLogger().info(' [updatePreset]　insertCommentDestinationPresetData ' + ImJson.toJSONString(upObject, true));
				db.insert('lo_m_comment_destination_preset', upObject);
				functionResult.preset_id = presetId;

			} else {

				// 更新
				upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
				functionResult.preset_id = presetId;
				Logger.getLogger().info(' [updatePreset]　updateCommentDestinationPresetData ' + ImJson.toJSONString(upObject, true));
				Logger.getLogger().info(' [updatePreset]　updateCommentDestinationPresetData key ' + presetId + ', ' + preset.koushin_bi);
	         	var result = db.update('lo_m_comment_destination_preset', upObject, "preset_id = ? AND to_char(koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') = ?",[DbParameter.string(presetId), DbParameter.string(preset.koushin_bi)]);
				if (result.countRow == 0) {
					// 排他エラー処理
					Logger.getLogger().error(' [updateKeiyakuNaiyo] 排他エラー　updateCommentDestinationPresetData key ' + presetId + ', ' + preset.koushin_bi);
					Transaction.rollback();
					functionResult.error = true;
					functionResult.message = MessageManager.getMessage('ER01E004');
					return functionResult;
				}

			}
			
			db.remove("lo_m_comment_destination_preset_target", "preset_id = ?", [DbParameter.string(presetId)]);
			var presetItemNo = 0;
			var updateMatter = function(recipientType, items) {
				for (var key in items) {
					var item = items[key];
					var upObject = {
						preset_id : presetId
						, preset_item_no : ++presetItemNo
						, recipient_type : recipientType
						, target_type : Constant.LO_PRESET_TARGET_TYPE_MATTER
						, matter_attr_cd : item.item_cd
					};
					upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
					Logger.getLogger().info(' [updatePreset]　insertCommentDestinationPresetTargetData ' + ImJson.toJSONString(upObject, true));
					db.insert('lo_m_comment_destination_preset_target', upObject);
				}
			};
			var updatePublicGroup = function(recipientType, items) {
				for (var key in items) {
					var item = items[key];
					var upObject = {
						preset_id : presetId
						, preset_item_no : ++presetItemNo
						, recipient_type : recipientType
						, target_type : Constant.LO_PRESET_TARGET_TYPE_PUBLIC_GROUP
						, public_group_set_cd : Constant.LO_GROUP_SET_CD
						, public_group_cd : item.item_cd
					};
					upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
					Logger.getLogger().info(' [updatePreset]　insertCommentDestinationPresetTargetData ' + ImJson.toJSONString(upObject, true));
					db.insert('lo_m_comment_destination_preset_target', upObject);
				}
			};
			var updateUser = function(recipientType, items) {
				for (var key in items) {
					var item = items[key];
					var upObject = {
						preset_id : presetId
						, preset_item_no : ++presetItemNo
						, recipient_type : recipientType
						, target_type : Constant.LO_PRESET_TARGET_TYPE_USER
						, user_cd : item.item_cd
					};
					upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
					Logger.getLogger().info(' [updatePreset]　insertCommentDestinationPresetTargetData ' + ImJson.toJSONString(upObject, true));
					db.insert('lo_m_comment_destination_preset_target', upObject);
				}
			};
			
			var destMap = {"dest_to" : Constant.LO_RECIPIENT_TYPE_TO
			                , "dest_cc" : Constant.LO_RECIPIENT_TYPE_CC};
			for (var destKey in destMap) {
				if (destKey in preset) {
					var recipientType = destMap[destKey];
					var dest = preset[destKey];
					if ('matter_items' in dest) {
						updateMatter(recipientType, dest.matter_items);
					}
					if ('public_group_items' in dest) {
						updatePublicGroup(recipientType, dest.public_group_items);
					}
					if ('user_items' in dest) {
						updateUser(recipientType, dest.user_items);
					}
				}
			}

			if ("licensee_items" in preset) {
				var items = preset.licensee_items;
				for (var key in items) {
					var item = items[key];
					var upObject = {
						preset_id : presetId
						, preset_item_no : ++presetItemNo
						, recipient_type : item.recipient_type
						, target_type : Constant.LO_PRESET_TARGET_TYPE_LICENSEE
						, company_cd : item.company_cd
						, user_cd : item.user_cd
					};
					upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
					Logger.getLogger().info(' [updatePreset]　insertCommentDestinationPresetTargetData ' + ImJson.toJSONString(upObject, true));
					db.insert('lo_m_comment_destination_preset_target', upObject);
				}
			}
			
		}
	});
	
	return functionResult;
}

