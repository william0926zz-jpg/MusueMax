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
    id: 'louvre',
    name: '卢浮宫博物馆',
    country: '法国',
    city: '巴黎',
    summary: '欧洲艺术与古代文明的重要场域，适合图像解读与历史叙事课程。',
    tags: ['欧洲艺术', '古典文明', '建筑', '肖像'],
    image: 'https://images.unsplash.com/photo-1565099824688-e93eb20fe622?auto=format&fit=crop&w=1200&q=80',
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
