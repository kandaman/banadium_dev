/**
 * パブリックグループに所属していないことを確認する.
 * 
 * @param pubGrpSetCd パブリックグループセットコード
 * @param pubGrpCd パブリックグループコード
 * @param user_cd ユーザコード
 * @return 引数のパブリックグループに所属している：false、所属していない：true
 */
function isNotPubGrpShozoku(pubGrpSetCd, pubGrpCd, user_cd) {
	var userContext = Contexts.getUserContext();
	var immPublicGrpMnager = new IMMPublicGroupManager(userContext.userProfile.userCd, 'ja');
	var bizKey = {publicGroupSetCd : pubGrpSetCd, publicGroupCd : pubGrpCd};
	var condition = new AppCmnSearchCondition();
	condition.setLogicalOperetor(AppCmnSearchCondition.AND);
	condition.addCondition("user_cd", user_cd);
	condition.addCondition("delete_flag", "0");
	var result = immPublicGrpMnager.searchUserWithPublicGroup(bizKey, condition, new Date(), "ja", 1, 0, false);
	if (result.error) {
		return false;
	}
	
	if (result.data.length > 0) {
		return false;
	}
	
	return true;
}

/**
 * パブリックグループに所属していることを確認する.
 * 
 * @param pubGrpSetCd パブリックグループセットコード
 * @param pubGrpCd パブリックグループコード
 * @param user_cd ユーザコード
 * @return 引数のパブリックグループに所属している：true、所属していない：false
 */
function isPubGrpShozoku(pubGrpSetCd, pubGrpCd, user_cd) {
	var userContext = Contexts.getUserContext();
	var immPublicGrpMnager = new IMMPublicGroupManager(userContext.userProfile.userCd, 'ja');
	var bizKey = {publicGroupSetCd : pubGrpSetCd, publicGroupCd : pubGrpCd};
	var condition = new AppCmnSearchCondition();
	condition.setLogicalOperetor(AppCmnSearchCondition.AND);
	condition.addCondition("user_cd", user_cd);
	condition.addCondition("delete_flag", "0");
	var result = immPublicGrpMnager.searchUserWithPublicGroup(bizKey, condition, new Date(), "ja", 1, 0, false);
	if (result.error) {
		return false;
	}
	
	if (result.data.length > 0) {
		return true;
	}
	
	return false;
}

/**
 * パブリックグループ以下に所属していることを確認する.
 * 
 * @param pubGrpSetCd パブリックグループセットコード
 * @param pubGrpCd パブリックグループコード
 * @param user_cd ユーザコード
 * @return 引数のパブリックグループに所属している：true、所属していない：false
 */
function isPubGrpUnderShozoku(pubGrpSetCd, pubGrpCd, user_cd) {
	var userContext = Contexts.getUserContext();
	var immPublicGrpMnager = new IMMPublicGroupManager(userContext.userProfile.userCd, 'ja');
	var bizKey = {publicGroupSetCd : pubGrpSetCd, publicGroupCd : pubGrpCd};
	var condition = new AppCmnSearchCondition();
	condition.setLogicalOperetor(AppCmnSearchCondition.AND);
	condition.addCondition("user_cd", user_cd);
	condition.addCondition("delete_flag", "0");
	var result = immPublicGrpMnager.searchUserWithPublicGroupTree(bizKey, condition, new Date(), "ja", 1, 0, false);
	if (result.error) {
		return false;
	}
	
	if (result.data.length > 0) {
		return true;
	}
	
	return false;
}


