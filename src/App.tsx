import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  ClipboardList,
  Compass,
  Download,
  FileText,
  Flag,
  GraduationCap,
  ImagePlus,
  LayoutDashboard,
  MapPin,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { getArtifactsForMuseum, museums } from './data';
import type { Activity, Artifact, Mission, Museum, RecognitionResult, StoryStyle } from './types';

const storyStyles: StoryStyle[] = ['魔幻', '科幻', '历史穿越', '冒险'];

const explorerRoles = ['线索记录员', '图像侦察员', '时间守护者', '展厅导航员', '纹样解码师', '材料分析师', '故事讲述者', '路线规划师'];

type ThemeKey = 'classic' | 'night' | 'future' | 'paper';
type LanguageKey = 'zh' | 'en';

const homeThemes: Array<{ id: ThemeKey; name: string; tone: string; toneEn: string }> = [
  { id: 'classic', name: '典藏暖光', tone: '铜绿 / 陶土 / 羊皮纸', toneEn: 'Verdigris / Terracotta / Parchment' },
  { id: 'night', name: '夜游解谜', tone: '墨黑 / 金箔 / 青绿', toneEn: 'Ink Black / Gold Leaf / Dark Teal' },
  { id: 'future', name: '未来科考', tone: '冰白 / 电子蓝 / 荧光绿', toneEn: 'Ice White / Electric Blue / Neon Green' },
  { id: 'paper', name: '手账探索', tone: '宣纸 / 印章红 / 松石绿', toneEn: 'Rice Paper / Seal Red / Turquoise' },
];

const MIN_SELECTED_ARTIFACTS = 5;
const MAX_SELECTED_ARTIFACTS = 10;
const TEACHER_PORTAL_PASSWORD = '2026Max';

const themeNames: Record<ThemeKey, string> = {
  classic: '典藏暖光',
  night: '夜游解谜',
  future: '未来科考',
  paper: '手账探索',
};

const themeNamesEn: Record<ThemeKey, string> = {
  classic: 'Classic Glow',
  night: 'Night Mystery',
  future: 'Future Expedition',
  paper: 'Notebook Journey',
};

const storyStyleNamesEn: Record<StoryStyle, string> = {
  魔幻: 'Fantasy',
  科幻: 'Sci-Fi',
  历史穿越: 'Time Travel',
  冒险: 'Adventure',
};

function t(language: LanguageKey, zh: string, en: string) {
  return language === 'zh' ? zh : en;
}

function getThemeName(theme: ThemeKey, language: LanguageKey) {
  return language === 'zh' ? themeNames[theme] : themeNamesEn[theme];
}

function getStoryStyleName(style: StoryStyle, language: LanguageKey) {
  return language === 'zh' ? style : storyStyleNamesEn[style];
}

function getRecognitionStatusLabel(status: string, language: LanguageKey) {
  if (status === '完成') return t(language, '识别成功', 'Match Confirmed');
  if (status === '未匹配') return t(language, '未匹配', 'Not Matched');
  return status;
}

function getConfidenceDescriptor(confidence: number, language: LanguageKey) {
  if (confidence >= 0.85) return t(language, '高置信', 'High Confidence');
  if (confidence >= 0.6) return t(language, '中等置信', 'Medium Confidence');
  if (confidence > 0) return t(language, '低置信', 'Low Confidence');
  return t(language, '待确认', 'Needs Review');
}

function getActivityFacts(activity: Activity, language: LanguageKey) {
  return [
    { label: t(language, '博物馆', 'Museum'), value: activity.museum.name },
    { label: t(language, '任务数', 'Missions'), value: String(activity.missions.length) },
    { label: t(language, '主题', 'Theme'), value: getThemeName(activity.storyStyle === '科幻' ? 'future' : activity.storyStyle === '魔幻' ? 'night' : activity.storyStyle === '历史穿越' ? 'paper' : 'classic', language) },
  ];
}

type StudentTeamMember = {
  id: string;
  name: string;
  teamIndex: number;
  teamName: string;
  role: string;
};

type ActivityHistoryEntry = {
  id: string;
  publishedAt: string;
  activity: Activity;
  activeTheme: ThemeKey;
};

type AppRoute = 'home' | 'teacher' | 'student';

function getRouteFromPath(): AppRoute {
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/teacher')) return 'teacher';
  if (path.startsWith('/student')) return 'student';
  return 'home';
}

function loadActivityHistory() {
  try {
    const raw = window.localStorage.getItem('museumax-activity-history');
    if (!raw) return [] as ActivityHistoryEntry[];
    const parsed = JSON.parse(raw) as ActivityHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as ActivityHistoryEntry[];
  }
}

function buildMissions(
  artifacts: Artifact[],
  style: StoryStyle,
  subject: string,
  grade: string,
  goal: string,
  variant = 0,
  theme: ThemeKey = 'classic',
  language: LanguageKey = 'zh',
) {
  return artifacts.map((artifact, index) => {
    return {
      id: `mission-${artifact.id}`,
      artifactId: artifact.id,
      title: buildArtifactTitle(artifact, index + variant, language),
      story: buildMissionFallbackStory(artifact, grade, subject, goal, language),
      selfIntro: buildArtifactSelfIntro(artifact, language),
      requirement: buildMissionFallbackRequirement(artifact, grade, subject, goal, language),
      submission: t(language, '照片上传 + 简短观察', 'Photo upload + short observation'),
      hint: buildMissionFallbackHint(artifact, language),
      teacherNote: buildTeacherMissionNote(artifact, language),
      answer: language === 'zh'
        ? `目标藏品：${artifact.name}。${artifact.name}可用于${grade}${subject}课程中的${artifact.educationTags.join('、')}主题学习。`
        : `Target artifact: ${artifact.name}. ${artifact.name} can support ${grade} ${subject} learning around ${artifact.educationTags.join(', ')}.`,
      minutes: index < 2 ? 8 : index < 6 ? 10 : 12,
    };
  });
}

function buildTeacherMissionNote(artifact: Artifact, language: LanguageKey = 'zh') {
  const source = artifact.sourceName
    ? t(language, `来源：${artifact.sourceName}`, `Source: ${artifact.sourceName}`)
    : t(language, '来源：当前藏品库', 'Source: current artifact library');
  return language === 'zh'
    ? `1. 藏品信息：${artifact.name}；馆藏机构为当前活动所选博物馆；年代或收藏线索为${artifact.era}。\n2. 馆藏来源：${source}；可结合展签、馆方说明和图片细节进行讲解，避免学生端提前获得完整答案。\n3. 课标适配：围绕${artifact.educationTags.join('、')}引导${artifact.gallery}现场观察，讲解时控制在本年级课堂已接触的材料、文字、交流或信仰等基础概念内，可追问“哪一个细节最能证明你的判断”。`
    : `1. Artifact: ${artifact.name}; museum context: the currently selected museum; era or dating clue: ${artifact.era}.\n2. Collection source: ${source}; use the label, official museum notes, and visible details for teaching without revealing the answer too early to students.\n3. Curriculum fit: guide observation around ${artifact.educationTags.join(', ')} in ${artifact.gallery}, keeping explanation within the concepts already covered for this grade level, and ask: "Which detail best supports your judgment?"`;
}

function buildMissionFallbackStory(artifact: Artifact, grade: string, subject: string, goal: string, language: LanguageKey = 'zh') {
  return language === 'zh'
    ? `你们沿着背景故事里留下的线索走到${artifact.gallery}，发现这一关的答案并不藏在最显眼的位置，而藏在这件展品如何回应“${goal}”的细节里。现在，轮到你们把这段故事继续往前推。`
    : `Following the thread left by the opening story, your team reaches ${artifact.gallery}. The answer in this chapter is not hidden in the most obvious place, but in the details that show how this object speaks to "${goal}". Now it is your turn to push the adventure forward.`;
}

function buildMissionFallbackHint(artifact: Artifact, language: LanguageKey = 'zh') {
  const clueWords = extractClueKeywords(artifact.summary);
  if (language === 'zh') {
    const featureHint = clueWords.length > 0
      ? `先盯住它最容易被看到的细节，像${clueWords.slice(0, 2).join('、')}这些特征，往往比名字更先暴露身份。`
      : '先盯住它最容易被看到的细节，例如材质、轮廓、纹样、文字或人物姿态。';
    return `先到${artifact.gallery}缩小范围，别只盯着中心展柜，也看看它附近陈列的是哪些同类或同时代器物。${featureHint}最后再用展签确认：${artifact.era}这条时间线索，和它的用途、文明背景或交流痕迹是否能对上。`;
  }
  const featureHint = clueWords.length > 0
    ? `Start with the easiest visible details, such as ${clueWords.slice(0, 2).join(' and ')}. Those features usually reveal identity faster than a name does.`
    : 'Start with the easiest visible details, such as material, silhouette, patterns, text, or posture.';
  return `Begin in ${artifact.gallery} to narrow the search. Do not stare only at the center case; also look at nearby objects from the same period or family. ${featureHint} Then use the museum label to confirm whether the clue of ${artifact.era} matches its function, cultural background, or signs of exchange.`;
}

function buildMissionFallbackRequirement(artifact: Artifact, grade: string, subject: string, goal: string, language: LanguageKey = 'zh') {
  return language === 'zh'
    ? `实地行动：前往${artifact.gallery}找到目标展品，并拍下一张能看清主要特征的完整照片。\n课堂表达：用${grade}${subject}课堂能理解的语言，说出它怎样为“${goal}”提供了一条证据。`
    : `Field action: Go to ${artifact.gallery}, locate the target object, and take one clear photo that shows its main features.\nClassroom response: Using language suitable for ${grade} ${subject}, explain how it provides one piece of evidence for "${goal}".`;
}

function buildArtifactSelfIntro(artifact: Artifact, language: LanguageKey = 'zh') {
  const clue = artifact.educationTags[0] ?? extractClueKeywords(artifact.summary)[0] ?? '一段古老线索';
  return language === 'zh'
    ? `“我把${clue}藏在自己的纹样、材料和年代里。别急着问我是谁，先看看我为什么会在这里等你们。”`
    : `"I hide ${clue} in my patterns, material, and age. Do not rush to ask my name. First notice why I have been waiting for you here."`;
}

function getUsableMissionText(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  return normalized ? normalized : fallback;
}

function getUsableHintText(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  if (!normalized) return fallback;
  if (normalized.length < 55) return fallback;
  return normalized;
}

function buildArtifactTitle(artifact: Artifact, index: number, language: LanguageKey = 'zh') {
  const knownTitles: Record<string, string> = {
    rosetta: '三种文字的回声',
    parthenon: '神庙石影的叙事',
    mummy: '沙漠时间的沉睡者',
    'assyrian-lion': '王宫浮雕里的猎影',
    'sutton-hoo': '头盔纹样的身份谜',
    'portland-vase': '蓝白玻璃中的神话',
    'benin-bronze': '青铜饰板上的宫廷记忆',
    hoard: '银光宝藏的生活账本',
    astrolabe: '星盘刻度里的远行',
    'lewis-chessmen': '棋子表情中的中世纪',
  };
  const knownTitlesEn: Record<string, string> = {
    rosetta: 'Echoes of Three Scripts',
    parthenon: 'Narrative in Marble Shadows',
    mummy: 'The Sleeper in Desert Time',
    'assyrian-lion': 'The Hunt Within the Relief',
    'sutton-hoo': 'The Helmet and Its Identity',
    'portland-vase': 'Myth in Blue and White Glass',
    'benin-bronze': 'Court Memory in Bronze',
    hoard: 'The Ledger of Hidden Silver',
    astrolabe: 'Voyage Within the Dial',
    'lewis-chessmen': 'Medieval Faces on the Board',
  };
  if (language === 'zh' && knownTitles[artifact.id]) return knownTitles[artifact.id];
  if (language === 'en' && knownTitlesEn[artifact.id]) return knownTitlesEn[artifact.id];

  const tag = artifact.educationTags[index % Math.max(artifact.educationTags.length, 1)] ?? '文明';
  const keyword = extractClueKeywords(artifact.summary)[0] ?? (artifact.gallery.replace(/展区|展厅/g, '') || '展柜');
  const endingsZh = ['里的线索', '上的回声', '中的坐标', '背后的谜题'];
  const endingsEn = ['Clues in View', 'Echoes Nearby', 'Coordinates in Time', 'The Hidden Riddle'];
  return language === 'zh'
    ? `${keyword}${tag}${endingsZh[index % endingsZh.length]}`
    : `${keyword} ${endingsEn[index % endingsEn.length]}`;
}

function extractClueKeywords(summary: string) {
  return summary
    .replace(/[，。；：,.、]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && word.length <= 8)
    .filter((word) => !['来自公开知识库的馆藏条目', '可用于研学任务初筛', '作者', '制作者', '材料'].some((blocked) => word.includes(blocked)))
    .slice(0, 4);
}

function buildActivityBackgroundStory(
  museum: Museum,
  artifacts: Artifact[],
  storyStyle: StoryStyle,
  grade: string,
  subject: string,
  goal: string,
  theme: ThemeKey,
  language: LanguageKey = 'zh',
) {
  if (language === 'en') {
    const leadArtifactsEn = artifacts.slice(0, 3).map((artifact) => artifact.name).join(', ');
    const styleLeadEn: Record<StoryStyle, string[]> = {
      魔幻: [
        `At opening time in ${museum.name}, a line of handwriting appears in the edge of the catalogue as if an old object were borrowing the page to invite your team inside. It explains nothing directly, but leaves a mysterious trail about "${goal}", quietly binding ${leadArtifactsEn || 'several key objects'} into a single prophetic thread.`,
        `This field trip now feels less like a worksheet and more like stepping into a sealed legend behind the glass. Using only what students can understand in ${grade} ${subject}, you must read patterns, materials, words, and moments of encounter to decide what kind of meeting between civilizations changed everyday life in the first place.`,
      ],
      科幻: [
        `A damaged archive has just come back online inside the research system of ${museum.name}. The recovered signal suggests that these objects share an overlooked storyline, all pointing toward "${goal}". But the file restores only the beginning, and the rest must be reconstructed through human observation inside the galleries.`,
        `So today your team enters not only as visitors, but as field restorers. Around ${leadArtifactsEn || 'these selected objects'}, you must reconnect scattered evidence like a broken data chain and decide how cultural exchange entered real human life through actual things people made, used, and carried.`,
      ],
      历史穿越: [
        `Something in ${museum.name} feels as if time has shifted a few inches out of place. What reaches your team is not an ordinary task sheet, but a message that seems to have crossed from another era, lingering around ${leadArtifactsEn || 'several key objects'} as though someone in the past is asking you to finish an unfinished sentence.`,
        `The trip ahead is therefore more than observation. It feels like walking back and forth between different ages. With the perspective already learned in ${grade} ${subject}, your team must translate what the labels, forms, materials, and functions are really saying about how exchange between civilizations reshaped daily life and ways of understanding the world.`,
      ],
      冒险: [
        `A page with no catalogue number has appeared among the holdings of ${museum.name}. It contains only one line: "If you want to see how civilization changes human life, do not look only at dynasties and dates. Listen for the echoes between objects." Your adventure begins from that unexplained page.`,
        `From the perspective of ${grade} ${subject}, this is no ordinary museum visit. It is a live pursuit through the galleries. Following traces left by ${leadArtifactsEn || 'the selected objects'}, your team will move from case to case and slowly piece together how writing, craft, belief, and exchange shaped the texture of lived human experience.`,
      ],
    };
    return styleLeadEn[storyStyle];
  }
  const leadArtifacts = artifacts.slice(0, 3).map((artifact) => artifact.name).join('、');
  const styleLead: Record<StoryStyle, string[]> = {
    魔幻: [
      `${museum.name}刚开馆时，馆藏目录边缘浮出一行本不该出现的手写字，像是某件古老器物在借纸页向你们发出邀请。字迹没有解释来历，只留下关于${goal}的模糊提示，把${leadArtifacts || '几件目标展品'}悄悄串成一条像预言一样的线。`,
      `所以今天的研学像走进一段被封存在展柜里的隐秘传说。你们不会先得到答案，而要在${grade}${subject}能理解的范围里，从纹样、文字、材料和相遇的细节中判断：究竟是哪一次文明相遇，把人类生活悄悄改写成了新的模样。`,
    ],
    科幻: [
      `${museum.name}的研学终端刚刚恢复了一段异常档案。系统判断，这批馆藏之间存在一条被低估的关联主线，主题正是“${goal}”。但档案只恢复了开头，剩下的部分需要你们进入展厅，用人的观察替机器补全。`,
      `于是你们今天既是参观者，也是现场修复员。围绕${leadArtifacts || '这批目标展品'}，你们要像在修复一条断裂的数据链那样，把散落在展柜中的证据重新拼接起来，判断文明交流究竟如何通过具体器物进入了真实的人类生活。`,
    ],
    历史穿越: [
      `${museum.name}的展厅里，今天像悄悄开了一道时间缝隙。你们拿到的不是普通任务单，而像是一封从旧时代误投到今天的来信，信里反复提到${leadArtifacts || '几件关键器物'}，仿佛有人希望你们替过去的人补上没说完的话。`,
      `接下来的研学，不只是观察文物，更像在古今之间来回穿行。你们要用${grade}${subject}已经掌握的视角，把展柜前看到的材料、文字、纹样和功能重新翻译出来，看看文明交流如何一步步改变了人们过日子、表达和理解世界的方式。`,
    ],
    冒险: [
      `${museum.name}的馆藏目录里，最近多出了一页没有编号的纸。纸上只写着一句话：“若想看清文明怎样改变人类生活，就别只看王朝和年代，要去听器物彼此之间的回声。”你们今天的探险，就从这页来历不明的纸开始。`,
      `在${grade}${subject}的视角里，这不是一次普通参观，而像一次真正的馆内追踪。你们会沿着${leadArtifacts || '展厅中的关键器物'}留下的痕迹推进路线，在不同展区里一点点拼出答案：文字、工艺、信仰与交流，究竟怎样慢慢改变了真实的人间生活。`,
    ],
  };
  return styleLead[storyStyle];
}

