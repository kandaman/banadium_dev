package lo.plugin.login;

import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import jp.co.intra_mart.foundation.context.Contexts;
import jp.co.intra_mart.foundation.page.PageUrl;
import jp.co.intra_mart.foundation.security.certification.model.LoginInfo;
import jp.co.intra_mart.foundation.security.certification.provider.TargetPageProvider;
import jp.co.intra_mart.foundation.user_context.model.PublicGroup;
import jp.co.intra_mart.foundation.user_context.model.UserContext;
/**
 * ログイン画面からログインする場合に遷移するページを設定するクラス.
 *
 */
public class LoginPageAfterTagetPageSetting implements TargetPageProvider {

    /** パブリックグループセットコード */
    private static final String LO_GROUP_SET_CD = "license_out";
	/** パブリックグループコード：ライセンシー. */
    private static final String LO_GROUP_CD_LICENSEE = "lo_licensee_group";
    /** パブリックグループコード：ライセンスプロダクション. */
    private static final String LO_GROUP_CD_PRODUCTION = "lo_production_group";
    /** パブリックグループコード：法務. */
    private static final String LO_GROUP_CD_HOMU = "lo_homu_group";
    /** パブリックグループコード：商標. */
    private static final String LO_GROUP_CD_SHOHYO = "lo_trademark_group";
    /** パブリックグループコード：情報システム. */
    private static final String LO_GROUP_CD_JOSYS = "lo_johosystem_group";
    /** パブリックグループコード：契約. */
    private static final String LO_GROUP_CD_CONTRACT = "lo_contract_group";
    /** パブリックグループコード：BNE担当. */
    private static final String LO_GROUP_APPR_0 = "lo_approva_group_0";
    /** パブリックグループコード：承認1. */
    private static final String LO_GROUP_APPR_1 = "lo_approva_group_1";
    /** パブリックグループコード：承認2. */
    private static final String LO_GROUP_APPR_2 = "lo_approva_group_2";
    /** パブリックグループコード：承認3. */
    private static final String LO_GROUP_APPR_3 = "lo_approva_group_3";
    /** パブリックグループコード：最終. */
    private static final String LO_GROUP_APPR_LAST = "lo_bnetantou_group";

    /** 遷移先：企画一覧. */
    private static final String TARGET_PAGE_KIKAKU_LIST = "/lo/contents/screen/kikaku/planning_list_new";
    /** 遷移先：契約ドラフト一覧. */
    private static final String TARGET_PAGE_KEIYAKU_DORAFUTO_LIST = "/lo/contents/screen/keiyaku_dorafuto/keiyaku_dorafuto_list";
    /** 遷移先：企画一覧. */
    private static final String TARGET_PAGE_MY_PROCESS_LIST = "/lo/contents/screen/user/myProcess_list";
    /** ホーム画面. */
    private static final String TARGET_PAGE_HOME = "/home";

    /**
     * ログイン画面からログインする場合に遷移するページを設定する.
     */
    @Override
    public PageUrl getTargetPage(LoginInfo loginInfo, HttpServletRequest request, HttpServletResponse response) {
        // ユーザ情報の取得
        UserContext userContext = Contexts.get(UserContext.class);
        List<PublicGroup> pubGrpList = userContext.getPublicGroupList();
        String usercd = userContext.getUserProfile().getUserCd();
        
        if (usercd.equals("tenant")){
            // ホーム画面
            return new PageUrl(TARGET_PAGE_HOME);
        }

        
        // パブリックグループによって遷移先を変える
        for(PublicGroup pubGrp : pubGrpList){
            if (LO_GROUP_CD_HOMU.equals(pubGrp.getPublicGroupCd())) {
                // 法務グループ
                return new PageUrl(TARGET_PAGE_KEIYAKU_DORAFUTO_LIST);
            } else if (LO_GROUP_CD_LICENSEE.equals(pubGrp.getPublicGroupCd())) {
                // ライセンシーグループ
                return new PageUrl(TARGET_PAGE_MY_PROCESS_LIST);
            } else if (LO_GROUP_CD_PRODUCTION.equals(pubGrp.getPublicGroupCd())) {
                // ライセンスプロダクショングループ
                return new PageUrl(TARGET_PAGE_MY_PROCESS_LIST);
            } else if (LO_GROUP_CD_SHOHYO.equals(pubGrp.getPublicGroupCd())) {
                // 商標
                return new PageUrl(TARGET_PAGE_MY_PROCESS_LIST);
            } else if (LO_GROUP_CD_JOSYS.equals(pubGrp.getPublicGroupCd())) {
                // 情シス
                return new PageUrl(TARGET_PAGE_MY_PROCESS_LIST);
            } else if (LO_GROUP_CD_CONTRACT.equals(pubGrp.getPublicGroupCd())) {
                // 契約
                return new PageUrl(TARGET_PAGE_MY_PROCESS_LIST);
            } else if (LO_GROUP_APPR_0.equals(pubGrp.getPublicGroupCd())) {
                // BNE担当
                return new PageUrl(TARGET_PAGE_MY_PROCESS_LIST);
            } else if (LO_GROUP_APPR_1.equals(pubGrp.getPublicGroupCd())) {
                // 承認1
                return new PageUrl(TARGET_PAGE_MY_PROCESS_LIST);
            } else if (LO_GROUP_APPR_2.equals(pubGrp.getPublicGroupCd())) {
                // 承認2
                return new PageUrl(TARGET_PAGE_MY_PROCESS_LIST);
            } else if (LO_GROUP_APPR_3.equals(pubGrp.getPublicGroupCd())) {
                // 承認3
                return new PageUrl(TARGET_PAGE_MY_PROCESS_LIST);
            } else if (LO_GROUP_APPR_LAST.equals(pubGrp.getPublicGroupCd())) {
                // 最終
                return new PageUrl(TARGET_PAGE_MY_PROCESS_LIST);
            } else if (LO_GROUP_SET_CD.equals(pubGrp.getPublicGroupSetCd())) {
            	// 上記に属さないがライセンスアウトのグループである場合
                return new PageUrl(TARGET_PAGE_MY_PROCESS_LIST);
            }
        }

        // ログイン者のパブリックグループが、上記のパブリックグループのコードに一致しない場合は、その他の設定に依存させる
        return null;
    }

}
