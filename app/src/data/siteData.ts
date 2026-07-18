/**
 * 現行サイト（https://www.city.saitama.lg.jp/）への実リンク集。
 *
 * verified: true  — WebSearch の検索結果（実在ページのインデックス）で確認済み
 * verified: false — パス規則からの推定。capture スクリプト実行後に要検証
 *   （docs/missing-info.md 参照）
 */
export interface SiteLink {
  id: string;
  title: string;
  titleEn: string;
  url: string;
  description?: string;
  verified: boolean;
}

export const CITY_ORIGIN = "https://www.city.saitama.lg.jp";

/** グローバルナビ / カテゴリグリッド（固定値: F06 / F08） */
export const categories: SiteLink[] = [
  {
    id: "kurashi",
    title: "暮らし・手続き",
    titleEn: "Daily Life & Procedures",
    url: `${CITY_ORIGIN}/001/index.html`,
    description: "住民票・戸籍・税・ごみなど",
    verified: true,
  },
  {
    id: "kenko",
    title: "健康・福祉",
    titleEn: "Health & Welfare",
    url: `${CITY_ORIGIN}/002/index.html`,
    description: "健診・予防接種・福祉サービス",
    verified: true,
  },
  {
    id: "kosodate",
    title: "子育て・教育",
    titleEn: "Child Rearing & Education",
    url: `${CITY_ORIGIN}/003/index.html`,
    description: "保育園・学校・子育て支援",
    verified: true,
  },
  {
    id: "kanko",
    title: "観光・文化・スポーツ",
    titleEn: "Tourism, Culture & Sports",
    url: `${CITY_ORIGIN}/004/index.html`,
    description: "イベント・施設・文化財",
    verified: false,
  },
  {
    id: "jigyosha",
    title: "事業者向け",
    titleEn: "For Businesses",
    url: `${CITY_ORIGIN}/005/index.html`,
    description: "入札・産業支援・募集",
    verified: true,
  },
  {
    id: "shisei",
    title: "市政情報",
    titleEn: "Municipal Information",
    url: `${CITY_ORIGIN}/006/index.html`,
    description: "市の計画・組織・広報",
    verified: true,
  },
];

/** 10区の区役所ページ（固定値: F09） */
export const wards: SiteLink[] = [
  { id: "nishi", title: "西区", titleEn: "Nishi Ward", url: `${CITY_ORIGIN}/nishi/index.html`, verified: true },
  { id: "kita", title: "北区", titleEn: "Kita Ward", url: `${CITY_ORIGIN}/kita/index.html`, verified: true },
  { id: "omiya", title: "大宮区", titleEn: "Omiya Ward", url: `${CITY_ORIGIN}/omiya/index.html`, verified: true },
  { id: "minuma", title: "見沼区", titleEn: "Minuma Ward", url: `${CITY_ORIGIN}/minuma/index.html`, verified: true },
  { id: "chuo", title: "中央区", titleEn: "Chuo Ward", url: `${CITY_ORIGIN}/chuo/index.html`, verified: true },
  { id: "sakura", title: "桜区", titleEn: "Sakura Ward", url: `${CITY_ORIGIN}/sakura/index.html`, verified: true },
  { id: "urawa", title: "浦和区", titleEn: "Urawa Ward", url: `${CITY_ORIGIN}/urawa/index.html`, verified: true },
  { id: "minami", title: "南区", titleEn: "Minami Ward", url: `${CITY_ORIGIN}/minami/index.html`, verified: true },
  { id: "midori", title: "緑区", titleEn: "Midori Ward", url: `${CITY_ORIGIN}/midori/index.html`, verified: true },
  { id: "iwatsuki", title: "岩槻区", titleEn: "Iwatsuki Ward", url: `${CITY_ORIGIN}/iwatsuki/index.html`, verified: true },
];

/** よく利用されるメニュー（固定値: F10） */
export const popularMenus: SiteLink[] = [
  {
    id: "juminhyo",
    title: "住民票・戸籍",
    titleEn: "Resident Records",
    url: `${CITY_ORIGIN}/001/915/002/001/index.html`,
    verified: true,
  },
  {
    id: "news",
    title: "新着情報一覧",
    titleEn: "News List",
    url: `${CITY_ORIGIN}/news.html`,
    verified: true,
  },
  {
    id: "kosodate-enjo",
    title: "子育てに関する援助",
    titleEn: "Child-rearing Support",
    url: `${CITY_ORIGIN}/003/001/011/index.html`,
    verified: true,
  },
  {
    id: "soshiki",
    title: "市の組織・各課",
    titleEn: "City Organization",
    url: `${CITY_ORIGIN}/006/015/index.html`,
    verified: true,
  },
  {
    id: "kuyakusho",
    title: "市役所・区役所・支所",
    titleEn: "City & Ward Offices",
    url: `${CITY_ORIGIN}/008/001/index.html`,
    verified: true,
  },
  {
    id: "faq",
    title: "よくある質問（FAQ）",
    titleEn: "FAQ",
    url: `${CITY_ORIGIN}/faq/001/006/006/p111295.html`,
    verified: true,
  },
];

/** フッターリンク（固定値: F11） */
export const footerLinks: SiteLink[] = [
  { id: "top", title: "現行トップページ", titleEn: "Current Official Top", url: `${CITY_ORIGIN}/`, verified: true },
  { id: "en", title: "English", titleEn: "English", url: `${CITY_ORIGIN}/en/index.html`, verified: true },
  { id: "mobile", title: "携帯サイト", titleEn: "Mobile Site", url: `${CITY_ORIGIN}/mobile/`, verified: true },
  { id: "shiho", title: "市報さいたま", titleEn: "City Bulletin", url: `${CITY_ORIGIN}/006/014/010/001/index.html`, verified: true },
];