function createActivity(
  museum: Museum,
  artifacts: Artifact[],
  storyStyle: StoryStyle,
  subject: string,
  grade: string,
  duration: number,
  goal: string,
  teamCount: number,
  code = generateActivityCode(),
  missionVariant = 0,
  theme: ThemeKey = 'classic',
  language: LanguageKey = 'zh',
): Activity {
  return {
    code,
    name: `${museum.name}时光探险课`,
    className: `${grade}研学 1 班`,
    grade,
    subject,
    duration,
    teamSize: 4,
    teamCount,
    mode: '小队',
    museum,
    artifacts,
    missions: buildMissions(artifacts, storyStyle, subject, grade, goal, missionVariant, theme, language),
    storyStyle,
    goal,
    backgroundStory: buildActivityBackgroundStory(museum, artifacts, storyStyle, grade, subject, goal, theme, language),
  };
}

function normalizeGeneratedMissions(generated: unknown, fallback: Mission[]) {
  const missions = (generated as { missions?: Partial<Mission>[] })?.missions;
  if (!Array.isArray(missions) || missions.length === 0) return fallback;
  const usedTitles = new Set<string>();
  return fallback.map((fallbackMission, index) => {
    const mission = missions[index] ?? {};
    const generatedTitle = typeof mission.title === 'string' ? mission.title.trim() : '';
    const title = generatedTitle && !usedTitles.has(generatedTitle) && generatedTitle.length <= 18
      ? generatedTitle
      : fallbackMission.title;
    usedTitles.add(title);
    return {
      ...fallbackMission,
      title,
      story: getUsableMissionText(mission.story, fallbackMission.story),
      selfIntro: getUsableMissionText(mission.selfIntro, fallbackMission.selfIntro),
      requirement: getUsableMissionText(mission.requirement, fallbackMission.requirement),
      submission: typeof mission.submission === 'string' ? mission.submission : fallbackMission.submission,
      hint: getUsableHintText(mission.hint, fallbackMission.hint),
      teacherNote: getUsableMissionText(mission.teacherNote, fallbackMission.teacherNote),
      answer: getUsableMissionText(mission.answer, fallbackMission.answer),
      minutes: typeof mission.minutes === 'number' ? mission.minutes : fallbackMission.minutes,
    };
  });
}

function generateActivityCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomPart = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `MX-${randomPart.slice(0, 3)}-${randomPart.slice(3)}`;
}

function isGenerationFeedbackError(message: string) {
  return ['失败', '超时', '不存在', 'deployment', 'error', 'Error'].some((keyword) => message.includes(keyword));
}

function clampConfidence(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeMatchConfidence(matched: boolean, confidence: number, detectedName: string, targetName: string) {
  const rawConfidence = clampConfidence(confidence);
  if (matched) return rawConfidence;

  const normalizedDetected = detectedName.trim().toLowerCase();
  const normalizedTarget = targetName.trim().toLowerCase();
  const looksLikeTarget = normalizedDetected && normalizedTarget && (
    normalizedDetected === normalizedTarget ||
    normalizedDetected.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedDetected)
  );

  if (!normalizedDetected || normalizedDetected.includes('未确认') || normalizedDetected.includes('未完成')) {
    return 0.06;
  }

  if (looksLikeTarget) {
    return Math.min(0.16, Math.max(0.06, (1 - rawConfidence) * 0.18));
  }

  return Math.min(0.2, Math.max(0.07, (1 - rawConfidence) * 0.24));
}

function getDefaultTeamName(index: number) {
  const names = ['星图小队', '青铜小队', '远航小队', '时光小队', '纹样小队', '守护小队', '探索小队', '解谜小队'];
  return names[index] ?? `第 ${index + 1} 小队`;
}

function getExplorerRole(name: string, teamIndex: number) {
  const seed = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), teamIndex);
  return explorerRoles[seed % explorerRoles.length];
}

