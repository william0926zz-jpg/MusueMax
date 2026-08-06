import type { Artifact, Museum } from './types';

type ArtifactSeed = [string, string, string, string, string, string[], string, string?, string?];

export const museums: Museum[] = [
  {
    id: 'british-museum',
    name: '大英博物馆',
    country: '英国',
    city: '伦敦',
    summary: '以世界文明史为主线，适合历史、艺术与跨文化主题研学。',
    tags: ['世界文明', '古埃及', '古希腊', '考古'],
    image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'national-museum-china',
    name: '中国国家博物馆',
    country: '中国',
    city: '北京',
    summary: '以中华文明发展脉络为核心，覆盖历史、文物、社会变迁与美育内容。',
    tags: ['中华文明', '青铜器', '陶瓷', '近现代'],
    image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'met',
    name: '大都会艺术博物馆',
    country: '美国',
    city: '纽约',
    summary: '馆藏横跨古代文明、欧洲绘画、亚洲艺术与现代设计。',
    tags: ['艺术史', '绘画', '雕塑', '设计'],
    image: 'https://images.unsplash.com/photo-1565060169194-19fabf63012f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cleveland',
    name: '克利夫兰艺术博物馆',
    country: '美国',
    city: '克利夫兰',
    summary: '开放馆藏数据质量较高，适合快速接入真实艺术品、图片与来源信息。',
    tags: ['开放馆藏', '艺术史', '全球文明', '真实 API'],
    image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: 'https://www.clevelandart.org/open-access-api',
    sourceName: 'Cleveland Museum of Art Open Access API',
  },
  {
    id: 'van-gogh-museum',
    name: '梵高美术馆',
    country: '荷兰',
    city: '阿姆斯特丹',
    summary: '以梵高作品、书信和同时代艺术家资料为核心，适合艺术表达、生命故事与现代艺术主题研学。',
    tags: ['梵高', '后印象派', '艺术家书信', '油画'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Van_Gogh_Museum_Amsterdam.jpg/1200px-Van_Gogh_Museum_Amsterdam.jpg',
    sourceUrl: 'https://www.vangoghmuseum.nl/en/search/collection',
    sourceName: 'Van Gogh Museum Collection Search',
  },
  {
    id: 'rijksmuseum',
    name: '阿姆斯特丹国立博物馆',
    country: '荷兰',
    city: '阿姆斯特丹',
    summary: '荷兰国家级艺术与历史博物馆，适合黄金时代绘画、社会生活、殖民与贸易网络等主题。',
    tags: ['荷兰黄金时代', '伦勃朗', '维米尔', '开放数据'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Rijksmuseum_Amsterdam_ca_2016.jpg/1200px-Rijksmuseum_Amsterdam_ca_2016.jpg',
    sourceUrl: 'https://data.rijksmuseum.nl/docs/',
    sourceName: 'Rijksmuseum Data Services',
  },
  {
    id: 'louvre',
    name: '卢浮宫博物馆',
    country: '法国',
    city: '巴黎',
    summary: '欧洲艺术与古代文明的重要场域，适合图像解读与历史叙事课程。',
    tags: ['欧洲艺术', '古典文明', '官方 JSON', '肖像'],
    image: 'https://images.unsplash.com/photo-1565099824688-e93eb20fe622?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: 'https://collections.louvre.fr/en/',
    sourceName: 'Louvre Collections JSON',
  },
  {
    id: 'shanghai-museum',
    name: '上海博物馆',
    country: '中国',
    city: '上海',
    summary: '以青铜、陶瓷、书画与工艺收藏见长，适合城市研学与传统文化主题。',
    tags: ['青铜器', '书画', '陶瓷', '工艺'],
    image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?auto=format&fit=crop&w=1200&q=80',
  },
];

export const artifactBank: Record<string, Artifact[]> = {
  'british-museum': ([
    ['rosetta', '罗塞塔石碑', '公元前 196 年', '古埃及展区', '刻有三种文字的法令石碑，是破译埃及象形文字的关键文物。', ['文字演变', '文明交流'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Rosetta_Stone.JPG/800px-Rosetta_Stone.JPG', 'https://www.britishmuseum.org/collection/object/Y_EA24', 'British Museum Collection'],
    ['parthenon', '帕特农神庙雕塑', '公元前 438-432 年', '古希腊展区', '来自雅典帕特农神庙的古典雕塑群，体现神话叙事、人体表现与城邦公共艺术。', ['神话', '古典艺术'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Elgin_Marbles_British_Museum.jpg/800px-Elgin_Marbles_British_Museum.jpg', 'https://www.britishmuseum.org/collection/term/BIOG57940', 'British Museum Collection'],
    ['mummy', '盖布莱因人木乃伊', '约公元前 3400 年', '古埃及展区', '保存状态极佳的早期埃及自然木乃伊，帮助理解史前埃及的埋葬方式。', ['信仰', '考古'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Ginger_mummy.jpg/800px-Ginger_mummy.jpg', 'https://www.britishmuseum.org/collection/object/Y_EA32751', 'British Museum Collection'],
    ['assyrian-lion', '亚述猎狮浮雕', '公元前 645-635 年', '两河文明展区', '亚述王宫浮雕以连续画面表现王权、狩猎仪式和帝国叙事。', ['图像叙事', '权力'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/British_Museum_Room_10_Assyrian_Lion_Hunt_Relief.jpg/800px-British_Museum_Room_10_Assyrian_Lion_Hunt_Relief.jpg', 'https://www.britishmuseum.org/collection/object/W_1856-0909-15', 'British Museum Collection'],
    ['sutton-hoo', '萨顿胡头盔', '公元 7 世纪', '欧洲中世纪展区', '盎格鲁-撒克逊贵族墓葬中的代表性头盔，体现身份象征和金属工艺。', ['身份', '工艺'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Sutton_Hoo_helmet_2016.png/800px-Sutton_Hoo_helmet_2016.png', 'https://www.britishmuseum.org/collection/object/H_1939-1010-93', 'British Museum Collection'],
    ['portland-vase', '波特兰花瓶', '公元 1-25 年', '罗马展区', '罗马玻璃工艺名作，以蓝白浮雕玻璃表现古典神话场景。', ['材料工艺', '神话'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Portland_Vase_BM_Gem4036_n1.jpg/800px-Portland_Vase_BM_Gem4036_n1.jpg', 'https://www.britishmuseum.org/collection/object/G_1945-0927-1', 'British Museum Collection'],
    ['benin-bronze', '贝宁青铜饰板', '16-17 世纪', '非洲展区', '贝宁王国宫廷青铜饰板，记录仪式、权力结构与高超铸造技术。', ['非洲文明', '金属工艺'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/British_Museum_Benin_Bronze.jpg/800px-British_Museum_Benin_Bronze.jpg', 'https://www.britishmuseum.org/collection/term/x52292', 'British Museum Collection'],
    ['hoard', '霍克森宝藏', '公元 5 世纪', '罗马不列颠展区', '由金币、银器和首饰组成的晚期罗马宝藏，反映经济与日常生活。', ['经济史', '日常生活'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Hoxne_Hoard_British_Museum.jpg/800px-Hoxne_Hoard_British_Museum.jpg', 'https://www.britishmuseum.org/collection/term/x8833', 'British Museum Collection'],
    ['astrolabe', '伊斯兰星盘', '13 世纪', '伊斯兰艺术展区', '用于天文观测、计时与定位的科学仪器，体现数学与工艺结合。', ['科学史', '数学'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Astrolabe-Persian-18C.jpg/800px-Astrolabe-Persian-18C.jpg', 'https://www.britishmuseum.org/collection/term/x50531', 'British Museum Collection'],
    ['lewis-chessmen', '刘易斯棋子', '12 世纪', '欧洲中世纪展区', '以海象牙和鲸牙制成的中世纪棋子，呈现游戏、等级和工艺交流。', ['游戏史', '工艺'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Lewis_chessmen_12th_century.jpg/800px-Lewis_chessmen_12th_century.jpg', 'https://www.britishmuseum.org/collection/term/x49065', 'British Museum Collection'],
  ] satisfies ArtifactSeed[]).map(toArtifact),
  'van-gogh-museum': ([
    ['vgm-sunflowers', '向日葵', '1889 年', '梵高作品展区', '梵高在阿尔勒创作的花卉静物代表作，以强烈黄色、厚涂笔触和简洁构图表现生命力。', ['后印象派', '色彩表达'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Vincent_Willem_van_Gogh_128.jpg/800px-Vincent_Willem_van_Gogh_128.jpg', 'https://www.vangoghmuseum.nl/en/search/collection?q=Sunflowers', 'Van Gogh Museum Collection Search'],
    ['vgm-almond-blossom', '杏花', '1890 年', '梵高作品展区', '为新生侄子创作的祝福之作，蓝色背景与白色花枝展现梵高晚期对日本版画和生命主题的吸收。', ['生命主题', '日本影响'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg/800px-Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg', 'https://www.vangoghmuseum.nl/en/search/collection?q=Almond%20Blossom', 'Van Gogh Museum Collection Search'],
    ['vgm-bedroom', '在阿尔勒的卧室', '1888 年', '梵高作品展区', '卧室空间被简化成明亮色块，倾斜透视和日常物件共同呈现艺术家的生活状态。', ['空间表达', '艺术家生活'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Vincent_van_Gogh_-_De_slaapkamer_-_Google_Art_Project.jpg/800px-Vincent_van_Gogh_-_De_slaapkamer_-_Google_Art_Project.jpg', 'https://www.vangoghmuseum.nl/en/search/collection?q=Bedroom', 'Van Gogh Museum Collection Search'],
    ['vgm-potato-eaters', '吃土豆的人', '1885 年', '早期作品展区', '以暗色调描绘农民家庭晚餐，体现梵高早期对劳动、贫困与人物群像的关注。', ['社会观察', '人物群像'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Vincent_Van_Gogh_-_The_Potato_Eaters.png/800px-Vincent_Van_Gogh_-_The_Potato_Eaters.png', 'https://www.vangoghmuseum.nl/en/search/collection?q=Potato%20Eaters', 'Van Gogh Museum Collection Search'],
    ['vgm-irises', '鸢尾花', '1890 年', '圣雷米时期展区', '花卉在画面中呈现旋律般的线条和冷暖对比，是理解梵高自然观察和装饰性构图的重要作品。', ['自然观察', '线条节奏'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Irises-Vincent_van_Gogh.jpg/800px-Irises-Vincent_van_Gogh.jpg', 'https://www.vangoghmuseum.nl/en/search/collection?q=Irises', 'Van Gogh Museum Collection Search'],
    ['vgm-wheatfield-crows', '麦田群鸦', '1890 年', '奥维尔时期展区', '宽阔麦田、岔路和飞鸟构成紧张画面，常被用来讨论梵高晚期的情绪、构图与象征。', ['情绪表达', '风景画'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Wheatfield_with_Crows_by_Vincent_van_Gogh.jpg/800px-Wheatfield_with_Crows_by_Vincent_van_Gogh.jpg', 'https://www.vangoghmuseum.nl/en/search/collection?q=Wheatfield%20with%20Crows', 'Van Gogh Museum Collection Search'],
    ['vgm-yellow-house', '黄房子', '1888 年', '阿尔勒时期展区', '画面记录梵高在阿尔勒的住所和理想中的艺术家共同生活空间。', ['艺术共同体', '城市景观'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Vincent_van_Gogh_-_The_yellow_house_%28%27The_street%27%29.jpg/800px-Vincent_van_Gogh_-_The_yellow_house_%28%27The_street%27%29.jpg', 'https://www.vangoghmuseum.nl/en/search/collection?q=Yellow%20House', 'Van Gogh Museum Collection Search'],
    ['vgm-self-portrait-grey-felt', '戴灰毡帽的自画像', '1887 年', '巴黎时期展区', '短促笔触和互补色表现艺术家面部与心理状态，是研究梵高自我形象建构的关键作品。', ['自画像', '笔触研究'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/VanGogh_1887_Selbstbildnis.jpg/800px-VanGogh_1887_Selbstbildnis.jpg', 'https://www.vangoghmuseum.nl/en/search/collection?q=Self-Portrait%20with%20Grey%20Felt%20Hat', 'Van Gogh Museum Collection Search'],
    ['vgm-sower', '播种者', '1888 年', '阿尔勒时期展区', '受米勒和日本版画影响，梵高以夕阳、树干和田地表达劳动与生命循环。', ['劳动主题', '艺术影响'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Vincent_van_Gogh_-_The_sower_-_Google_Art_Project.jpg/800px-Vincent_van_Gogh_-_The_sower_-_Google_Art_Project.jpg', 'https://www.vangoghmuseum.nl/en/search/collection?q=The%20Sower', 'Van Gogh Museum Collection Search'],
    ['vgm-letters', '梵高书信', '1880-1890 年', '书信与档案展区', '梵高写给弟弟提奥及友人的书信，是理解其艺术观念、生活处境和创作选择的重要文本材料。', ['艺术家书信', '一手史料'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Letter_from_Vincent_van_Gogh_to_Theo_van_Gogh%2C_1888.jpg/800px-Letter_from_Vincent_van_Gogh_to_Theo_van_Gogh%2C_1888.jpg', 'https://www.vangoghmuseum.nl/en/search/collection?q=letter', 'Van Gogh Museum Collection Search'],
  ] satisfies ArtifactSeed[]).map(toArtifact),
  rijksmuseum: ([
    ['rijks-night-watch', '夜巡', '1642 年', '荣誉画廊', '伦勃朗为阿姆斯特丹民兵队创作的大型群像，光线、动作和城市公共生活构成强烈戏剧性。', ['荷兰黄金时代', '公共生活'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/The_Nightwatch_by_Rembrandt.jpg/800px-The_Nightwatch_by_Rembrandt.jpg', 'https://www.rijksmuseum.nl/en/collection/SK-C-5', 'Rijksmuseum Collection'],
    ['rijks-milkmaid', '倒牛奶的女仆', '约 1660 年', '荣誉画廊', '维米尔以日常厨房场景表现光线、静物和劳动的尊严，是荷兰风俗画代表。', ['日常生活', '光线观察'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg/800px-Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg', 'https://www.rijksmuseum.nl/en/collection/SK-A-2344', 'Rijksmuseum Collection'],
    ['rijks-jewish-bride', '犹太新娘', '约 1665-1669 年', '荣誉画廊', '伦勃朗晚期人物画代表，以厚重颜料和亲密姿态表现情感与身份。', ['人物画', '材料肌理'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Rembrandt_Harmensz._van_Rijn_036.jpg/800px-Rembrandt_Harmensz._van_Rijn_036.jpg', 'https://www.rijksmuseum.nl/en/collection/SK-C-216', 'Rijksmuseum Collection'],
    ['rijks-swan', '受威胁的天鹅', '约 1650 年', '荣誉画廊', '扬·阿塞莱因以天鹅抵御威胁的瞬间，连接动物画、政治寓意和视觉象征。', ['寓意', '动物画'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Jan_Asselijn_-_De_bedreigde_zwaan.jpg/800px-Jan_Asselijn_-_De_bedreigde_zwaan.jpg', 'https://www.rijksmuseum.nl/en/collection/SK-A-4', 'Rijksmuseum Collection'],
    ['rijks-self-portrait', '伦勃朗自画像', '约 1628 年', '伦勃朗展区', '年轻伦勃朗以强烈明暗关系探索自我形象和面部表情。', ['自画像', '明暗法'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Rembrandt_Self-portrait_%28Kenwood%29.jpg/800px-Rembrandt_Self-portrait_%28Kenwood%29.jpg', 'https://www.rijksmuseum.nl/en/search?q=Rembrandt%20self-portrait', 'Rijksmuseum Collection'],
    ['rijks-doll-house', '佩特罗内拉·奥特曼的玩偶屋', '约 1686-1710 年', '17 世纪生活展区', '精细玩偶屋呈现荷兰富裕家庭的室内空间、消费文化和性别角色。', ['社会生活', '物质文化'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Dolls_house_of_Petronella_Oortman.jpg/800px-Dolls_house_of_Petronella_Oortman.jpg', 'https://www.rijksmuseum.nl/en/collection/BK-NM-1010', 'Rijksmuseum Collection'],
    ['rijks-still-life-cheese', '有奶酪的静物', '约 1615 年', '静物画展区', '弗洛里斯·范·戴克通过餐桌物品表现贸易、饮食和财富审美。', ['静物画', '贸易生活'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Floris_van_Dijck_-_Still_Life_with_Cheeses.jpg/800px-Floris_van_Dijck_-_Still_Life_with_Cheeses.jpg', 'https://www.rijksmuseum.nl/en/search?q=Still%20Life%20with%20Cheese', 'Rijksmuseum Collection'],
    ['rijks-battle-waterloo', '滑铁卢战役', '1824 年', '19 世纪历史画展区', '扬·威廉·皮内曼以宏大历史画记录欧洲政治变局和国家记忆。', ['历史画', '欧洲史'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Pieneman_-_De_slag_bij_Waterloo.jpg/800px-Pieneman_-_De_slag_bij_Waterloo.jpg', 'https://www.rijksmuseum.nl/en/search?q=Battle%20of%20Waterloo%20Pieneman', 'Rijksmuseum Collection'],
    ['rijks-cuyp-river', '河边风景', '约 1650 年', '风景画展区', '阿尔伯特·库普以金色光线和河流景观表现荷兰地理、贸易与乡村秩序。', ['风景画', '地理环境'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Aelbert_Cuyp_-_River_Landscape_with_Riders_-_Google_Art_Project.jpg/800px-Aelbert_Cuyp_-_River_Landscape_with_Riders_-_Google_Art_Project.jpg', 'https://www.rijksmuseum.nl/en/search?q=Aelbert%20Cuyp%20river%20landscape', 'Rijksmuseum Collection'],
    ['rijks-ship-model', '东印度公司船模', '17 世纪', '海事与贸易展区', '船模展示荷兰海上贸易、造船技术和全球航线，是讨论早期全球化的重要入口。', ['海上贸易', '全球联系'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Model_of_a_Dutch_East_Indiaman.jpg/800px-Model_of_a_Dutch_East_Indiaman.jpg', 'https://www.rijksmuseum.nl/en/search?q=East%20Indiaman%20model', 'Rijksmuseum Collection'],
  ] satisfies ArtifactSeed[]).map(toArtifact),
  louvre: ([
    ['louvre-mona-lisa', '蒙娜丽莎', '1503-1519 年', '德农翼 711 展厅', '达·芬奇肖像画代表作，以神秘微笑、空气透视和细腻明暗法成为文艺复兴艺术的核心案例。', ['文艺复兴', '肖像画'], 'https://collections.louvre.fr/media/cache/large/0000000021/0000062370/0000868046_OG.JPG', 'https://collections.louvre.fr/ark:/53355/cl010062370', 'Louvre Collections JSON'],
    ['louvre-venus-milo', '米洛的维纳斯', '约公元前 150-125 年', '叙利翼古希腊展区', '古希腊大理石雕塑代表，适合观察比例、姿态和古典美学的传承。', ['古希腊', '雕塑'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Venus_de_Milo_Louvre_Ma399_n4.jpg/800px-Venus_de_Milo_Louvre_Ma399_n4.jpg', 'https://collections.louvre.fr/en/recherche?q=Venus%20de%20Milo', 'Louvre Collections'],
    ['louvre-winged-victory', '萨莫色雷斯的胜利女神', '约公元前 190 年', '德农翼达鲁楼梯', '海战胜利纪念雕塑，以迎风衣褶和动态姿态展示希腊化时期雕塑张力。', ['希腊化艺术', '运动表现'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Samothrace_Louvre_Ma2369_n4.jpg/800px-Samothrace_Louvre_Ma2369_n4.jpg', 'https://collections.louvre.fr/en/recherche?q=Winged%20Victory%20of%20Samothrace', 'Louvre Collections'],
    ['louvre-liberty', '自由引导人民', '1830 年', '法国绘画展区', '德拉克洛瓦以寓言人物和现实街垒结合，表达七月革命与现代政治图像。', ['法国历史', '政治图像'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Eug%C3%A8ne_Delacroix_-_La_libert%C3%A9_guidant_le_peuple.jpg/800px-Eug%C3%A8ne_Delacroix_-_La_libert%C3%A9_guidant_le_peuple.jpg', 'https://collections.louvre.fr/en/recherche?q=Liberty%20Leading%20the%20People', 'Louvre Collections'],
    ['louvre-raft-medusa', '梅杜萨之筏', '1818-1819 年', '法国绘画展区', '籍里柯以真实海难为题材，构成浪漫主义绘画中身体、灾难与政治批判的经典。', ['浪漫主义', '历史事件'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/JEAN_LOUIS_TH%C3%89ODORE_G%C3%89RICAULT_-_La_Balsa_de_la_Medusa_%28Museo_del_Louvre%2C_1818-19%29.jpg/800px-JEAN_LOUIS_TH%C3%89ODORE_G%C3%89RICAULT_-_La_Balsa_de_la_Medusa_%28Museo_del_Louvre%2C_1818-19%29.jpg', 'https://collections.louvre.fr/en/recherche?q=Raft%20of%20the%20Medusa', 'Louvre Collections'],
    ['louvre-coronation', '拿破仑一世加冕大典', '1805-1807 年', '法国绘画展区', '大卫以巨幅历史画记录帝国仪式，适合讨论政治合法性、构图和视觉宣传。', ['历史画', '政治仪式'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Jacques-Louis_David_-_The_Coronation_of_Napoleon_%281805-1807%29.jpg/800px-Jacques-Louis_David_-_The_Coronation_of_Napoleon_%281805-1807%29.jpg', 'https://collections.louvre.fr/en/recherche?q=Coronation%20of%20Napoleon', 'Louvre Collections'],
    ['louvre-seated-scribe', '书记员坐像', '古埃及第四或第五王朝', '埃及文物展区', '彩绘石灰岩雕像以写实眼神和坐姿呈现古埃及文书阶层身份。', ['古埃及', '身份制度'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Seated_Scribe-E_3023-IMG_4267-gradient.jpg/800px-Seated_Scribe-E_3023-IMG_4267-gradient.jpg', 'https://collections.louvre.fr/en/recherche?q=Seated%20Scribe', 'Louvre Collections'],
    ['louvre-code-hammurabi', '汉谟拉比法典石碑', '公元前 18 世纪', '古代近东展区', '玄武岩石碑刻有法典铭文和王权图像，是理解法律、文字和国家治理的关键文物。', ['两河文明', '法律与文字'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Code-de-Hammurabi-1.jpg/800px-Code-de-Hammurabi-1.jpg', 'https://collections.louvre.fr/en/recherche?q=Code%20of%20Hammurabi', 'Louvre Collections'],
    ['louvre-psyche-cupid', '丘比特吻醒普赛克', '1787-1793 年', '雕塑展区', '卡诺瓦以新古典主义语言表现神话情节，适合观察身体姿态、情感和古典复兴。', ['新古典主义', '神话'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Antonio_Canova_-_Psyche_Revived_by_Cupid%27s_Kiss_-_Louvre_MR_1777.jpg/800px-Antonio_Canova_-_Psyche_Revived_by_Cupid%27s_Kiss_-_Louvre_MR_1777.jpg', 'https://collections.louvre.fr/en/recherche?q=Psyche%20Revived%20by%20Cupid', 'Louvre Collections'],
    ['louvre-lamassu', '人首翼牛像', '公元前 8 世纪', '亚述展区', '亚述王宫守护神兽结合人、牛和鹰的形象，展现帝国权力、建筑空间和保护象征。', ['亚述文明', '权力象征'], 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Human-headed_winged_bull_profile.jpg/800px-Human-headed_winged_bull_profile.jpg', 'https://collections.louvre.fr/en/recherche?q=winged%20bull', 'Louvre Collections'],
  ] satisfies ArtifactSeed[]).map(toArtifact),
};

const fallbackArtifacts = ([
  ['bronze-ding', '后母戊鼎', '商代晚期', '青铜器展区', '大型礼器体现商代青铜铸造与礼制秩序。', ['礼制', '青铜工艺'], 'https://images.unsplash.com/photo-1598113962305-9bdc90d527c5?auto=format&fit=crop&w=900&q=80'],
  ['painted-pottery', '彩陶盆', '新石器时代', '陶器展区', '图案与器形呈现早期聚落生活和审美。', ['史前生活', '纹样'], 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80'],
  ['jade-cong', '玉琮', '良渚文化', '玉器展区', '方圆结构与纹饰连接早期信仰和权力象征。', ['礼仪', '玉器'], 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=900&q=80'],
  ['celadon', '青瓷莲花尊', '南北朝', '陶瓷展区', '釉色、造型与佛教纹样融合的陶瓷代表。', ['陶瓷', '宗教艺术'], 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80'],
  ['scroll', '山水画卷', '宋代', '书画展区', '以空间层次与笔墨表现文人自然观。', ['美育', '自然观'], 'https://images.unsplash.com/photo-1577720643272-265f09367456?auto=format&fit=crop&w=900&q=80'],
  ['armor', '武士甲胄', '江户时代', '武备展区', '从材料、结构和纹样理解身份与战争技术。', ['结构', '身份'], 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=80'],
  ['portrait', '人物肖像画', '18 世纪', '绘画展区', '通过服饰、姿态和背景读取人物身份。', ['图像解读', '社会史'], 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=80'],
  ['clock', '机械钟', '19 世纪', '科学技术展区', '齿轮、擒纵与时间制度连接科技和社会生活。', ['机械', '时间'], 'https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=900&q=80'],
  ['mask', '仪式面具', '20 世纪', '民族艺术展区', '造型与色彩承载节庆、身份和共同体记忆。', ['民俗', '视觉表达'], 'https://images.unsplash.com/photo-1578301978069-45264734cddc?auto=format&fit=crop&w=900&q=80'],
  ['poster', '城市海报', '20 世纪', '现代设计展区', '字体、色彩和构图反映城市生活方式变化。', ['设计', '现代史'], 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=900&q=80'],
  ['coin', '古代钱币', '汉代', '货币展区', '形制、铭文与流通范围帮助理解经济网络。', ['经济', '铭文'], 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=900&q=80'],
] satisfies ArtifactSeed[]).map(toArtifact);

function toArtifact([id, name, era, gallery, summary, educationTags, image, sourceUrl, sourceName]: ArtifactSeed): Artifact {
  return { id, name, era, gallery, summary, educationTags, image, sourceUrl, sourceName };
}

export function getArtifactsForMuseum(museumId: string): Artifact[] {
  return artifactBank[museumId] ?? fallbackArtifacts;
}