function createMemberId() {
  return `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildActivityShareText(activity: Activity) {
  return `MUSEUMAX 活动：${activity.name}
活动码：${activity.code}
学生入口：${window.location.origin}/student`;
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadTextFile(filename: string, content: string) {
  downloadFile(filename, content, 'text/plain;charset=utf-8');
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('照片读取失败，请重新选择图片。'));
    reader.readAsDataURL(file);
  });
}

async function generateTextWithAzure<T>(type: string, context: Record<string, unknown>): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 70000);

  try {
    const response = await fetch('/api/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, context }),
      signal: controller.signal,
    });
    return await readApiJsonResponse<T>(response, 'AI 文本生成失败，已使用本地模板。');
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('AI 生成超时，已切回本地模板。');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function readApiJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const rawText = await response.text();
  const parsed = tryParseJson(rawText);

  if (!response.ok) {
    const serverMessage = extractApiErrorMessage(parsed, rawText);
    throw new Error(serverMessage || fallbackMessage);
  }

  if (parsed !== null) {
    return parsed as T;
  }

  throw new Error(rawText.trim() ? summarizeUnexpectedApiPayload(rawText) : fallbackMessage);
}

function tryParseJson(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  try {
    return JSON.parse(normalized) as unknown;
  } catch {
    return null;
  }
}

function extractApiErrorMessage(parsed: unknown, rawText: string) {
  if (parsed && typeof parsed === 'object' && 'error' in parsed && typeof parsed.error === 'string') {
    return parsed.error;
  }
  const normalized = rawText
    .replace(/\s+/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .trim();
  if (!normalized) return '';
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function summarizeUnexpectedApiPayload(rawText: string) {
  const normalized = rawText
    .replace(/\s+/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .trim();
  if (!normalized) return 'AI 服务返回了空响应，请稍后重试。';
  const snippet = normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
  return `AI 服务返回了无法解析的响应：${snippet}`;
}

function clampPromptText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

function buildMissionGenerationContext(
  museum: Museum,
  artifacts: Artifact[],
  storyStyle: StoryStyle,
  subject: string,
  grade: string,
  duration: number,
  goal: string,
  teamCount: number,
  missionVariant: number,
  theme: ThemeKey,
  language: LanguageKey,
) {
  return {
    museum: {
      id: museum.id,
      name: museum.name,
      country: museum.country,
      city: museum.city,
      summary: clampPromptText(museum.summary, 90),
      tags: museum.tags.slice(0, 4),
      sourceName: museum.sourceName,
    },
    artifacts: artifacts.map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      era: artifact.era,
      gallery: artifact.gallery,
      summary: clampPromptText(artifact.summary, 120),
      educationTags: artifact.educationTags.slice(0, 4),
      sourceName: artifact.sourceName,
    })),
    storyStyle,
    subject,
    grade,
    duration,
    goal: clampPromptText(goal, 90),
    teamCount,
    missionVariant,
    theme: getThemeName(theme, language),
    language,
  };
}

function buildGenerationSignature(
  museum: Museum,
  artifacts: Artifact[],
  storyStyle: StoryStyle,
  subject: string,
  grade: string,
  duration: number,
  goal: string,
  teamCount: number,
  theme: ThemeKey,
  language: LanguageKey,
) {
  return JSON.stringify({
    museumId: museum.id,
    artifactIds: artifacts.map((artifact) => artifact.id),
    storyStyle,
    subject: subject.trim(),
    grade: grade.trim(),
    duration,
    goal: goal.trim(),
    teamCount,
    theme,
    language,
  });
}

async function generateMissionDraftsWithAzure(
  museum: Museum,
  artifacts: Artifact[],
  storyStyle: StoryStyle,
  subject: string,
  grade: string,
  duration: number,
  goal: string,
  teamCount: number,
  missionVariant: number,
  theme: ThemeKey,
  backgroundStory: string[],
  language: LanguageKey,
) {
  return generateTextWithAzure<{ missions: Partial<Mission>[] }>('missions', {
    ...buildMissionGenerationContext(museum, artifacts, storyStyle, subject, grade, duration, goal, teamCount, missionVariant, theme, language),
    backgroundStory,
  });
}

async function generateActivityBackgroundWithAzure(
  museum: Museum,
  artifacts: Artifact[],
  storyStyle: StoryStyle,
  subject: string,
  grade: string,
  duration: number,
  goal: string,
  theme: ThemeKey,
  language: LanguageKey,
) {
  return generateTextWithAzure<{ paragraphs: string[] }>('activity_background', {
    museum: {
      id: museum.id,
      name: museum.name,
      country: museum.country,
      city: museum.city,
      summary: clampPromptText(museum.summary, 90),
      tags: museum.tags.slice(0, 4),
      sourceName: museum.sourceName,
    },
    artifacts: artifacts.map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      era: artifact.era,
      gallery: artifact.gallery,
      summary: clampPromptText(artifact.summary, 120),
      educationTags: artifact.educationTags.slice(0, 4),
      sourceName: artifact.sourceName,
    })),
    subject,
    grade,
    duration,
    goal: clampPromptText(goal, 90),
    storyStyle,
    theme: getThemeName(theme, language),
    language,
  });
}

function buildReportContent(activity: Activity, teamMembers: StudentTeamMember[], completedMissions: string[], missionCompletions: Record<string, string>) {
  const completionRate = activity.missions.length > 0 ? Math.round((completedMissions.length / activity.missions.length) * 100) : 0;
  const teams = new Map<number, StudentTeamMember[]>();
  teamMembers.forEach((member) => {
    teams.set(member.teamIndex, [...(teams.get(member.teamIndex) ?? []), member]);
  });

  return [
    `# ${activity.name} 课后复盘报告`,
    '',
    `活动码：${activity.code}`,
    `班级：${activity.className}`,
    `博物馆：${activity.museum.name}`,
    `学科/年级：${activity.subject} / ${activity.grade}`,
    `教学目标：${activity.goal}`,
    `任务完成率：${completionRate}%`,
    `完成关卡：${completedMissions.length} / ${activity.missions.length}`,
    `参与学生：${teamMembers.length}`,
    '',
    '## 任务清单',
    ...activity.missions.map((mission, index) => `${index + 1}. ${mission.title} - ${completedMissions.includes(mission.id) ? `已完成（${missionCompletions[mission.id] ?? '未记录成员'}）` : '未完成'}`),
    '',
    '## 小队成员',
    ...(teams.size > 0
      ? Array.from(teams.entries()).flatMap(([teamIndex, members]) => [
          `${getDefaultTeamName(teamIndex)}：${members.map((member) => `${member.name}（${member.role}）`).join('、')}`,
        ])
      : ['暂无学生加入记录']),
  ].join('\n');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildReportHtml(activity: Activity, teamMembers: StudentTeamMember[], completedMissions: string[], missionCompletions: Record<string, string>) {
  const completionRate = activity.missions.length > 0 ? Math.round((completedMissions.length / activity.missions.length) * 100) : 0;
  const teams = new Map<number, StudentTeamMember[]>();
  teamMembers.forEach((member) => {
    teams.set(member.teamIndex, [...(teams.get(member.teamIndex) ?? []), member]);
  });

  const teamRows = teams.size > 0
    ? Array.from(teams.entries()).map(([teamIndex, members], index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(getDefaultTeamName(teamIndex))}</td>
          <td>${escapeHtml(members.map((member) => `${member.name}（${member.role}）`).join('、'))}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3">暂无学生加入记录</td></tr>';

  const missionCards = activity.missions.map((mission, index) => {
    const completed = completedMissions.includes(mission.id);
    const completer = missionCompletions[mission.id] ?? '未记录成员';
    return `
      <section class="mission-card">
        <div class="mission-head">
          <div>
            <span class="eyebrow">任务 ${index + 1}</span>
            <h3>${escapeHtml(mission.title)}</h3>
          </div>
          <span class="status ${completed ? 'done' : 'pending'}">${completed ? `已完成 · ${escapeHtml(completer)}` : '未完成'}</span>
        </div>
        <p class="story">${escapeHtml(mission.story || '暂无任务故事。')}</p>
        <div class="detail-grid">
          <div><strong>文物自述</strong><p>${escapeHtml(mission.selfIntro || '暂无文物自述。')}</p></div>
          <div><strong>学生任务</strong><p>${escapeHtml(mission.requirement || '暂无任务要求。').replace(/\n/g, '<br />')}</p></div>
          <div><strong>谜题线索</strong><p>${escapeHtml(mission.hint || '暂无谜题线索。').replace(/\n/g, '<br />')}</p></div>
          <div><strong>教师提示</strong><p>${escapeHtml(mission.teacherNote || '暂无教师提示。').replace(/\n/g, '<br />')}</p></div>
        </div>
      </section>
    `;
  }).join('');

  const background = activity.backgroundStory.length > 0
    ? activity.backgroundStory.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')
    : '<p>暂无背景故事。</p>';

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(activity.name)} 课后复盘报告</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f1e8;
      --paper: #fffdf8;
      --ink: #1f2328;
      --muted: #6d7470;
      --line: #d8ccbb;
      --accent: #2f6f68;
      --accent-soft: #e4f0ee;
      --warn: #b9643a;
      --warn-soft: #f4e5dc;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.65;
    }
    .page {
      max-width: 1080px;
      margin: 0 auto;
      padding: 40px 24px 56px;
    }
    .hero, .panel, .mission-card {
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(35, 31, 24, 0.05);
    }
    .hero {
      padding: 28px 32px;
      margin-bottom: 20px;
    }
    .hero small, .eyebrow {
      display: inline-block;
      color: var(--accent);
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      font-size: 12px;
    }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 32px; margin-top: 10px; }
    h2 { font-size: 22px; margin-bottom: 14px; }
    h3 { font-size: 20px; margin-top: 6px; }
    .hero p { margin-top: 12px; color: var(--muted); }
    .meta-grid, .summary-grid, .detail-grid {
      display: grid;
      gap: 12px;
    }
    .meta-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-top: 20px;
    }
    .summary-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .meta-card, .metric {
      padding: 16px 18px;
      border-radius: 12px;
      background: #faf6ee;
      border: 1px solid #eadfce;
    }
    .meta-card strong, .metric strong {
      display: block;
      margin-top: 6px;
      font-size: 20px;
    }
    .panel {
      padding: 24px 26px;
      margin-bottom: 20px;
    }
    .panel p + p { margin-top: 10px; }
    .mission-list {
      display: grid;
      gap: 16px;
    }
    .mission-card {
      padding: 20px 22px;
    }
    .mission-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
    }
    .status {
      flex-shrink: 0;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }
    .status.done { background: var(--accent-soft); color: var(--accent); }
    .status.pending { background: var(--warn-soft); color: var(--warn); }
    .story {
      margin-bottom: 14px;
      color: #39413e;
    }
    .detail-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .detail-grid > div {
      padding: 14px 16px;
      border-radius: 12px;
      background: #fcf9f3;
      border: 1px solid #ede3d4;
    }
    .detail-grid strong {
      display: block;
      margin-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px 10px;
      border-bottom: 1px solid #eadfce;
      text-align: left;
      vertical-align: top;
    }
    th {
      font-size: 13px;
      color: var(--muted);
      font-weight: 700;
    }
    @media print {
      body { background: #fff; }
      .page { max-width: none; padding: 0; }
      .hero, .panel, .mission-card { box-shadow: none; break-inside: avoid; }
    }
    @media (max-width: 720px) {
      .meta-grid, .summary-grid, .detail-grid { grid-template-columns: 1fr; }
      .mission-head { flex-direction: column; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <small>MUSEUMAX 课后复盘报告</small>
      <h1>${escapeHtml(activity.name)}</h1>
      <p>${escapeHtml(activity.museum.name)} · ${escapeHtml(activity.subject)} / ${escapeHtml(activity.grade)} · 教学目标：${escapeHtml(activity.goal)}</p>
      <div class="meta-grid">
        <div class="meta-card"><span>活动码</span><strong>${escapeHtml(activity.code)}</strong></div>
        <div class="meta-card"><span>班级</span><strong>${escapeHtml(activity.className)}</strong></div>
        <div class="meta-card"><span>分组</span><strong>${activity.teamCount} 个小队 · 每队 ${activity.teamSize} 人</strong></div>
      </div>
    </section>

    <section class="panel">
      <h2>背景故事</h2>
      ${background}
    </section>

    <section class="panel">
      <h2>课堂概览</h2>
      <div class="summary-grid">
        <div class="metric"><span>任务完成率</span><strong>${completionRate}%</strong></div>
        <div class="metric"><span>完成关卡</span><strong>${completedMissions.length} / ${activity.missions.length}</strong></div>
        <div class="metric"><span>参与学生</span><strong>${teamMembers.length}</strong></div>
        <div class="metric"><span>研学主题</span><strong>${escapeHtml(activity.storyStyle)}</strong></div>
      </div>
    </section>

    <section class="panel">
      <h2>小队成员</h2>
      <table>
        <thead>
          <tr><th>#</th><th>小队</th><th>成员与角色</th></tr>
        </thead>
        <tbody>${teamRows}</tbody>
      </table>
    </section>

    <section class="panel">
      <h2>任务复盘</h2>
      <div class="mission-list">${missionCards}</div>
    </section>
  </main>
</body>
</html>`;
}

function buildTeamOpeningStory(activity: Activity, teamName: string, members: StudentTeamMember[]) {
  const roster = members.length > 0 ? members.map((member) => `${member.name}负责${member.role}`).join('，') : '队员身份即将被点亮';
  return `${teamName}收到一封来自${activity.museum.name}闭馆后的密信：展厅里有 ${activity.missions.length} 段被打散的文明线索，分别藏在不同展柜、年代和材料之间。${roster}。你们不需要按顺序前进，可以先选择最有把握的线索；每完成一关，学习地图上关于“${activity.goal}”的故事就会亮起一块。`;
}

function buildTeamFinalStory(
  activity: Activity,
  teamName: string,
  completedMissions: string[],
  missionCompletions: Record<string, string>,
  teamMembers: StudentTeamMember[],
  progress: number,
  theme: ThemeKey = 'classic',
) {
  const orderedMissions = completedMissions
    .map((missionId) => activity.missions.find((mission) => mission.id === missionId))
    .filter((mission): mission is Mission => Boolean(mission));
  const visibleMissions = orderedMissions.length > 0 ? orderedMissions : activity.missions;
  const decoderName = 'L';
  const decoderRole = '纹样解码师';
  const themeMood: Record<ThemeKey, { opening: string; turn: string; light: string }> = {
    classic: { opening: '大英博物馆的晨光像旧书页一样铺开', turn: '铜绿与纸页气味之间', light: '温润的展灯' },
    night: { opening: '大英博物馆的展厅在夜色里压低了呼吸', turn: '暗影、档案与玻璃反光之间', light: '窄窄的冷光' },
    future: { opening: '大英博物馆的数字档案在小队终端里亮起', turn: '全息星点与展柜数据之间', light: '蓝白色的扫描光' },
    paper: { opening: '大英博物馆的路线像一册摊开的手账', turn: '水墨线条与展签旁的留白之间', light: '柔和的纸色光' },
  };
  const mood = themeMood[theme];
  const completeLine = progress >= 100 ? '星图终于合拢成完整的航线' : '星图还有几处暗格没有完全亮起';
  const firstMission = visibleMissions[0];
  const middleMission = visibleMissions[Math.max(1, Math.floor(visibleMissions.length / 2) - 1)] ?? visibleMissions[0];
  const lastMission = visibleMissions[visibleMissions.length - 1] ?? visibleMissions[0];
  const firstDetail = firstMission?.selfIntro || firstMission?.hint || '第一段线索在玻璃与纹样之间慢慢亮起';
  const middleDetail = middleMission?.hint || middleMission?.story || '新的证据把更远的文明联系到一起';
  const lastDetail = lastMission?.story || lastMission?.selfIntro || '最后一处展柜把答案推到眼前';

  return [
    `${mood.opening}，90 分钟“时光探险”从一张折叠星图开始。${teamName}其实只有一名队员：${decoderName}，小队专属${decoderRole}。他把小放大镜别在胸前，习惯先描摹纹样再读展签；起初，关于“${activity.goal}”的线索像散落的墨点，他只觉得它们遥远又安静。`,
    `${decoderName}先在第一处展柜前慢下来。${firstDetail}这让他不再只看见一件孤零零的文物，而像看见一段生活正从器物表面往外浮出。后来他又被${middleDetail}牵着走向更深的展厅，站在玻璃反光里反复比对材料、姿态和年代，才意识到自己追的并不是一条题目，而是一连串被时间藏起来的证据。`,
    `探险过半时，${mood.light}落在放大镜边缘，星图上几条细线第一次连了起来。${decoderName}走到最后一段线索前，看见${lastDetail}，忽然明白：文明交流并不是课本里一句遥远结论，而是会在器物的造型、文字的迁移、纹样的相似和材料的流动里留下痕迹。他从疑惑变得兴奋，甚至开始预判下一处展柜会留下些什么。`,
    `最后一枚星点亮起时，${completeLine}。${decoderName}合上手账，没有再急着给出标准答案；他只是把放大镜收好，轻声说，原来人类生活被改变的时刻，常常先藏在一条纹样、一段文字、一次远行和一次学习之中。大英博物馆的展厅重新安静下来，但这段星图已经变成了他自己的时光探险。`,
  ];
}

function App() {
  const [route, setRoute] = useState<AppRoute>(() => getRouteFromPath());
  const [language, setLanguage] = useState<LanguageKey>(() => {
    const stored = window.localStorage.getItem('museumax-language');
    return stored === 'en' ? 'en' : 'zh';
  });
  const [teacherAuthorized, setTeacherAuthorized] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherPasswordError, setTeacherPasswordError] = useState('');
  const [teacherStep, setTeacherStep] = useState(0);
  const [studentStep, setStudentStep] = useState(0);
  const [studentJoinError, setStudentJoinError] = useState('');
  const [query, setQuery] = useState('');
  const [onlineMuseums, setOnlineMuseums] = useState<Museum[]>([]);
  const [isSearchingMuseums, setIsSearchingMuseums] = useState(false);
  const [museumSearchError, setMuseumSearchError] = useState('');
  const [selectedMuseum, setSelectedMuseum] = useState<Museum>(museums[0]);
  const [artifacts, setArtifacts] = useState<Artifact[]>(getArtifactsForMuseum(museums[0].id));
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<string[]>(() => getArtifactsForMuseum(museums[0].id).slice(0, MAX_SELECTED_ARTIFACTS).map((artifact) => artifact.id));
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);
  const [artifactLoadMessage, setArtifactLoadMessage] = useState('');
  const [missionVariant, setMissionVariant] = useState(0);
  const [subject, setSubject] = useState('历史');
  const [grade, setGrade] = useState('七年级');
  const [duration, setDuration] = useState(90);
  const [teamCount, setTeamCount] = useState(6);
  const [storyStyle, setStoryStyle] = useState<StoryStyle>('冒险');
  const [goal, setGoal] = useState('理解文明交流如何改变人类生活');
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('classic');
  const [activityHistory, setActivityHistory] = useState<ActivityHistoryEntry[]>(() => loadActivityHistory());
  const [activity, setActivity] = useState<Activity>(() =>
    createActivity(selectedMuseum, artifacts, storyStyle, subject, grade, duration, goal, teamCount, generateActivityCode(), 0, 'classic', language),
  );
  const [studentName, setStudentName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0);
  const [studentTeamName, setStudentTeamName] = useState(getDefaultTeamName(0));
  const [teamMembers, setTeamMembers] = useState<StudentTeamMember[]>([]);
  const [activeMissionIndex, setActiveMissionIndex] = useState(0);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<Record<string, string>>({});
  const [recognition, setRecognition] = useState<RecognitionResult | null>(null);
  const [uploadedName, setUploadedName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [generationStage, setGenerationStage] = useState<'idle' | 'background' | 'missions'>('idle');
  const [generatingMissionId, setGeneratingMissionId] = useState('');
  const [publishMessage, setPublishMessage] = useState('');
  const [backgroundReadySignature, setBackgroundReadySignature] = useState('');
  const [missionsReadySignature, setMissionsReadySignature] = useState('');
  const [generatedMissionIds, setGeneratedMissionIds] = useState<string[]>([]);
  const generationRequestIdRef = useRef(0);

  const filteredMuseums = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const localMatches = !normalizedQuery ? museums : museums.filter((museum) =>
      [museum.name, museum.country, museum.city, museum.summary, ...museum.tags]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
    return [...onlineMuseums, ...localMatches.filter((museum) => !onlineMuseums.some((item) => item.id === museum.id))];
  }, [onlineMuseums, query]);

  const missions = activity.missions;
  const currentMission = missions[activeMissionIndex] ?? missions[0];
  const progress = Math.round((completedMissions.length / missions.length) * 100);
  const selectedArtifacts = useMemo(
    () => artifacts.filter((artifact) => selectedArtifactIds.includes(artifact.id)),
    [artifacts, selectedArtifactIds],
  );
  const canGenerateFromSelection = selectedArtifactIds.length >= MIN_SELECTED_ARTIFACTS && selectedArtifactIds.length <= MAX_SELECTED_ARTIFACTS;
  const currentGenerationSignature = useMemo(
    () => buildGenerationSignature(selectedMuseum, selectedArtifacts, storyStyle, subject, grade, duration, goal, teamCount, activeTheme, language),
    [selectedMuseum, selectedArtifacts, storyStyle, subject, grade, duration, goal, teamCount, activeTheme, language],
  );
  const hasReadyBackgroundForCurrentConfig = backgroundReadySignature === currentGenerationSignature;
  const hasReadyMissionsForCurrentConfig = missionsReadySignature === currentGenerationSignature;

  useEffect(() => {
    document.body.classList.remove('theme-classic', 'theme-night', 'theme-future', 'theme-paper');
    document.body.classList.add(`theme-${activeTheme}`);
  }, [activeTheme]);

  useEffect(() => {
    window.localStorage.setItem('museumax-language', language);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem('museumax-activity-history', JSON.stringify(activityHistory.slice(0, 8)));
  }, [activityHistory]);

  useEffect(() => {
    function handlePopState() {
      setRoute(getRouteFromPath());
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigate(nextRoute: AppRoute) {
    const path = nextRoute === 'home' ? '/' : `/${nextRoute}`;
    window.history.pushState(null, '', path);
    if (route === 'teacher' && nextRoute !== 'teacher') {
      setTeacherAuthorized(false);
      setTeacherPassword('');
      setTeacherPasswordError('');
    }
    setRoute(nextRoute);
  }

  function unlockTeacherPortal() {
    if (teacherPassword.trim() === TEACHER_PORTAL_PASSWORD) {
      setTeacherAuthorized(true);
      setTeacherPassword('');
      setTeacherPasswordError('');
      return;
    }
    setTeacherPasswordError(t(language, '密码不正确，无法进入老师端。', 'Incorrect password. Access to the teacher portal is denied.'));
  }

  async function selectMuseum(museum: Museum) {
    setSelectedMuseum(museum);
    setIsLoadingArtifacts(true);
    setArtifactLoadMessage(t(language, '正在匹配可信馆藏来源...', 'Matching trusted collection sources...'));
    setTeacherStep(1);

    try {
      const sourcedArtifacts = await fetchTrustedArtifactsForMuseum(museum);
      if (sourcedArtifacts.artifacts.length > 0) {
        setArtifacts(sourcedArtifacts.artifacts);
        setSelectedArtifactIds(sourcedArtifacts.artifacts.slice(0, MAX_SELECTED_ARTIFACTS).map((artifact) => artifact.id));
        setArtifactLoadMessage(sourcedArtifacts.message);
      } else {
        const fallbackArtifacts = getArtifactsForMuseum(museum.id);
        setArtifacts(fallbackArtifacts);
        setSelectedArtifactIds(fallbackArtifacts.slice(0, MAX_SELECTED_ARTIFACTS).map((artifact) => artifact.id));
        setArtifactLoadMessage(t(language, '暂未接入该馆可信馆藏接口，已使用人工策划示例藏品。', 'No trusted live collection API is connected for this museum yet. A curated artifact list is being used.'));
      }
    } catch {
      const fallbackArtifacts = getArtifactsForMuseum(museum.id);
      setArtifacts(fallbackArtifacts);
      setSelectedArtifactIds(fallbackArtifacts.slice(0, MAX_SELECTED_ARTIFACTS).map((artifact) => artifact.id));
      setArtifactLoadMessage(t(language, '可信馆藏来源获取失败，已使用人工策划示例藏品。', 'Trusted collection sources could not be loaded. A curated artifact list is being used.'));
    } finally {
      setIsLoadingArtifacts(false);
    }
  }

  async function searchMuseumOnline() {
    const keyword = query.trim();
    if (!keyword) {
      setMuseumSearchError(t(language, '请输入博物馆名称、城市或主题关键词后再搜索。', 'Enter a museum name, city, or topic keyword before searching.'));
      return;
    }

    setIsSearchingMuseums(true);
    setMuseumSearchError('');

    try {
      const results = await fetchMuseumDetails(keyword);
      const fallbackResults = getLocalMuseumFallback(keyword);
      const mergedResults = mergeMuseums(results, fallbackResults);
      setOnlineMuseums(mergedResults);
      if (results.length === 0 && fallbackResults.length > 0) {
        setMuseumSearchError(t(language, '当前网络源未返回结果，已展示内置馆库中的匹配信息。', 'No live results were returned, so matching museums from the built-in list are shown instead.'));
      } else if (mergedResults.length === 0) {
        setMuseumSearchError(t(language, '没有找到可用的博物馆信息，请换一个更具体的关键词。', 'No museum results were found. Try a more specific keyword.'));
      }
    } catch {
      const fallbackResults = getLocalMuseumFallback(keyword);
      setOnlineMuseums(fallbackResults);
      setMuseumSearchError(
        fallbackResults.length > 0
          ? t(language, '联网搜索暂时失败，已展示内置馆库中的匹配信息。', 'Online search is temporarily unavailable, so matching built-in museums are shown instead.')
          : t(language, '联网搜索暂时失败，请检查网络后重试。', 'Online search is temporarily unavailable. Please check the network and try again.'),
      );
    } finally {
      setIsSearchingMuseums(false);
    }
  }

  function replaceArtifact(artifactId: string) {
    const bank = getArtifactsForMuseum(selectedMuseum.id);
    const candidate = bank.find((artifact) => !artifacts.some((item) => item.id === artifact.id));
    if (!candidate) return;
    setArtifacts((items) => items.map((item) => (item.id === artifactId ? candidate : item)));
    setSelectedArtifactIds((ids) => ids.map((id) => (id === artifactId ? candidate.id : id)));
  }

  function removeArtifact(artifactId: string) {
    setArtifacts((items) => items.filter((item) => item.id !== artifactId));
    setSelectedArtifactIds((ids) => ids.filter((id) => id !== artifactId));
  }

  function moveArtifact(index: number, direction: -1 | 1) {
    setArtifacts((items) => {
      const next = [...items];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return items;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function regenerateArtifacts() {
    const bank = artifacts.length > 0 ? artifacts : getArtifactsForMuseum(selectedMuseum.id);
    const regeneratedArtifacts = [...bank.slice(1), bank[0]].filter(Boolean);
    setArtifacts(regeneratedArtifacts);
    setSelectedArtifactIds(regeneratedArtifacts.slice(0, MAX_SELECTED_ARTIFACTS).map((artifact) => artifact.id));
  }

  function toggleArtifactSelection(artifactId: string) {
    setSelectedArtifactIds((ids) => {
      if (ids.includes(artifactId)) return ids.filter((id) => id !== artifactId);
      if (ids.length >= MAX_SELECTED_ARTIFACTS) {
        setArtifactLoadMessage(t(language, `任务生成最多选择 ${MAX_SELECTED_ARTIFACTS} 件展品，请先取消一件。`, `You can select up to ${MAX_SELECTED_ARTIFACTS} artifacts for mission generation. Deselect one first.`));
        return ids;
      }
      return [...ids, artifactId];
    });
  }

  function selectAllArtifacts() {
    setSelectedArtifactIds(artifacts.slice(0, MAX_SELECTED_ARTIFACTS).map((artifact) => artifact.id));
    setArtifactLoadMessage(
      t(
        language,
        `已默认选中前 ${Math.min(MAX_SELECTED_ARTIFACTS, artifacts.length)} 件展品；生成任务需保持 ${MIN_SELECTED_ARTIFACTS}-${MAX_SELECTED_ARTIFACTS} 件。`,
        `The first ${Math.min(MAX_SELECTED_ARTIFACTS, artifacts.length)} artifacts are now selected. Keep ${MIN_SELECTED_ARTIFACTS}-${MAX_SELECTED_ARTIFACTS} selected for mission generation.`,
      ),
    );
  }

  function clearArtifactSelection() {
    setSelectedArtifactIds([]);
  }

  function buildPreviewActivity(nextVariant: number, code = activity.code) {
    return createActivity(
      selectedMuseum,
      selectedArtifacts,
      storyStyle,
      subject,
      grade,
      duration,
      goal,
      teamCount,
      code,
      nextVariant,
      activeTheme,
      language,
    );
  }

  async function generateBackgroundStory() {
    if (!canGenerateFromSelection) return;
    const nextVariant = missionVariant + 1;
    setMissionVariant(nextVariant);
    const nextActivity = buildPreviewActivity(nextVariant, activity.code);
    const requestId = generationRequestIdRef.current + 1;
    generationRequestIdRef.current = requestId;
    setActivity(nextActivity);
    setTeacherStep(2);
    setIsGeneratingText(true);
    setGenerationStage('background');
    setGeneratingMissionId('');
    setMissionsReadySignature('');
    setGeneratedMissionIds([]);
    setPublishMessage(t(language, '正在生成整场冒险的背景故事...', 'Generating the adventure prologue...'));
    try {
      const background = await generateActivityBackgroundWithAzure(
        selectedMuseum,
        selectedArtifacts,
        storyStyle,
        subject,
        grade,
        duration,
        goal,
        activeTheme,
        language,
      );
      nextActivity.backgroundStory = Array.isArray(background.paragraphs) && background.paragraphs.length > 0
        ? background.paragraphs
        : nextActivity.backgroundStory;
      if (generationRequestIdRef.current !== requestId) return;
      setActivity({ ...nextActivity });
      setBackgroundReadySignature(currentGenerationSignature);
      setPublishMessage(t(language, '背景故事已生成，可以继续生成任务序列。', 'The background story is ready. You can continue with mission generation.'));
    } catch (error) {
      if (generationRequestIdRef.current !== requestId) return;
      setBackgroundReadySignature(currentGenerationSignature);
      setPublishMessage(
        error instanceof Error
          ? `${error.message} ${t(language, '已保留当前背景草稿，可继续生成任务序列。', 'The current fallback prologue has been kept, and you can still continue with mission generation.')}`
          : t(language, '背景故事 AI 生成失败，已保留当前背景草稿，可继续生成任务序列。', 'AI prologue generation failed. The current fallback prologue has been kept, and you can still continue with mission generation.'),
      );
    } finally {
      if (generationRequestIdRef.current !== requestId) return;
      setIsGeneratingText(false);
      setGenerationStage('idle');
    }
  }

  async function generateMissionSequence() {
    if (!canGenerateFromSelection || !hasReadyBackgroundForCurrentConfig) return;
    const requestId = generationRequestIdRef.current + 1;
    generationRequestIdRef.current = requestId;
    const nextActivity = buildPreviewActivity(missionVariant || 1, activity.code);
    nextActivity.backgroundStory = activity.backgroundStory;
    setActivity(nextActivity);
    setTeacherStep(2);
    setIsGeneratingText(true);
    setGenerationStage('missions');
    setPublishMessage(t(language, '正在根据当前背景故事生成任务序列...', 'Generating mission sequences from the current prologue...'));
    try {
      const generated = await generateMissionDraftsWithAzure(
        selectedMuseum,
        selectedArtifacts,
        storyStyle,
        subject,
        grade,
        duration,
        goal,
        teamCount,
        missionVariant || 1,
        activeTheme,
        nextActivity.backgroundStory,
        language,
      );
      nextActivity.missions = normalizeGeneratedMissions(generated, nextActivity.missions);
      if (generationRequestIdRef.current !== requestId) return;
      setActivity({ ...nextActivity });
      setMissionsReadySignature(currentGenerationSignature);
      setPublishMessage(t(language, '任务序列已生成，可以检查后发布活动。', 'The mission sequence is ready. Review it and publish when you are happy.'));
    } catch (error) {
      if (generationRequestIdRef.current !== requestId) return;
      if (generationRequestIdRef.current !== requestId) return;
      setActivity({ ...nextActivity });
      setMissionsReadySignature(currentGenerationSignature);
      setPublishMessage(
        error instanceof Error
          ? `${error.message} ${t(language, '已自动保留本地任务草稿，你可以继续检查并直接发布。', 'The local mission draft has been kept automatically. You can review it and publish directly.')}`
          : t(language, 'AI 文本生成失败，已自动保留本地任务草稿，你可以继续检查并直接发布。', 'AI generation failed, but the local mission draft has been kept automatically. You can review it and publish directly.'),
      );
    } finally {
      if (generationRequestIdRef.current !== requestId) return;
      setIsGeneratingText(false);
      setGenerationStage('idle');
    }
  }

  async function generateSingleMissionCard(missionId: string) {
    if (!canGenerateFromSelection || !hasReadyBackgroundForCurrentConfig) return;
    const missionIndex = activity.missions.findIndex((mission) => mission.id === missionId);
    if (missionIndex === -1) return;
    const artifact = selectedArtifacts[missionIndex];
    const fallbackMission = activity.missions[missionIndex];
    if (!artifact || !fallbackMission) return;

    const requestId = generationRequestIdRef.current + 1;
    generationRequestIdRef.current = requestId;
    const nextActivity = buildPreviewActivity(missionVariant || 1, activity.code);
    nextActivity.backgroundStory = activity.backgroundStory;
    nextActivity.missions = [...activity.missions];
    setActivity(nextActivity);
    setTeacherStep(2);
    setIsGeneratingText(true);
    setGenerationStage('missions');
    setGeneratingMissionId(missionId);
    setPublishMessage(t(language, '正在逐张生成任务卡...', 'Generating this mission card...'));

    try {
      const generated = await generateMissionDraftsWithAzure(
        selectedMuseum,
        [artifact],
        storyStyle,
        subject,
        grade,
        duration,
        goal,
        teamCount,
        missionVariant || 1,
        activeTheme,
        nextActivity.backgroundStory,
        language,
      );
      const normalizedMission = normalizeGeneratedMissions(generated, [fallbackMission])[0] ?? fallbackMission;
      nextActivity.missions[missionIndex] = normalizedMission;
      if (generationRequestIdRef.current !== requestId) return;
      setActivity({ ...nextActivity });
      const nextGeneratedIds = Array.from(new Set([...generatedMissionIds, missionId]));
      setGeneratedMissionIds(nextGeneratedIds);
      if (nextGeneratedIds.length === nextActivity.missions.length) {
        setMissionsReadySignature(currentGenerationSignature);
      }
      setPublishMessage(t(language, '这张任务卡已经更新，你可以继续生成下一张。', 'This mission card is ready. You can continue with the next one.'));
    } catch (error) {
      if (generationRequestIdRef.current !== requestId) return;
      nextActivity.missions[missionIndex] = fallbackMission;
      setActivity({ ...nextActivity });
      const nextGeneratedIds = Array.from(new Set([...generatedMissionIds, missionId]));
      setGeneratedMissionIds(nextGeneratedIds);
      if (nextGeneratedIds.length === nextActivity.missions.length) {
        setMissionsReadySignature(currentGenerationSignature);
      }
      setPublishMessage(
        error instanceof Error
          ? `${error.message} ${t(language, '这张卡片已保留本地草稿，你可以继续生成下一张。', 'This card has kept its local draft, and you can continue with the next one.')}`
          : t(language, 'AI 生成失败，这张卡片已保留本地草稿，你可以继续生成下一张。', 'AI generation failed. This card has kept its local draft, and you can continue with the next one.'),
      );
    } finally {
      if (generationRequestIdRef.current !== requestId) return;
      setIsGeneratingText(false);
      setGenerationStage('idle');
      setGeneratingMissionId('');
    }
  }

  function publishActivity() {
    if (!canGenerateFromSelection) return;
    const nextActivity = {
      ...activity,
      code: generateActivityCode(),
      name: `${selectedMuseum.name}时光探险课`,
      className: `${grade}研学 1 班`,
      grade,
      subject,
      duration,
      teamCount,
      museum: selectedMuseum,
      artifacts: selectedArtifacts,
      storyStyle,
      goal,
      backgroundStory: [...activity.backgroundStory],
      missions: activity.missions.map((mission) => ({ ...mission })),
    };
    setActivity(nextActivity);
    setActivityHistory((items) => [
      {
        id: `${nextActivity.code}-${Date.now()}`,
        publishedAt: new Date().toISOString(),
        activity: nextActivity,
        activeTheme,
      },
      ...items.filter((item) => item.activity.code !== nextActivity.code),
    ].slice(0, 8));
    setStudentCode(nextActivity.code);
    setPublishMessage('');
    setSelectedTeamIndex(0);
    setStudentTeamName(getDefaultTeamName(0));
    setActiveMissionIndex(0);
    setCompletedMissions([]);
    setMissionCompletions({});
    setTeacherStep(3);
  }

  function joinActivity() {
    if (studentName.trim() && studentCode.trim().toUpperCase() === activity.code) {
      setStudentJoinError('');
      setStudentStep(1);
      return;
    }
    setStudentJoinError(t(language, '活动码不正确，请核对老师发布的活动码后再试。', 'The activity code is incorrect. Please check the code shared by the teacher and try again.'));
  }

  function confirmStudentTeam() {
    const normalizedName = studentName.trim();
    const normalizedTeamName = studentTeamName.trim() || getDefaultTeamName(selectedTeamIndex);
    if (!normalizedName) return;
    setStudentTeamName(normalizedTeamName);
    setTeamMembers((members) => {
      const existingMemberIndex = members.findIndex((member) => member.name === normalizedName);
      const nextMember: StudentTeamMember = {
        id: existingMemberIndex >= 0 ? members[existingMemberIndex].id : createMemberId(),
        name: normalizedName,
        teamIndex: selectedTeamIndex,
        teamName: normalizedTeamName,
        role: getExplorerRole(normalizedName, selectedTeamIndex),
      };
      if (existingMemberIndex >= 0) {
        return members.map((member, index) => (index === existingMemberIndex ? nextMember : member));
      }
      return [...members, nextMember];
    });
    setStudentStep(2);
  }

  function selectStudentPhoto(file: File | null) {
    setUploadedFile(file);
    setUploadedName(file?.name ?? '');
    setRecognition(null);
  }

  async function submitRecognition() {
    if (!uploadedFile || isRecognizing) return;
    const targetArtifact = activity.artifacts.find((artifact) => artifact.id === currentMission.artifactId);
    if (!targetArtifact) return;

    setIsRecognizing(true);
    try {
      const imageDataUrl = await fileToDataUrl(uploadedFile);
      const response = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl,
          mission: currentMission,
          artifact: targetArtifact,
        }),
      });
      const result = await readApiJsonResponse<{
        matched?: boolean;
        confidence?: number;
        detectedName?: string;
        reason?: string;
      }>(response, 'AI 识别失败，请稍后重试。');

      const detectedName = String(result.detectedName ?? '未确认展品');
      const matchConfidence = normalizeMatchConfidence(
        Boolean(result.matched),
        Number(result.confidence ?? 0),
        detectedName,
        targetArtifact.name,
      );

      const nextResult: RecognitionResult = {
        status: result.matched ? '完成' : '未匹配',
        detectedName,
        confidence: matchConfidence,
        feedback: result.reason ?? 'AI 已完成识别判断。',
      };
      setRecognition(nextResult);
      setStudentStep(5);
      if (result.matched) {
        setCompletedMissions((items) => [...new Set([...items, currentMission.id])]);
        setMissionCompletions((items) => ({
          ...items,
          [currentMission.id]: studentName.trim() || studentTeamName,
        }));
      }
    } catch (error) {
      setRecognition({
        status: '未匹配',
        detectedName: '识别服务未完成',
        confidence: 0,
        feedback: error instanceof Error ? error.message : 'AI 识别失败，请稍后重试。',
      });
      setStudentStep(5);
    } finally {
      setIsRecognizing(false);
    }
  }

  function goNextMission() {
    setRecognition(null);
    setUploadedName('');
    setUploadedFile(null);
    setStudentStep(3);
  }

  function completeAllMissionsForTest() {
    const completer = studentName.trim() || 'L';
    const allMissionIds = activity.missions.map((mission) => mission.id);
    setCompletedMissions(allMissionIds);
    setMissionCompletions((items) => ({
      ...items,
      ...Object.fromEntries(allMissionIds.map((missionId) => [missionId, completer])),
    }));
    setRecognition(null);
    setUploadedName('');
    setUploadedFile(null);
    setStudentStep(7);
  }

  function resetStudentFlow() {
    setStudentStep(0);
    setStudentName('');
    setStudentCode('');
    setStudentJoinError('');
    setSelectedTeamIndex(0);
    setStudentTeamName(getDefaultTeamName(0));
    setActiveMissionIndex(0);
    setRecognition(null);
    setUploadedName('');
    setUploadedFile(null);
  }

  function restorePublishedActivity(entry: ActivityHistoryEntry) {
    setActivity(entry.activity);
    setActiveTheme(entry.activeTheme);
    setSelectedMuseum(entry.activity.museum);
    setArtifacts(entry.activity.artifacts);
    setSelectedArtifactIds(entry.activity.artifacts.map((artifact) => artifact.id));
    setSubject(entry.activity.subject);
    setGrade(entry.activity.grade);
    setDuration(entry.activity.duration);
    setTeamCount(entry.activity.teamCount);
    setStoryStyle(entry.activity.storyStyle);
    setGoal(entry.activity.goal);
    setTeacherStep(3);
    setPublishMessage(t(language, '已载入历史活动，可继续查看或重新发布。', 'A published activity has been loaded. You can review it or publish again.'));
  }

  async function copyPublishLink() {
    try {
      await copyTextToClipboard(buildActivityShareText(activity));
      setPublishMessage(t(language, '已复制活动码和学生入口。', 'The activity code and student entry link have been copied.'));
    } catch {
      setPublishMessage(t(language, '复制失败，请手动复制活动码。', 'Copy failed. Please copy the activity code manually.'));
    }
  }

  function exportReport() {
    const filename = `${activity.code}-report.html`;
    downloadFile(filename, buildReportHtml(activity, teamMembers, completedMissions, missionCompletions), 'text/html;charset=utf-8');
    setPublishMessage(t(language, '已导出可打印的课后复盘报告，可在浏览器中打开后另存为 PDF。', 'A printable review report has been exported. Open it in the browser and save it as PDF if needed.'));
  }

  return (
    <main className={`app-shell ${route}-app`}>
      <div className="global-controls">
        <LanguageToggle language={language} onChange={setLanguage} />
      </div>
      {route === 'home' ? (
        <LandingPage theme={activeTheme} language={language} onThemeChange={setActiveTheme} onNavigate={navigate} />
      ) : (
        <>
          <header className="topbar portal-topbar">
            <button className="brand" onClick={() => navigate('home')}>
              <span className="brand-mark">MX</span>
              <span>
                <strong>MUSEUMAX</strong>
                <small>{route === 'teacher' ? t(language, '老师工作台', 'Teacher Workspace') : t(language, '学生探险端', 'Student Explorer')}</small>
              </span>
            </button>
          </header>

          {route === 'teacher' ? (
            teacherAuthorized ? (
              <TeacherWorkspace
                step={teacherStep}
                setStep={setTeacherStep}
                query={query}
                setQuery={setQuery}
                museums={filteredMuseums}
                selectedMuseum={selectedMuseum}
                artifacts={artifacts}
                selectedArtifacts={selectedArtifacts}
                selectedArtifactIds={selectedArtifactIds}
                isLoadingArtifacts={isLoadingArtifacts}
                artifactLoadMessage={artifactLoadMessage}
                activity={activity}
                subject={subject}
                setSubject={setSubject}
                grade={grade}
                setGrade={setGrade}
                duration={duration}
                setDuration={setDuration}
                teamCount={teamCount}
                setTeamCount={setTeamCount}
                storyStyle={storyStyle}
                setStoryStyle={setStoryStyle}
                goal={goal}
                setGoal={setGoal}
                onSelectMuseum={selectMuseum}
                onSearchMuseumOnline={searchMuseumOnline}
                isSearchingMuseums={isSearchingMuseums}
                museumSearchError={museumSearchError}
                onReplaceArtifact={replaceArtifact}
                onRemoveArtifact={removeArtifact}
                onMoveArtifact={moveArtifact}
                onRegenerateArtifacts={regenerateArtifacts}
                onToggleArtifactSelection={toggleArtifactSelection}
                onSelectAllArtifacts={selectAllArtifacts}
                onClearArtifactSelection={clearArtifactSelection}
                onGenerateBackground={generateBackgroundStory}
                onGenerateMissions={generateMissionSequence}
                onGenerateSingleMission={generateSingleMissionCard}
                onPublishActivity={publishActivity}
                onCopyPublishLink={copyPublishLink}
                onExportReport={exportReport}
                publishMessage={publishMessage}
                teamMembers={teamMembers}
                completedMissions={completedMissions}
                missionCompletions={missionCompletions}
                missionVariant={missionVariant}
                isGeneratingText={isGeneratingText}
                generationStage={generationStage}
                generatingMissionId={generatingMissionId}
                generatedMissionIds={generatedMissionIds}
                hasReadyBackgroundForCurrentConfig={hasReadyBackgroundForCurrentConfig}
                hasReadyMissionsForCurrentConfig={hasReadyMissionsForCurrentConfig}
                activeTheme={activeTheme}
                activityHistory={activityHistory}
                onRestoreActivity={restorePublishedActivity}
                language={language}
              />
            ) : (
              <TeacherPasswordGate
                language={language}
                password={teacherPassword}
                setPassword={setTeacherPassword}
                error={teacherPasswordError}
                onSubmit={unlockTeacherPortal}
              />
            )
          ) : (
            <StudentWorkspace
          language={language}
          step={studentStep}
          setStep={setStudentStep}
          activity={activity}
          studentName={studentName}
          setStudentName={setStudentName}
          studentCode={studentCode}
          setStudentCode={setStudentCode}
          studentJoinError={studentJoinError}
          onJoin={joinActivity}
          selectedTeamIndex={selectedTeamIndex}
          setSelectedTeamIndex={setSelectedTeamIndex}
          studentTeamName={studentTeamName}
          setStudentTeamName={setStudentTeamName}
          teamMembers={teamMembers.filter((member) => member.teamIndex === selectedTeamIndex)}
          onConfirmTeam={confirmStudentTeam}
          currentMission={currentMission}
          activeMissionIndex={activeMissionIndex}
          setActiveMissionIndex={setActiveMissionIndex}
          completedMissions={completedMissions}
          missionCompletions={missionCompletions}
          progress={progress}
          recognition={recognition}
          uploadedName={uploadedName}
          isRecognizing={isRecognizing}
          onSelectPhoto={selectStudentPhoto}
          onSubmitPhoto={submitRecognition}
          onNextMission={goNextMission}
          onCompleteAllForTest={completeAllMissionsForTest}
          onResetStudentFlow={resetStudentFlow}
          activeTheme={activeTheme}
        />
          )}
        </>
      )}
    </main>
  );
}

function TeacherPasswordGate(props: {
  language: LanguageKey;
  password: string;
  setPassword: (value: string) => void;
  error: string;
  onSubmit: () => void;
}) {
  return (
    <section className="teacher-gate">
      <div className="teacher-gate-card">
        <small>{t(props.language, '老师端验证', 'Teacher Verification')}</small>
        <h1>{t(props.language, '请输入老师端密码', 'Enter the teacher password')}</h1>
        <p>{t(props.language, '为了避免学生误入或误操作，进入老师工作台前需要先进行一次密码验证。', 'To prevent students from entering by mistake, the teacher workspace requires password verification first.')}</p>
        <div className="join-form teacher-gate-form">
          <label>
            {t(props.language, '访问密码', 'Access password')}
            <input
              type="password"
              value={props.password}
              onChange={(event) => props.setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') props.onSubmit();
              }}
              placeholder={t(props.language, '输入老师端密码', 'Enter teacher password')}
            />
          </label>
        </div>
        {props.error && <div className="inline-alert">{props.error}</div>}
        <button className="primary-button" onClick={props.onSubmit}>{t(props.language, '进入老师端', 'Enter Teacher Portal')}</button>
      </div>
    </section>
  );
}

function LanguageToggle(props: {
  language: LanguageKey;
  onChange: (language: LanguageKey) => void;
}) {
  return (
    <div className="language-toggle" role="group" aria-label="Language switch">
      <button
        type="button"
        className={props.language === 'zh' ? 'active' : ''}
        onClick={() => props.onChange('zh')}
      >
        中文
      </button>
      <button
        type="button"
        className={props.language === 'en' ? 'active' : ''}
        onClick={() => props.onChange('en')}
      >
        EN
      </button>
    </div>
  );
}

function LandingPage({
  theme,
  language,
  onThemeChange,
  onNavigate,
}: {
  theme: ThemeKey;
  language: LanguageKey;
  onThemeChange: (theme: ThemeKey) => void;
  onNavigate: (route: AppRoute) => void;
}) {
  return (
    <section className="landing-page">
      <div className="landing-hero">
        <div className="hero-copy">
          <span className="brand-mark">MX</span>
          <small>{t(language, '学校研学版 MVP', 'School Field Trip MVP')}</small>
          <h1>MUSEUMAX</h1>
          <p>{t(language, '老师端负责课前策划、活动发布和复盘管理；学生端负责活动码加入、馆中探险、拍照识别和成果生成。', 'The teacher side handles planning, publishing, and review reports. The student side handles joining with an activity code, museum exploration, photo recognition, and outcome generation.')}</p>
        </div>
        <div className="theme-picker" aria-label={t(language, '首页视觉主题', 'Homepage visual themes')}>
          {homeThemes.map((item) => (
            <button
              key={item.id}
              className={theme === item.id ? 'active' : ''}
              onClick={() => onThemeChange(item.id)}
              type="button"
            >
              <i aria-hidden="true" />
              <span>
                <strong>{language === 'zh' ? item.name : getThemeName(item.id, language)}</strong>
                <small>{language === 'zh' ? item.tone : item.toneEn}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="portal-grid">
        <button className="portal-card teacher-card" onClick={() => onNavigate('teacher')}>
          <GraduationCap size={34} />
          <span>
            <small>Teacher Portal</small>
            <strong>{t(language, '进入老师端', 'Enter Teacher Portal')}</strong>
            <em>{t(language, '搜索博物馆、生成藏品任务、发布活动与查看报告', 'Search museums, generate artifact missions, publish activities, and review reports')}</em>
          </span>
          <ChevronRight size={22} />
        </button>
        <button className="portal-card student-card" onClick={() => onNavigate('student')}>
          <Compass size={34} />
          <span>
            <small>Student Portal</small>
            <strong>{t(language, '进入学生端', 'Enter Student Portal')}</strong>
            <em>{t(language, '从老师发布的活动码加入小队探险', 'Join a team adventure with the activity code published by the teacher')}</em>
          </span>
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  );
}

type TeacherWorkspaceProps = {
  language: LanguageKey;
  step: number;
  setStep: (step: number) => void;
  query: string;
  setQuery: (query: string) => void;
  museums: Museum[];
  selectedMuseum: Museum;
  artifacts: Artifact[];
  selectedArtifacts: Artifact[];
  selectedArtifactIds: string[];
  isLoadingArtifacts: boolean;
  artifactLoadMessage: string;
  activity: Activity;
  subject: string;
  setSubject: (subject: string) => void;
  grade: string;
  setGrade: (grade: string) => void;
  duration: number;
  setDuration: (duration: number) => void;
  teamCount: number;
  setTeamCount: (teamCount: number) => void;
  storyStyle: StoryStyle;
  setStoryStyle: (style: StoryStyle) => void;
  goal: string;
  setGoal: (goal: string) => void;
  onSelectMuseum: (museum: Museum) => void;
  onSearchMuseumOnline: () => void;
  isSearchingMuseums: boolean;
  museumSearchError: string;
  onReplaceArtifact: (artifactId: string) => void;
  onRemoveArtifact: (artifactId: string) => void;
  onMoveArtifact: (index: number, direction: -1 | 1) => void;
  onRegenerateArtifacts: () => void;
  onToggleArtifactSelection: (artifactId: string) => void;
  onSelectAllArtifacts: () => void;
  onClearArtifactSelection: () => void;
  onGenerateBackground: () => void;
  onGenerateMissions: () => void;
  onGenerateSingleMission: (missionId: string) => void;
  onPublishActivity: () => void;
  onCopyPublishLink: () => void;
  onExportReport: () => void;
  publishMessage: string;
  teamMembers: StudentTeamMember[];
  completedMissions: string[];
  missionCompletions: Record<string, string>;
  missionVariant: number;
  isGeneratingText: boolean;
  generationStage: 'idle' | 'background' | 'missions';
  generatingMissionId: string;
  generatedMissionIds: string[];
  hasReadyBackgroundForCurrentConfig: boolean;
  hasReadyMissionsForCurrentConfig: boolean;
  activeTheme: ThemeKey;
  activityHistory: ActivityHistoryEntry[];
  onRestoreActivity: (entry: ActivityHistoryEntry) => void;
};

function TeacherWorkspace(props: TeacherWorkspaceProps) {
  const steps = props.language === 'zh'
    ? ['选馆策划', '藏品推荐', '任务生成', '发布复盘']
    : ['Museum Plan', 'Artifacts', 'Mission Build', 'Publish & Review'];

  return (
    <section className="workspace">
      <aside className="sidebar">
        <div className="sidebar-title">
          <LayoutDashboard size={20} /> {t(props.language, '老师工作台', 'Teacher Workspace')}
        </div>
        {steps.map((label, index) => (
          <button key={label} className={props.step === index ? 'step active' : 'step'} onClick={() => props.setStep(index)}>
            <span>{index + 1}</span>
            {label}
          </button>
        ))}
        <div className="quick-card">
          <small>{t(props.language, '最近活动', 'Latest Activity')}</small>
          <strong>{props.activity.name}</strong>
          <p>{t(props.language, '发布后可在复盘页复制给学生', 'After publishing, you can copy it for students from the review page.')}</p>
        </div>
        <div className="history-card">
          <small>{t(props.language, '已发布活动', 'Published Activities')}</small>
          {props.activityHistory.length === 0 ? (
            <p>{t(props.language, '还没有发布记录，发布一次活动后会显示在这里。', 'No published activities yet. Once you publish one, it will appear here.')}</p>
          ) : (
            <div className="history-list">
              {props.activityHistory.slice(0, 4).map((entry) => (
                <button key={entry.id} className="history-item" onClick={() => props.onRestoreActivity(entry)}>
                  <strong>{entry.activity.name}</strong>
                  <span>{entry.activity.code}</span>
                  <small>{new Date(entry.publishedAt).toLocaleString(props.language === 'zh' ? 'zh-CN' : 'en-US', { hour12: false })}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="content-area">
        {props.step === 0 && <MuseumSearch {...props} />}
        {props.step === 1 && <ArtifactPlanner {...props} />}
        {props.step === 2 && <MissionGenerator {...props} />}
        {props.step === 3 && <PublishAndReport {...props} />}
      </div>
    </section>
  );
}

type WikiPage = {
  pageid: number;
  title: string;
  extract?: string;
  fullurl?: string;
  thumbnail?: { source?: string };
  coordinates?: { lat?: number; lon?: number }[];
  pageprops?: { wikibase_item?: string };
};

async function fetchMuseumDetails(keyword: string): Promise<Museum[]> {
  const sources = [
    { host: 'zh.wikipedia.org', language: 'zh', sourceName: 'Wikipedia 中文' },
    { host: 'en.wikipedia.org', language: 'en', sourceName: 'Wikipedia' },
  ];

  const exactSettledResults = await Promise.allSettled(
    sources.map((source) => fetchExactWikipediaMuseumDetails(source.host, source.language, source.sourceName, keyword)),
  );
  const exactResults = mergeMuseums(
    exactSettledResults.flatMap((result) => result.status === 'fulfilled' ? result.value : []),
    [],
  );
  if (exactResults.length > 0) return exactResults.slice(0, 1);

  const settledResults = await Promise.allSettled(
    sources.map((source) => fetchWikipediaMuseumSearchDetails(source.host, source.language, source.sourceName, keyword)),
  );

  const mergedResults = settledResults.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  const exactCandidate = mergedResults.find((museum) => isExactMuseumName(museum.name, keyword));
  if (exactCandidate) return [exactCandidate];

  return mergeMuseums(mergedResults, []).slice(0, 5);
}

async function fetchExactWikipediaMuseumDetails(host: string, language: string, sourceName: string, keyword: string): Promise<Museum[]> {
  const endpoint = new URL(`https://${host}/w/api.php`);
  endpoint.searchParams.set('origin', '*');
  endpoint.searchParams.set('action', 'query');
  endpoint.searchParams.set('titles', keyword);
  endpoint.searchParams.set('redirects', '1');
  endpoint.searchParams.set('prop', 'pageimages|extracts|coordinates|info|pageprops');
  endpoint.searchParams.set('inprop', 'url');
  endpoint.searchParams.set('exintro', '1');
  endpoint.searchParams.set('explaintext', '1');
  endpoint.searchParams.set('exsentences', '4');
  endpoint.searchParams.set('piprop', 'thumbnail');
  endpoint.searchParams.set('pithumbsize', '900');
  endpoint.searchParams.set('format', 'json');

  const pages = await fetchWikipediaPages(endpoint);
  return pages
    .filter((page) => !('missing' in page))
    .filter((page) => isExactMuseumName(page.title, keyword) && isMuseumLike(page.title, page.extract ?? '', language))
    .map((page) => mapWikiPageToMuseum(page, sourceName));
}

async function fetchWikipediaMuseumSearchDetails(host: string, language: string, sourceName: string, keyword: string): Promise<Museum[]> {
  const endpoint = new URL(`https://${host}/w/api.php`);
  endpoint.searchParams.set('origin', '*');
  endpoint.searchParams.set('action', 'query');
  endpoint.searchParams.set('generator', 'search');
  endpoint.searchParams.set('gsrsearch', buildMuseumSearchQuery(keyword, language));
  endpoint.searchParams.set('gsrlimit', '6');
  endpoint.searchParams.set('prop', 'pageimages|extracts|coordinates|info|pageprops');
  endpoint.searchParams.set('inprop', 'url');
  endpoint.searchParams.set('exintro', '1');
  endpoint.searchParams.set('explaintext', '1');
  endpoint.searchParams.set('exsentences', '3');
  endpoint.searchParams.set('piprop', 'thumbnail');
  endpoint.searchParams.set('pithumbsize', '800');
  endpoint.searchParams.set('format', 'json');

  const pages = await fetchWikipediaPages(endpoint);
  return pages
    .filter((page) => isMuseumLike(page.title, page.extract ?? '', language))
    .sort((left, right) => scoreMuseumResult(right, keyword) - scoreMuseumResult(left, keyword))
    .map((page) => mapWikiPageToMuseum(page, sourceName));
}

async function fetchWikipediaPages(endpoint: URL): Promise<WikiPage[]> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  const response = await fetch(endpoint.toString(), { signal: controller.signal });
  window.clearTimeout(timeoutId);
  if (!response.ok) throw new Error('museum search failed');
  const payload = await response.json() as {
    query?: {
      pages?: Record<string, WikiPage>;
    };
  };
  return Object.values(payload.query?.pages ?? {});
}

function mapWikiPageToMuseum(page: WikiPage, sourceName: string): Museum {
  const location = inferLocation(page.extract ?? '');
  return {
    id: `wiki-${page.pageid}`,
    name: page.title,
    country: location.country,
    city: location.city,
    summary: page.extract || '已找到公开百科信息，可进入详情后补充研学说明。',
    tags: inferTags(page.title, page.extract ?? ''),
    image: page.thumbnail?.source ?? 'https://images.unsplash.com/photo-1566127992631-137a642a90f4?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: page.fullurl,
    sourceName,
    wikidataId: page.pageprops?.wikibase_item,
  };
}

function isMuseumLike(title: string, extract: string, language: string) {
  const text = `${title} ${extract}`.toLowerCase();
  if (language === 'zh') return text.includes('博物馆') || text.includes('美术馆') || text.includes('纪念馆');
  return text.includes('museum') || text.includes('gallery');
}

function buildMuseumSearchQuery(keyword: string, language: string) {
  const normalizedKeyword = keyword.trim();
  const alreadyMuseumName = /museum|gallery|博物馆|美术馆|纪念馆/i.test(normalizedKeyword);
  if (alreadyMuseumName) return normalizedKeyword;
  return language === 'zh' ? `${normalizedKeyword} 博物馆` : `${normalizedKeyword} museum`;
}

function normalizeMuseumName(value: string) {
  return value
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[\s\-_.,，。'"“”‘’()（）:：]/g, '');
}

function isExactMuseumName(title: string, keyword: string) {
  return normalizeMuseumName(title) === normalizeMuseumName(keyword);
}

function scoreMuseumResult(page: WikiPage, keyword: string) {
  if (isExactMuseumName(page.title, keyword)) return 100;
  const normalizedTitle = normalizeMuseumName(page.title);
  const normalizedKeyword = normalizeMuseumName(keyword);
  if (normalizedTitle.startsWith(normalizedKeyword)) return 80;
  if (normalizedTitle.includes(normalizedKeyword)) return 60;
  const summary = normalizeMuseumName(page.extract ?? '');
  return summary.includes(normalizedKeyword) ? 30 : 0;
}

function getLocalMuseumFallback(keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return [];
  return museums
    .filter((museum) => [museum.name, museum.country, museum.city, museum.summary, ...museum.tags].join(' ').toLowerCase().includes(normalizedKeyword))
    .map((museum) => ({ ...museum, sourceName: '内置馆库' }));
}

function mergeMuseums(primary: Museum[], fallback: Museum[]) {
  const merged = new Map<string, Museum>();
  [...primary, ...fallback].forEach((museum) => {
    const key = `${museum.name}-${museum.city}`.toLowerCase();
    if (!merged.has(key)) merged.set(key, museum);
  });
  return [...merged.values()];
}

type WikidataArtifactBinding = {
  item: { value: string };
  itemLabel?: { value: string };
  image?: { value: string };
  inceptionLabel?: { value: string };
  creatorLabel?: { value: string };
  materialLabel?: { value: string };
  description?: { value: string };
};

type ArtifactSourceResult = {
  artifacts: Artifact[];
  message: string;
};

async function fetchTrustedArtifactsForMuseum(museum: Museum): Promise<ArtifactSourceResult> {
  if (isMetMuseum(museum)) {
    const metArtifacts = await fetchMetMuseumArtifacts();
    return {
      artifacts: metArtifacts,
      message: `已通过 The Metropolitan Museum of Art 官方开放 API 获取 ${metArtifacts.length} 件带图藏品。`,
    };
  }

  if (isClevelandMuseum(museum)) {
    const clevelandArtifacts = await fetchClevelandMuseumArtifacts();
    return {
      artifacts: clevelandArtifacts,
      message: `已通过 Cleveland Museum of Art Open Access API 获取 ${clevelandArtifacts.length} 件带图藏品。`,
    };
  }

  const curatedArtifacts = getArtifactsForMuseum(museum.id);
  const hasCuratedSet = curatedArtifacts.some((artifact) => artifact.sourceName);
  return {
    artifacts: curatedArtifacts,
    message: hasCuratedSet ? `已加载 ${museum.name} 的人工策划藏品清单，图片和来源按单件藏品校准。` : '暂未接入该馆官方馆藏接口，已使用人工策划示例藏品。',
  };
}

function isMetMuseum(museum: Museum) {
  return museum.id === 'met' || /metropolitan museum of art|大都会艺术博物馆/i.test(museum.name);
}

function isClevelandMuseum(museum: Museum) {
  return museum.id === 'cleveland' || /cleveland museum of art|克利夫兰艺术博物馆/i.test(museum.name);
}

type MetObject = {
  objectID: number;
  title: string;
  objectDate?: string;
  department?: string;
  artistDisplayName?: string;
  medium?: string;
  primaryImageSmall?: string;
  primaryImage?: string;
  objectURL?: string;
  culture?: string;
  classification?: string;
};

type ClevelandArtwork = {
  id: number;
  accession_number?: string;
  title: string;
  creation_date?: string;
  department?: string;
  culture?: string[];
  technique?: string;
  type?: string;
  tombstone?: string;
  wall_description?: string;
  images?: {
    web?: { url?: string };
    print?: { url?: string };
  };
  url?: string;
  creators?: Array<{ description?: string }>;
};

async function fetchMetMuseumArtifacts(): Promise<Artifact[]> {
  const searchEndpoint = new URL('https://collectionapi.metmuseum.org/public/collection/v1/search');
  searchEndpoint.searchParams.set('hasImages', 'true');
  searchEndpoint.searchParams.set('isHighlight', 'true');
  searchEndpoint.searchParams.set('q', 'art');

  const searchPayload = await fetchJsonWithTimeout<{ objectIDs?: number[] }>(searchEndpoint.toString(), 10000);
  const objectIds = (searchPayload.objectIDs ?? []).slice(0, 36);
  const objectResults = await Promise.allSettled(
    objectIds.map((objectId) => fetchJsonWithTimeout<MetObject>(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`, 10000)),
  );

  return objectResults
    .flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
    .filter((object) => object.title && (object.primaryImageSmall || object.primaryImage))
    .map((object) => ({
      id: `met-${object.objectID}`,
      name: object.title,
      era: object.objectDate || '年代待确认',
      gallery: object.department || 'Met Collection',
      summary: [object.artistDisplayName ? `作者/制作者：${object.artistDisplayName}` : '', object.medium ? `材料/媒介：${object.medium}` : '', object.culture ? `文化：${object.culture}` : ''].filter(Boolean).join('。') || '来自大都会艺术博物馆官方开放馆藏 API 的藏品。',
      educationTags: [object.classification || '艺术史', object.department || '馆藏研究'].slice(0, 2),
      image: object.primaryImageSmall || object.primaryImage || '',
      sourceUrl: object.objectURL,
      sourceName: 'The Met Collection API',
    }));
}

async function fetchClevelandMuseumArtifacts(): Promise<Artifact[]> {
  const endpoint = new URL('https://openaccess-api.clevelandart.org/api/artworks/');
  endpoint.searchParams.set('has_image', '1');
  endpoint.searchParams.set('limit', '30');
  endpoint.searchParams.set('cc0', '1');

  const payload = await fetchJsonWithTimeout<{ data?: ClevelandArtwork[] }>(endpoint.toString(), 10000);
  return (payload.data ?? [])
    .filter((artwork) => artwork.title && (artwork.images?.web?.url || artwork.images?.print?.url))
    .map((artwork) => {
      const creator = artwork.creators?.map((item) => item.description).filter(Boolean).join('；');
      const culture = artwork.culture?.filter(Boolean).join('、');
      const summary = [
        artwork.wall_description || artwork.tombstone,
        creator ? `作者/制作者：${creator}` : '',
        artwork.technique ? `材料/技法：${artwork.technique}` : '',
        culture ? `文化：${culture}` : '',
      ].filter(Boolean).join('。') || '来自克利夫兰艺术博物馆开放馆藏 API 的藏品。';

      return {
        id: `cleveland-${artwork.id}`,
        name: artwork.title,
        era: artwork.creation_date || '年代待确认',
        gallery: artwork.department || 'Cleveland Collection',
        summary,
        educationTags: [artwork.type || '艺术史', artwork.department || '开放馆藏'].slice(0, 2),
        image: artwork.images?.web?.url || artwork.images?.print?.url || '',
        sourceUrl: artwork.url,
        sourceName: 'Cleveland Museum of Art Open Access API',
      };
    });
}

async function fetchJsonWithTimeout<T>(url: string, timeout: number): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { signal: controller.signal });
  window.clearTimeout(timeoutId);
  if (!response.ok) throw new Error(`request failed: ${url}`);
  return response.json() as Promise<T>;
}

async function fetchMuseumCollectionArtifacts(museumWikidataId: string): Promise<Artifact[]> {
  const sparql = `
    SELECT DISTINCT ?item ?itemLabel ?image ?inceptionLabel ?creatorLabel ?materialLabel ?description WHERE {
      VALUES ?museum { wd:${museumWikidataId} }
      {
        ?item wdt:P195 ?museum.
      } UNION {
        ?item wdt:P276 ?museum.
      } UNION {
        ?item wdt:P127 ?museum.
      }
      ?item wdt:P18 ?image.
      OPTIONAL { ?item wdt:P571 ?inception. }
      OPTIONAL { ?item wdt:P170 ?creator. }
      OPTIONAL { ?item wdt:P186 ?material. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "zh,en". }
      OPTIONAL {
        ?item schema:description ?description.
        FILTER(LANG(?description) = "zh" || LANG(?description) = "en")
      }
    }
    LIMIT 12
  `;
  const endpoint = new URL('https://query.wikidata.org/sparql');
  endpoint.searchParams.set('query', sparql);
  endpoint.searchParams.set('format', 'json');

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10000);
  const response = await fetch(endpoint.toString(), {
    signal: controller.signal,
    headers: { Accept: 'application/sparql-results+json' },
  });
  window.clearTimeout(timeoutId);
  if (!response.ok) throw new Error('collection search failed');

  const payload = await response.json() as { results?: { bindings?: WikidataArtifactBinding[] } };
  return (payload.results?.bindings ?? [])
    .filter((binding) => binding.itemLabel?.value && binding.image?.value)
    .map((binding, index) => mapWikidataBindingToArtifact(binding, index))
    .slice(0, 10);
}

function mapWikidataBindingToArtifact(binding: WikidataArtifactBinding, index: number): Artifact {
  const itemId = binding.item.value.split('/').pop() ?? `artifact-${index}`;
  const creator = binding.creatorLabel?.value;
  const material = binding.materialLabel?.value;
  const description = binding.description?.value;
  const summaryParts = [description, creator ? `作者/制作者：${creator}` : '', material ? `材料：${material}` : ''].filter(Boolean);

  return {
    id: `wikidata-${itemId}`,
    name: binding.itemLabel?.value ?? `公开藏品 ${index + 1}`,
    era: binding.inceptionLabel?.value ?? '年代待确认',
    gallery: '公开馆藏',
    summary: summaryParts.join('。') || '来自公开知识库的馆藏条目，可用于研学任务初筛。',
    educationTags: inferTags(binding.itemLabel?.value ?? '', summaryParts.join(' ')),
    image: binding.image?.value ?? 'https://images.unsplash.com/photo-1566127992631-137a642a90f4?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: `https://www.wikidata.org/wiki/${itemId}`,
    sourceName: 'Wikidata',
  };
}

function inferLocation(text: string) {
  const inMatch = text.match(/\bin\s+([A-Z][A-Za-z .'-]+?)(?:,|\.|\s+and\s+|\s+is\s+)/);
  const city = inMatch?.[1]?.trim() || '待补充城市';
  const countryMatch = text.match(/\b(China|United Kingdom|France|United States|Italy|Japan|Spain|Germany|Egypt|Greece|Netherlands)\b/);
  return { city, country: countryMatch?.[1] || '待补充国家' };
}

function inferTags(title: string, extract: string) {
  const text = `${title} ${extract}`.toLowerCase();
  const tags = [
    ['art', '艺术'],
    ['history', '历史'],
    ['science', '科学'],
    ['natural', '自然'],
    ['archaeology', '考古'],
    ['culture', '文化'],
    ['design', '设计'],
  ]
    .filter(([key]) => text.includes(key))
    .map(([, label]) => label);
  return tags.length ? tags.slice(0, 4) : ['博物馆', '研学资源'];
}

function MuseumSearch({ language, query, setQuery, museums, selectedMuseum, onSelectMuseum, onSearchMuseumOnline, isSearchingMuseums, museumSearchError }: TeacherWorkspaceProps) {
  return (
    <div className="screen-grid two-columns">
      <section className="panel wide-panel">
        <div className="section-heading">
          <span><Search size={20} /> {t(language, '全球博物馆搜索', 'Global Museum Search')}</span>
          <small>{t(language, '输入关键词后点击搜索，可联网获取公开博物馆详情', 'Search with a keyword to fetch public museum details online')}</small>
        </div>
        <div className="search-row">
          <label className="searchbox">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(language, '搜索：大英博物馆、Shanghai Museum、古埃及...', 'Search: British Museum, Shanghai Museum, Ancient Egypt...')} />
          </label>
          <button className="primary-button search-button" onClick={onSearchMuseumOnline} disabled={isSearchingMuseums}>
            {isSearchingMuseums ? <RefreshCw size={18} className="spin" /> : <Search size={18} />}
            {isSearchingMuseums ? t(language, '搜索中', 'Searching') : t(language, '联网搜索', 'Search Online')}
          </button>
        </div>
        {museumSearchError && <div className="inline-alert">{museumSearchError}</div>}
        <div className="museum-list">
          {museums.map((museum) => (
            <button key={museum.id} className="museum-card" onClick={() => onSelectMuseum(museum)}>
              <img src={museum.image} alt="" />
              <span>
                <strong>{museum.name}</strong>
                <small><MapPin size={14} /> {museum.country} / {museum.city}</small>
                <p>{museum.summary}</p>
                <em>{museum.tags.join(' · ')}{museum.sourceName ? ` · 来源：${museum.sourceName}` : ''}</em>
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="panel selected-museum">
        <div>
          <small>{t(language, '当前策划对象', 'Current Museum')}</small>
          <h1>{selectedMuseum.name}</h1>
          <p>{selectedMuseum.summary}</p>
          <div className="tag-row">{selectedMuseum.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          {selectedMuseum.sourceUrl && <a className="source-link" href={selectedMuseum.sourceUrl} target="_blank" rel="noreferrer">{t(language, '查看公开来源', 'View Public Source')}</a>}
        </div>
      </section>
    </div>
  );
}

function ArtifactPlanner(props: TeacherWorkspaceProps) {
  return (
    <section className="panel">
      <div className="section-heading split-heading">
        <span><Sparkles size={20} /> {t(props.language, 'AI 代表藏品推荐', 'AI Artifact Recommendations')}</span>
        <div className="toolbar-actions">
          <button className="ghost-button" onClick={props.onSelectAllArtifacts}>{t(props.language, '全选', 'Select All')}</button>
          <button className="ghost-button" onClick={props.onClearArtifactSelection}>{t(props.language, '清空', 'Clear')}</button>
          <button className="ghost-button" onClick={props.onRegenerateArtifacts}><RefreshCw size={17} /> {t(props.language, '重新生成', 'Refresh')}</button>
        </div>
      </div>
      {props.artifactLoadMessage && (
        <div className={props.isLoadingArtifacts ? 'inline-status loading' : 'inline-status'}>
          {props.isLoadingArtifacts && <RefreshCw size={17} className="spin" />}
          {props.artifactLoadMessage}
        </div>
      )}
      <div className="selection-summary">
        {t(props.language, '当前展示', 'Showing')} <strong>{props.artifacts.length}</strong> {t(props.language, '件馆藏；已选择', 'artifacts; selected')} <strong>{props.selectedArtifactIds.length}</strong> {t(props.language, '件用于生成任务，需保持 5-10 件', 'for mission generation. Keep 5-10 selected.')}
      </div>
      <div className="planner-note-row">
        <div className="helper-card">
          <strong>{t(props.language, '当前策展范围', 'Current Curation Scope')}</strong>
          <span>{props.selectedMuseum.name}</span>
          <small>{props.language === 'zh' ? `${props.selectedMuseum.city} · ${props.selectedMuseum.country}` : `${props.selectedMuseum.city} · ${props.selectedMuseum.country}`}</small>
        </div>
        <div className="helper-card">
          <strong>{t(props.language, '选品规则', 'Selection Rule')}</strong>
          <span>{t(props.language, '建议保留最能支撑教学目标的 5-10 件藏品', 'Keep 5-10 artifacts that best support the learning goal')}</span>
          <small>{t(props.language, '被勾选的顺序也会影响后续任务生成顺序', 'The checked order also affects later mission generation order')}</small>
        </div>
      </div>
      <div className="planner-top-actions">
        <button className="primary-button" onClick={() => props.setStep(2)} disabled={props.selectedArtifactIds.length < MIN_SELECTED_ARTIFACTS || props.selectedArtifactIds.length > MAX_SELECTED_ARTIFACTS}>
          {t(props.language, '进入任务生成', 'Go To Mission Builder')} <ChevronRight size={18} />
        </button>
      </div>
      <div className="artifact-grid">
        {props.artifacts.map((artifact, index) => (
          <article className={props.selectedArtifactIds.includes(artifact.id) ? 'artifact-card selected' : 'artifact-card'} key={artifact.id}>
            {props.selectedArtifactIds.includes(artifact.id) && (
              <span className="artifact-order-badge">
                {props.language === 'zh' ? `序 ${props.selectedArtifactIds.indexOf(artifact.id) + 1}` : `#${props.selectedArtifactIds.indexOf(artifact.id) + 1}`}
              </span>
            )}
            <label className="artifact-select">
              <input
                type="checkbox"
                checked={props.selectedArtifactIds.includes(artifact.id)}
                onChange={() => props.onToggleArtifactSelection(artifact.id)}
              />
              <span>{t(props.language, '用于任务', 'For Missions')}</span>
            </label>
            <img src={artifact.image} alt="" />
            <div>
              <small>{artifact.era} · {artifact.gallery}</small>
              <h3>{artifact.name}</h3>
              <p>{artifact.summary}</p>
              <div className="tag-row compact">{artifact.educationTags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              {artifact.sourceUrl && <a className="source-link artifact-source" href={artifact.sourceUrl} target="_blank" rel="noreferrer">{t(props.language, '来源：', 'Source: ')}{artifact.sourceName}</a>}
            </div>
            <footer>
              <button title={t(props.language, '上移', 'Move up')} onClick={() => props.onMoveArtifact(index, -1)}>↑</button>
              <button title={t(props.language, '下移', 'Move down')} onClick={() => props.onMoveArtifact(index, 1)}>↓</button>
              <button title={t(props.language, '替换藏品', 'Replace artifact')} onClick={() => props.onReplaceArtifact(artifact.id)}><RefreshCw size={16} /></button>
              <button title={t(props.language, '删除藏品', 'Remove artifact')} onClick={() => props.onRemoveArtifact(artifact.id)}><Trash2 size={16} /></button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function MissionGenerator(props: TeacherWorkspaceProps) {
  const previewMatchesSelection = props.activity.artifacts.length === props.selectedArtifacts.length
    && props.activity.artifacts.every((artifact, index) => artifact.id === props.selectedArtifacts[index]?.id);
  const previewMissions = previewMatchesSelection ? props.activity.missions : [];
  const hasRenderablePreview = previewMissions.some((mission) => mission.story.trim() || mission.requirement.trim() || mission.hint.trim());
  const hasBackgroundStory = props.activity.backgroundStory.some((paragraph) => paragraph.trim());
  const isGeneratingBackground = props.isGeneratingText && props.generationStage === 'background';
  const generatedMissionSet = new Set(props.generatedMissionIds);
  const readyMissionCount = previewMissions.filter((mission) => generatedMissionSet.has(mission.id)).length;
  const feedbackClassName = props.publishMessage
    ? isGenerationFeedbackError(props.publishMessage)
      ? 'inline-alert'
      : 'inline-status'
    : '';

  return (
    <div className="screen-grid planner-grid">
      <section className="panel settings-panel">
        <div className="section-heading">
          <span><ClipboardList size={20} /> {t(props.language, '任务参数', 'Mission Settings')}</span>
          <small>{t(props.language, '根据年级、学科、时长和故事风格生成', 'Generate from grade, subject, duration, and story style')}</small>
        </div>
        <div className="settings-overview">
          <div className="helper-card">
            <strong>{t(props.language, '策划对象', 'Museum')}</strong>
            <span>{props.selectedMuseum.name}</span>
          </div>
          <div className="helper-card">
            <strong>{t(props.language, '已选藏品', 'Selected Artifacts')}</strong>
            <span>{props.selectedArtifactIds.length}</span>
          </div>
          <div className="helper-card">
            <strong>{t(props.language, '叙事风格', 'Narrative Style')}</strong>
            <span>{getStoryStyleName(props.storyStyle, props.language)}</span>
          </div>
        </div>
        <label>{t(props.language, '年级', 'Grade')}<input value={props.grade} onChange={(event) => props.setGrade(event.target.value)} /></label>
        <label>{t(props.language, '学科', 'Subject')}<input value={props.subject} onChange={(event) => props.setSubject(event.target.value)} /></label>
        <label>{t(props.language, '活动时长', 'Duration')}<input type="number" value={props.duration} onChange={(event) => props.setDuration(Number(event.target.value))} /></label>
        <label>{t(props.language, '分成几个小队', 'Number of Teams')}<input type="number" min="1" max="12" value={props.teamCount} onChange={(event) => props.setTeamCount(Math.max(1, Math.min(12, Number(event.target.value) || 1)))} /></label>
        <label>{t(props.language, '教学目标', 'Learning Goal')}<textarea value={props.goal} onChange={(event) => props.setGoal(event.target.value)} /></label>
        <div className="segmented">
          {storyStyles.map((style) => (
            <button key={style} className={props.storyStyle === style ? 'active' : ''} onClick={() => props.setStoryStyle(style)}>{getStoryStyleName(style, props.language)}</button>
          ))}
        </div>
        <div className="stack-actions">
          <button className="ghost-button full" onClick={props.onGenerateBackground} disabled={props.isGeneratingText}>
            <BookOpen size={18} /> {isGeneratingBackground
              ? t(props.language, '背景生成中', 'Generating Prologue')
              : props.hasReadyBackgroundForCurrentConfig
                ? t(props.language, '重新生成背景故事', 'Regenerate Prologue')
                : t(props.language, '先生成背景故事', 'Generate Prologue First')}
          </button>
        </div>
        <div className="microcopy">
          {props.hasReadyBackgroundForCurrentConfig
            ? props.hasReadyMissionsForCurrentConfig
              ? t(props.language, '当前参数下的背景故事和任务卡都已准备好，可继续微调或直接发布。', 'The current prologue and mission cards are ready. You can refine them or publish now.')
              : t(props.language, '背景故事已经准备好。现在请在右侧逐张生成任务卡。', 'The prologue is ready. Generate mission cards one by one on the right.')
            : t(props.language, '先生成这一轮的背景故事，再到右侧逐张生成任务卡。', 'Generate the prologue first, then create mission cards one by one on the right.')}
        </div>
        {props.publishMessage && <div className={feedbackClassName}>{props.publishMessage}</div>}
      </section>
      <section className="panel mission-list">
        <div className="section-heading">
          <span><BookOpen size={20} /> {t(props.language, '任务卡预览', 'Mission Preview')}</span>
          <small>{props.language === 'zh' ? `${previewMissions.length} 个关卡 · 已生成 ${readyMissionCount} 张` : `${previewMissions.length} missions · ${readyMissionCount} ready`}</small>
        </div>
        {hasBackgroundStory && (
          <article className="mission-card background-card">
            <small>{t(props.language, '冒险背景', 'Adventure Prologue')}</small>
            <h3>{getThemeName(props.activeTheme, props.language)}{t(props.language, '主题序章', ' Prologue')}</h3>
            {props.activity.backgroundStory.map((paragraph, index) => <p key={`background-${index}`}>{paragraph}</p>)}
          </article>
        )}
        {!previewMissions.length ? (
          <div className={props.isGeneratingText ? 'inline-status loading' : feedbackClassName || 'inline-status'}>
            {props.isGeneratingText
              ? t(props.language, 'AI 正在生成背景故事，请稍候。', 'AI is generating the prologue. Please wait.')
              : isGenerationFeedbackError(props.publishMessage)
                ? t(props.language, '这一轮还没有可展示的任务卡，请先生成背景故事。', 'There are no previewable mission cards yet. Generate the prologue first.')
                : t(props.language, '生成背景故事后，这里会出现逐张生成的任务卡。', 'Mission cards will appear here after the prologue is generated.')}
          </div>
        ) : (
          <>
            {previewMissions.map((mission) => (
              <article className="mission-card" key={mission.id}>
                <h3>{mission.title}</h3>
                {generatedMissionSet.has(mission.id) ? (
                  <>
                    <p>{mission.story}</p>
                    <dl>
                      <div><dt>{t(props.language, '文物自述', 'Artifact Voice')}</dt><dd>{mission.selfIntro}</dd></div>
                      <div><dt>{t(props.language, '学生任务', 'Student Task')}</dt><dd>{mission.requirement}</dd></div>
                      <div><dt>{t(props.language, '提交', 'Submission')}</dt><dd>{mission.submission}</dd></div>
                      <div><dt>{t(props.language, '谜题线索', 'Clues')}</dt><dd>{mission.hint}</dd></div>
                      <div><dt>{t(props.language, '教师提示', 'Teacher Note')}</dt><dd>{mission.teacherNote}</dd></div>
                      <div><dt>{t(props.language, '教师答案', 'Teacher Answer')}</dt><dd>{mission.answer}</dd></div>
                    </dl>
                  </>
                ) : (
                  <div className="mission-card-empty">
                    <p>{t(props.language, '这张任务卡还没有生成。点击下方按钮后，再为这一件展品单独生成。', 'This mission card has not been generated yet. Use the button below to create it for this artifact only.')}</p>
                  </div>
                )}
                <div className="mission-card-actions">
                  <button
                    className="primary-button"
                    onClick={() => props.onGenerateSingleMission(mission.id)}
                    disabled={props.isGeneratingText || !props.hasReadyBackgroundForCurrentConfig}
                  >
                    <Sparkles size={18} />
                    {props.generatingMissionId === mission.id
                      ? t(props.language, '生成中', 'Generating')
                      : generatedMissionSet.has(mission.id)
                        ? t(props.language, '重新生成这张卡', 'Regenerate This Card')
                        : t(props.language, '生成这张任务卡', 'Generate This Card')}
                  </button>
                </div>
              </article>
            ))}
          </>
        )}
        <button className="primary-button" onClick={props.onPublishActivity} disabled={!readyMissionCount || props.isGeneratingText}><Send size={18} /> {t(props.language, '发布活动', 'Publish Activity')}</button>
      </section>
    </div>
  );
}

function PublishAndReport(props: TeacherWorkspaceProps) {
  const completionRate = props.activity.missions.length > 0 ? Math.round((props.completedMissions.length / props.activity.missions.length) * 100) : 0;
  const teamNames = Array.from(new Set(props.teamMembers.map((member) => member.teamName)));

  return (
    <div className="screen-grid two-columns">
      <section className="panel publish-panel">
        <div className="section-heading">
          <span><Flag size={20} /> {t(props.language, '活动发布', 'Publish Activity')}</span>
          <small>{t(props.language, '学生可使用活动码加入', 'Students can join with the activity code')}</small>
        </div>
        <div className="code-box">{props.activity.code}</div>
        {props.publishMessage && <div className="inline-status">{props.publishMessage}</div>}
        <div className="publish-hint">
          {t(props.language, '建议老师现场投屏活动码，学生可直接在手机端加入。', 'Recommended: project this activity code in class so students can join directly on mobile.')}
        </div>
        <div className="summary-grid">
          <Metric label={t(props.language, '活动名称', 'Activity')} value={props.activity.name} />
          <Metric label={t(props.language, '班级', 'Class')} value={props.activity.className} />
          <Metric label={t(props.language, '分组', 'Teams')} value={props.language === 'zh' ? `${props.activity.teamCount} 个小队 · 每队 ${props.activity.teamSize} 人` : `${props.activity.teamCount} teams · ${props.activity.teamSize} students each`} />
          <Metric label={t(props.language, '关卡', 'Missions')} value={props.language === 'zh' ? `${props.activity.missions.length} 个` : `${props.activity.missions.length}`} />
        </div>
        <button className="primary-button full" onClick={props.onCopyPublishLink}><Send size={18} /> {t(props.language, '复制发布链接', 'Copy Share Link')}</button>
      </section>
      <section className="panel report-panel">
        <div className="section-heading split-heading">
          <span><FileText size={20} /> {t(props.language, '课后复盘报告', 'Review Report')}</span>
          <button className="ghost-button" onClick={props.onExportReport}><Download size={17} /> {t(props.language, '导出', 'Export')}</button>
        </div>
        <div className="summary-grid">
          <Metric label={t(props.language, '班级完成率', 'Completion Rate')} value={`${completionRate}%`} />
          <Metric label={t(props.language, '参与人数', 'Participants')} value={`${props.teamMembers.length}`} />
          <Metric label={t(props.language, '识别成功', 'Successful Matches')} value={`${props.completedMissions.length}`} />
          <Metric label={t(props.language, '人工判定', 'Manual Review')} value="0" />
        </div>
        <div className="rank-list">
          {(teamNames.length > 0 ? teamNames : [t(props.language, '暂无小队数据', 'No team data yet')]).map((team, index) => (
            <div key={team}><strong>{index + 1}. {team}</strong><span>{teamNames.length > 0 ? (props.language === 'zh' ? `${Math.max(0, completionRate - index * 5)} 分` : `${Math.max(0, completionRate - index * 5)} pts`) : t(props.language, '待生成', 'Pending')}</span></div>
          ))}
        </div>
        <div className="published-list-block">
          <small>{t(props.language, '最近发布', 'Recently Published')}</small>
          {props.activityHistory.length === 0 ? (
            <div className="empty-state compact">{t(props.language, '发布活动后，这里会保留最近的活动记录。', 'After publishing an activity, the most recent records will stay here.')}</div>
          ) : (
            <div className="published-list">
              {props.activityHistory.slice(0, 3).map((entry) => (
                <button key={entry.id} className="published-item" onClick={() => props.onRestoreActivity(entry)}>
                  <strong>{entry.activity.name}</strong>
                  <span>{entry.activity.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

type StudentWorkspaceProps = {
  language: LanguageKey;
  step: number;
  setStep: (step: number) => void;
  activity: Activity;
  studentName: string;
  setStudentName: (name: string) => void;
  studentCode: string;
  setStudentCode: (code: string) => void;
  studentJoinError: string;
  onJoin: () => void;
  selectedTeamIndex: number;
  setSelectedTeamIndex: (index: number) => void;
  studentTeamName: string;
  setStudentTeamName: (name: string) => void;
  teamMembers: StudentTeamMember[];
  onConfirmTeam: () => void;
  currentMission: Mission;
  activeMissionIndex: number;
  setActiveMissionIndex: (index: number) => void;
  completedMissions: string[];
  missionCompletions: Record<string, string>;
  progress: number;
  recognition: RecognitionResult | null;
  uploadedName: string;
  isRecognizing: boolean;
  onSelectPhoto: (file: File | null) => void;
  onSubmitPhoto: () => void;
  onNextMission: () => void;
  onCompleteAllForTest: () => void;
  onResetStudentFlow: () => void;
  activeTheme: ThemeKey;
};

function StudentWorkspace(props: StudentWorkspaceProps) {
  return (
    <section className="student-shell">
      {props.step === 0 && <JoinActivity {...props} />}
      {props.step === 1 && <TeamSetup {...props} />}
      {props.step === 2 && <OpeningStory {...props} />}
      {props.step === 3 && <StudentDashboard {...props} />}
      {props.step === 4 && <MissionDetail {...props} />}
      {props.step === 5 && <RecognitionPage {...props} />}
      {props.step === 6 && <TeamPage {...props} />}
      {props.step === 7 && <AchievementPage {...props} />}
    </section>
  );
}

function JoinActivity(props: StudentWorkspaceProps) {
  return (
    <section className="student-hero">
      <div>
        <small>{t(props.language, '学生加入', 'Student Join')}</small>
        <h1>{t(props.language, '输入活动码，进入小队探险', 'Enter the activity code to join the team adventure')}</h1>
        <p>{props.language === 'zh' ? `${props.activity.name} 已准备好，请输入老师发布的活动码。` : `${props.activity.name} is ready. Enter the activity code shared by the teacher.`}</p>
        <div className="activity-fact-row">
          <div className="fact-pill"><strong>{t(props.language, '博物馆', 'Museum')}</strong><span>{props.activity.museum.name}</span></div>
          <div className="fact-pill"><strong>{t(props.language, '任务', 'Missions')}</strong><span>{props.activity.missions.length}</span></div>
          <div className="fact-pill"><strong>{t(props.language, '分组', 'Teams')}</strong><span>{props.activity.teamCount}</span></div>
        </div>
        <div className="join-form">
          <label>
            {t(props.language, '你的名字', 'Your Name')}
            <input value={props.studentName} onChange={(event) => props.setStudentName(event.target.value)} placeholder={t(props.language, '输入姓名', 'Enter your name')} />
          </label>
          <label className="join-box">
            <input value={props.studentCode} onChange={(event) => props.setStudentCode(event.target.value.toUpperCase())} onKeyDown={(event) => {
              if (event.key === 'Enter' && props.studentName.trim() && props.studentCode.trim()) props.onJoin();
            }} placeholder={t(props.language, '输入活动码', 'Enter activity code')} />
            <button onClick={props.onJoin} disabled={!props.studentName.trim() || !props.studentCode.trim()}><ChevronRight size={20} /></button>
          </label>
        </div>
        {props.studentJoinError && <div className="inline-alert">{props.studentJoinError}</div>}
      </div>
    </section>
  );
}

function TeamSetup(props: StudentWorkspaceProps) {
  return (
    <section className="panel team-setup-panel">
      <div className="section-heading">
        <span><Users size={20} /> {t(props.language, '选择小队', 'Choose Team')}</span>
        <small>{props.language === 'zh' ? `${props.studentName}同学，本次活动共 ${props.activity.teamCount} 个小队，每队建议 ${props.activity.teamSize} 人` : `${props.studentName}, this activity has ${props.activity.teamCount} teams and suggests ${props.activity.teamSize} students per team.`}</small>
      </div>
      <div className="team-summary-strip">
        <div className="helper-card">
          <strong>{t(props.language, '你当前加入', 'You are joining')}</strong>
          <span>{props.studentName || '-'}</span>
        </div>
        <div className="helper-card">
          <strong>{t(props.language, '建议队伍规模', 'Suggested Size')}</strong>
          <span>{props.language === 'zh' ? `${props.activity.teamSize} 人` : `${props.activity.teamSize} students`}</span>
        </div>
      </div>
      <div className="team-choice-grid">
        {Array.from({ length: props.activity.teamCount }, (_, index) => (
          <button
            key={index}
            className={props.selectedTeamIndex === index ? 'team-choice active' : 'team-choice'}
            onClick={() => {
              props.setSelectedTeamIndex(index);
              props.setStudentTeamName(getDefaultTeamName(index));
            }}
          >
            <strong>{props.language === 'zh' ? `第 ${index + 1} 小队` : `Team ${index + 1}`}</strong>
            <span>{getDefaultTeamName(index)}</span>
          </button>
        ))}
      </div>
      <label className="team-name-field">
        {t(props.language, '小队名称', 'Team Name')}
        <input value={props.studentTeamName} onChange={(event) => props.setStudentTeamName(event.target.value)} placeholder={t(props.language, '为你的小队起个名字', 'Give your team a name')} />
      </label>
      <button className="primary-button" onClick={props.onConfirmTeam} disabled={!props.studentTeamName.trim()}>
        {t(props.language, '确认小队', 'Confirm Team')} <ChevronRight size={18} />
      </button>
    </section>
  );
}

function OpeningStory(props: StudentWorkspaceProps) {
  const backgroundParagraphs = props.activity.backgroundStory.length > 0
    ? props.activity.backgroundStory
    : buildActivityBackgroundStory(props.activity.museum, props.activity.artifacts, props.activity.storyStyle, props.activity.grade, props.activity.subject, props.activity.goal, props.activeTheme, props.language);
  const teamLead = buildTeamOpeningStory(props.activity, props.studentTeamName, props.teamMembers);

  return (
    <section className="panel story-panel">
      <small>{getThemeName(props.activeTheme, props.language)}{t(props.language, '主题背景', ' Theme Background')}</small>
      <h1>{props.language === 'zh' ? `${props.studentTeamName}，你们将从这段故事出发` : `${props.studentTeamName}, your adventure begins with this story`}</h1>
      <div className="story-meta-row">
        <span>{props.activity.museum.name}</span>
        <span>{props.language === 'zh' ? `${props.activity.missions.length} 个任务` : `${props.activity.missions.length} missions`}</span>
        <span>{props.activity.goal}</span>
      </div>
      {backgroundParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      <p>{teamLead}</p>
      <div className="team-strip">
        {props.teamMembers.map((member) => <span key={member.id}>{member.name} · {member.role}</span>)}
      </div>
      <button className="primary-button" onClick={() => props.setStep(3)}><Compass size={18} /> {t(props.language, '开始任务', 'Start Missions')}</button>
    </section>
  );
}

function StudentDashboard(props: StudentWorkspaceProps) {
  const activeMission = props.activity.missions[props.activeMissionIndex] ?? props.currentMission;
  return (
    <section className="panel dashboard-panel">
      <div className="section-heading split-heading">
        <span><Compass size={20} /> {props.language === 'zh' ? `${props.studentName}的任务主页` : `${props.studentName}'s Mission Hub`}</span>
        <button className="ghost-button" onClick={() => props.setStep(6)}><Users size={17} /> {t(props.language, '小队', 'Team')}</button>
      </div>
      <div className="progress-card">
        <div><strong>{props.progress}%</strong><span>{t(props.language, '总进度', 'Progress')}</span></div>
        <div className="progress-track"><i style={{ width: `${props.progress}%` }} /></div>
      </div>
      <div className="focus-card">
        <small>{t(props.language, '当前焦点任务', 'Current Focus')}</small>
        <strong>{activeMission.title}</strong>
        <p>{activeMission.story}</p>
        <div className="focus-meta">
          <span>{activeMission.minutes}{t(props.language, ' 分钟', ' min')}</span>
          <span>{props.language === 'zh' ? `已完成 ${props.completedMissions.length}/${props.activity.missions.length}` : `${props.completedMissions.length}/${props.activity.missions.length} done`}</span>
        </div>
      </div>
      <div className="mission-map">
        {props.activity.missions.length === 0 ? (
          <div className="empty-state">{t(props.language, '当前还没有可执行任务，请先回到老师端发布活动。', 'There are no playable missions yet. Please return to the teacher side and publish an activity first.')}</div>
        ) : (
          props.activity.missions.map((mission, index) => (
            <button
              key={mission.id}
              className={props.completedMissions.includes(mission.id) ? 'done' : index === props.activeMissionIndex ? 'current' : ''}
              onClick={() => {
                props.setActiveMissionIndex(index);
                props.setStep(4);
              }}
            >
              <span className="mission-title-row">
                {props.completedMissions.includes(mission.id) && <Check size={18} />}
                <strong>{mission.title}</strong>
                <small>{props.missionCompletions[mission.id] ? (props.language === 'zh' ? `完成者：${props.missionCompletions[mission.id]}` : `Completed by: ${props.missionCompletions[mission.id]}`) : t(props.language, '尚未完成', 'Not completed yet')}</small>
              </span>
            </button>
          ))
        )}
      </div>
      <button className="primary-button" onClick={() => props.setStep(4)}>{t(props.language, '进入已选关卡', 'Open Selected Mission')} <ChevronRight size={18} /></button>
      <button className="ghost-button full test-shortcut" onClick={props.onCompleteAllForTest}>
        <Check size={17} /> {t(props.language, '测试直达成果', 'Test: Jump To Ending')}
      </button>
    </section>
  );
}

function MissionDetail(props: StudentWorkspaceProps) {
  return (
    <section className="mission-detail">
      <article className="panel detail-copy">
        <small>{t(props.language, '当前关卡', 'Current Mission')}</small>
        <h1>{props.currentMission.title}</h1>
        <div className="detail-meta-row">
          <span>{props.language === 'zh' ? `${props.activeMissionIndex + 1} / ${props.activity.missions.length} 关` : `Mission ${props.activeMissionIndex + 1} / ${props.activity.missions.length}`}</span>
          <span>{props.currentMission.minutes}{t(props.language, ' 分钟', ' min')}</span>
          <span>{props.activity.artifacts.find((artifact) => artifact.id === props.currentMission.artifactId)?.gallery ?? props.activity.museum.name}</span>
        </div>
        <p>{props.currentMission.story}</p>
        <div className="hint-box"><Star size={18} /> {props.currentMission.selfIntro}</div>
        <div className="task-box"><strong>{t(props.language, '任务要求', 'Task')}</strong>{props.currentMission.requirement}</div>
        <div className="hint-box"><ShieldCheck size={18} /> {props.currentMission.hint}</div>
      </article>
      <article className="panel camera-panel">
        <div className="hint-box"><ShieldCheck size={18} /> {t(props.language, '目标展品不会在任务卡中直接展示。请根据谜面、展厅和展签信息自行定位。', 'The target artifact is not named directly on the card. Use the clues, gallery, and label details to locate it.')}</div>
        <label className="upload-zone">
          <ImagePlus size={28} />
          <span>{props.uploadedName || t(props.language, '选择或拍摄展品照片', 'Choose or take a photo of the artifact')}</span>
          <input type="file" accept="image/*" capture="environment" onChange={(event) => props.onSelectPhoto(event.target.files?.[0] ?? null)} />
        </label>
        <button className="primary-button full" onClick={props.onSubmitPhoto} disabled={!props.uploadedName || props.isRecognizing}>
          <Camera size={18} /> {props.isRecognizing ? t(props.language, 'AI 识别中', 'AI Matching') : t(props.language, '提交识别', 'Submit Photo')}
        </button>
        <button className="ghost-button full" onClick={() => props.setStep(3)}>{t(props.language, '返回任务主页', 'Back To Mission Hub')}</button>
      </article>
    </section>
  );
}

function RecognitionPage(props: StudentWorkspaceProps) {
  const result = props.recognition;
  if (!result) return null;
  const canFinish = props.completedMissions.length >= props.activity.missions.length;
  return (
    <section className="panel result-panel">
      <BadgeCheck size={42} />
      <small>{t(props.language, 'AI 识别反馈', 'AI Recognition Result')}</small>
      <h1>{getRecognitionStatusLabel(result.status, props.language)}</h1>
      <div className="confidence-chip">{getConfidenceDescriptor(result.confidence, props.language)}</div>
      <div className="summary-grid">
        <Metric label={t(props.language, '识别展品', 'Detected Artifact')} value={result.detectedName} />
        <Metric label={t(props.language, '置信度', 'Confidence')} value={`${Math.round(result.confidence * 100)}%`} />
        <Metric label={t(props.language, '照片', 'Photo')} value={props.uploadedName || t(props.language, '已提交', 'Submitted')} />
      </div>
      <p>{result.feedback}</p>
      <div className="action-row center">
        {result.status !== '完成' && <button className="ghost-button" onClick={() => props.setStep(4)}><Camera size={17} /> {t(props.language, '重拍', 'Retake')}</button>}
        <button className="primary-button" onClick={canFinish ? () => props.setStep(7) : props.onNextMission}>
          {canFinish ? t(props.language, '查看成果', 'View Ending') : t(props.language, '返回任务主页', 'Back To Mission Hub')} <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

function TeamPage(props: StudentWorkspaceProps) {
  const slots = Array.from({ length: props.activity.teamSize }, (_, index) => props.teamMembers[index]);

  return (
    <section className="panel team-panel">
      <div className="section-heading split-heading">
        <span><Users size={20} /> {props.studentTeamName}</span>
        <button className="ghost-button" onClick={() => props.setStep(3)}>{t(props.language, '返回任务', 'Back To Missions')}</button>
      </div>
      <div className="team-summary-strip">
        <div className="helper-card">
          <strong>{t(props.language, '已加入成员', 'Joined Members')}</strong>
          <span>{props.teamMembers.length}/{props.activity.teamSize}</span>
        </div>
        <div className="helper-card">
          <strong>{t(props.language, '团队进度', 'Team Progress')}</strong>
          <span>{props.progress}%</span>
        </div>
      </div>
      <div className="team-grid">
        {slots.map((member, index) => (
          <div key={member?.id ?? `slot-${index}`}>
            <small>{props.language === 'zh' ? `${index + 1}号队员` : `Member ${index + 1}`}</small>
            <strong>{member?.name ?? t(props.language, '待加入', 'Open Slot')}</strong>
            {member?.role && <span>{t(props.language, '探险角色：', 'Role: ')}{member.role}</span>}
          </div>
        ))}
      </div>
      {props.teamMembers.length === 0 && <div className="empty-state">{t(props.language, '当前队伍还没有其他成员加入。', 'No additional members have joined this team yet.')}</div>}
    </section>
  );
}

function AchievementPage(props: StudentWorkspaceProps) {
  const fallbackStory = useMemo(
    () => buildTeamFinalStory(
      props.activity,
      props.studentTeamName,
      props.completedMissions,
      props.missionCompletions,
      props.teamMembers,
      props.progress,
      props.activeTheme,
    ),
    [props.activity, props.studentTeamName, props.completedMissions, props.missionCompletions, props.teamMembers, props.progress, props.activeTheme],
  );
  const [finalStory, setFinalStory] = useState<string[]>(fallbackStory);

  useEffect(() => {
    let ignore = false;
    setFinalStory(fallbackStory);
    const completedMissionDetails = props.completedMissions.map((missionId, index) => {
      const mission = props.activity.missions.find((item) => item.id === missionId);
      return {
        order: index + 1,
        title: mission?.title,
        story: mission?.story,
        selfIntro: mission?.selfIntro,
        hint: mission?.hint,
        completer: props.missionCompletions[missionId],
      };
    });
    generateTextWithAzure<{ paragraphs?: string[] }>('final_story', {
      activity: props.activity,
      teamName: props.studentTeamName,
      teamMembers: props.teamMembers,
      completedMissions: completedMissionDetails,
      progress: props.progress,
      theme: getThemeName(props.activeTheme, props.language),
      language: props.language,
      grade: props.activity.grade,
      subject: props.activity.subject,
    })
      .then((result) => {
        if (!ignore && Array.isArray(result.paragraphs) && result.paragraphs.length > 0) {
          setFinalStory(result.paragraphs);
        }
      })
      .catch(() => {
        if (!ignore) setFinalStory(fallbackStory);
      });
    return () => {
      ignore = true;
    };
  }, [fallbackStory, props.activity, props.studentTeamName, props.teamMembers, props.completedMissions, props.missionCompletions, props.progress, props.activeTheme]);

  return (
    <section className="achievement-page">
      <div className="achievement-card">
        <Star size={44} />
        <small>{props.language === 'zh' ? `${props.studentTeamName}冒险档案` : `${props.studentTeamName} Adventure File`}</small>
        <h1>{t(props.language, '你们完成了一段自己的馆中故事', 'You completed a museum story of your own')}</h1>
        <div className="story-meta-row centered">
          <span>{props.activity.museum.name}</span>
          <span>{getThemeName(props.activeTheme, props.language)}</span>
          <span>{props.language === 'zh' ? `${props.completedMissions.length} 个任务` : `${props.completedMissions.length} missions`}</span>
        </div>
        <div className="final-story">
          {finalStory.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        <div className="adventure-chronicle">
          {props.completedMissions.map((missionId, index) => {
            const mission = props.activity.missions.find((item) => item.id === missionId);
            if (!mission) return null;
            return (
              <div key={mission.id}>
                <small>{props.language === 'zh' ? `第 ${index + 1} 次选择` : `Choice ${index + 1}`}</small>
                <strong>{mission.title}</strong>
                <span>{props.missionCompletions[mission.id] ? (props.language === 'zh' ? `${props.missionCompletions[mission.id]}完成` : `${props.missionCompletions[mission.id]} completed it`) : t(props.language, '完成者待记录', 'Completer pending')}</span>
              </div>
            );
          })}
        </div>
        <div className="summary-grid">
          <Metric label={t(props.language, '完成率', 'Completion')} value={`${props.progress}%`} />
          <Metric label={t(props.language, '完成任务', 'Missions Done')} value={`${props.completedMissions.length}`} />
          <Metric label={t(props.language, '小队成员', 'Team Members')} value={`${props.teamMembers.length}`} />
        </div>
        <div className="action-row center">
          <button className="primary-button" onClick={props.onResetStudentFlow}>
            <ChevronRight size={18} /> {t(props.language, '回到初始界面', 'Back To Start')}
          </button>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

export default App;
