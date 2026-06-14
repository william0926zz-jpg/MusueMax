import { useEffect, useMemo, useState } from 'react';
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

type StudentTeamMember = {
  id: string;
  name: string;
  teamIndex: number;
  teamName: string;
  role: string;
};

type AppRoute = 'home' | 'teacher' | 'student';

function getRouteFromPath(): AppRoute {
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/teacher')) return 'teacher';
  if (path.startsWith('/student')) return 'student';
  return 'home';
}

function buildMissions(artifacts: Artifact[], style: StoryStyle, subject: string, grade: string, goal: string): Mission[] {
  const styleOpenings: Record<StoryStyle, string> = {
    魔幻: '博物馆里的时光纹章被悄悄点亮，',
    科幻: '学习飞船收到来自展柜深处的信号，',
    历史穿越: '一扇通往旧时代的门正在缓慢开启，',
    冒险: '小队的探索地图出现了新的坐标，',
  };

  return artifacts.slice(0, 6).map((artifact, index) => {
    const riddle = buildArtifactRiddle(artifact, index);
    return {
      id: `mission-${artifact.id}`,
      artifactId: artifact.id,
      title: `第 ${index + 1} 关：${riddle.title}`,
      story: `${styleOpenings[style]}一件关键证物被藏在${artifact.gallery}的线索之中。你们需要解开谜题，判断它和“${goal}”之间的联系。`,
      requirement: `根据线索找到目标藏品，拍摄一张清晰照片，并用一句话说明它能支持哪个${subject}学习点。`,
      submission: '照片上传 + 简短观察',
      hint: riddle.hint,
      teacherNote: buildTeacherMissionNote(artifact),
      answer: `目标藏品：${artifact.name}。${artifact.name}可用于${grade}${subject}课程中的${artifact.educationTags.join('、')}主题学习。`,
      minutes: index < 2 ? 6 : 8,
    };
  });
}

function buildTeacherMissionNote(artifact: Artifact) {
  const source = artifact.sourceName ? `来源：${artifact.sourceName}` : '来源：当前藏品库';
  return `本关目标展品是“${artifact.name}”，位于${artifact.gallery}，年代信息为${artifact.era}。${source}。此信息仅供老师审核和讲解，不展示给学生。`;
}

function buildArtifactRiddle(artifact: Artifact, index: number) {
  const clueKeywords = extractClueKeywords(artifact.summary);
  const tagClue = artifact.educationTags[0] ?? '文明线索';
  const secondaryTag = artifact.educationTags[1] ?? '观察推理';
  const eraClue = artifact.era && artifact.era !== '年代待确认' ? `我来自${artifact.era}` : '我的年代需要你从展签中确认';
  const visualClue = clueKeywords.length > 0 ? `我的故事里藏着“${clueKeywords.slice(0, 2).join('、')}”` : `我的外形、材料或纹样会透露“${tagClue}”`;
  const titles = ['失落年代的证物', '展柜里的沉默信使', '纹样背后的答案', '时间留下的坐标', '材料里的秘密', '文明路上的碎片'];

  return {
    title: titles[index % titles.length],
    hint: `${eraClue}；我在${artifact.gallery}等待被发现；${visualClue}。先找与“${tagClue} / ${secondaryTag}”最相关的展品，再核对展签信息。`,
  };
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
    missions: buildMissions(artifacts, storyStyle, subject, grade, goal),
    storyStyle,
    goal,
  };
}

function generateActivityCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomPart = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `MX-${randomPart.slice(0, 3)}-${randomPart.slice(3)}`;
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

function App() {
  const [route, setRoute] = useState<AppRoute>(() => getRouteFromPath());
  const [teacherStep, setTeacherStep] = useState(0);
  const [studentStep, setStudentStep] = useState(0);
  const [query, setQuery] = useState('');
  const [onlineMuseums, setOnlineMuseums] = useState<Museum[]>([]);
  const [isSearchingMuseums, setIsSearchingMuseums] = useState(false);
  const [museumSearchError, setMuseumSearchError] = useState('');
  const [selectedMuseum, setSelectedMuseum] = useState<Museum>(museums[0]);
  const [artifacts, setArtifacts] = useState<Artifact[]>(getArtifactsForMuseum(museums[0].id).slice(0, 10));
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<string[]>(() => getArtifactsForMuseum(museums[0].id).slice(0, 6).map((artifact) => artifact.id));
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);
  const [artifactLoadMessage, setArtifactLoadMessage] = useState('');
  const [subject, setSubject] = useState('历史');
  const [grade, setGrade] = useState('七年级');
  const [duration, setDuration] = useState(90);
  const [teamCount, setTeamCount] = useState(6);
  const [storyStyle, setStoryStyle] = useState<StoryStyle>('冒险');
  const [goal, setGoal] = useState('理解文明交流如何改变人类生活');
  const [activity, setActivity] = useState<Activity>(() =>
    createActivity(selectedMuseum, artifacts, storyStyle, subject, grade, duration, goal, teamCount),
  );
  const [studentName, setStudentName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0);
  const [studentTeamName, setStudentTeamName] = useState(getDefaultTeamName(0));
  const [teamMembers, setTeamMembers] = useState<StudentTeamMember[]>([]);
  const [activeMissionIndex, setActiveMissionIndex] = useState(0);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [recognition, setRecognition] = useState<RecognitionResult | null>(null);
  const [uploadedName, setUploadedName] = useState('');

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
    setRoute(nextRoute);
  }

  async function selectMuseum(museum: Museum) {
    setSelectedMuseum(museum);
    setIsLoadingArtifacts(true);
    setArtifactLoadMessage('正在匹配可信馆藏来源...');
    setTeacherStep(1);

    try {
      const sourcedArtifacts = await fetchTrustedArtifactsForMuseum(museum);
      if (sourcedArtifacts.artifacts.length > 0) {
        setArtifacts(sourcedArtifacts.artifacts);
        setSelectedArtifactIds(sourcedArtifacts.artifacts.slice(0, 6).map((artifact) => artifact.id));
        setArtifactLoadMessage(sourcedArtifacts.message);
      } else {
        const fallbackArtifacts = getArtifactsForMuseum(museum.id).slice(0, 10);
        setArtifacts(fallbackArtifacts);
        setSelectedArtifactIds(fallbackArtifacts.slice(0, 6).map((artifact) => artifact.id));
        setArtifactLoadMessage('暂未接入该馆可信馆藏接口，已使用人工策划示例藏品。');
      }
    } catch {
      const fallbackArtifacts = getArtifactsForMuseum(museum.id).slice(0, 10);
      setArtifacts(fallbackArtifacts);
      setSelectedArtifactIds(fallbackArtifacts.slice(0, 6).map((artifact) => artifact.id));
      setArtifactLoadMessage('可信馆藏来源获取失败，已使用人工策划示例藏品。');
    } finally {
      setIsLoadingArtifacts(false);
    }
  }

  async function searchMuseumOnline() {
    const keyword = query.trim();
    if (!keyword) {
      setMuseumSearchError('请输入博物馆名称、城市或主题关键词后再搜索。');
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
        setMuseumSearchError('当前网络源未返回结果，已展示内置馆库中的匹配信息。');
      } else if (mergedResults.length === 0) {
        setMuseumSearchError('没有找到可用的博物馆信息，请换一个更具体的关键词。');
      }
    } catch {
      const fallbackResults = getLocalMuseumFallback(keyword);
      setOnlineMuseums(fallbackResults);
      setMuseumSearchError(fallbackResults.length > 0 ? '联网搜索暂时失败，已展示内置馆库中的匹配信息。' : '联网搜索暂时失败，请检查网络后重试。');
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
    const bank = getArtifactsForMuseum(selectedMuseum.id);
    const regeneratedArtifacts = [...bank].reverse().slice(0, 10);
    setArtifacts(regeneratedArtifacts);
    setSelectedArtifactIds(regeneratedArtifacts.slice(0, 6).map((artifact) => artifact.id));
  }

  function toggleArtifactSelection(artifactId: string) {
    setSelectedArtifactIds((ids) => ids.includes(artifactId) ? ids.filter((id) => id !== artifactId) : [...ids, artifactId]);
  }

  function selectAllArtifacts() {
    setSelectedArtifactIds(artifacts.map((artifact) => artifact.id));
  }

  function clearArtifactSelection() {
    setSelectedArtifactIds([]);
  }

  function generateActivity() {
    if (selectedArtifacts.length === 0) return;
    const nextActivity = createActivity(selectedMuseum, selectedArtifacts, storyStyle, subject, grade, duration, goal, teamCount, activity.code);
    setActivity(nextActivity);
    setTeacherStep(2);
  }

  function publishActivity() {
    if (selectedArtifacts.length === 0) return;
    const nextActivity = createActivity(selectedMuseum, selectedArtifacts, storyStyle, subject, grade, duration, goal, teamCount, generateActivityCode());
    setActivity(nextActivity);
    setStudentCode(nextActivity.code);
    setSelectedTeamIndex(0);
    setStudentTeamName(getDefaultTeamName(0));
    setTeacherStep(3);
  }

  function joinActivity() {
    if (studentName.trim() && studentCode.trim().toUpperCase() === activity.code) {
      setStudentStep(1);
    }
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

  function simulateRecognition() {
    const statuses: RecognitionResult[] = [
      {
        status: '完成',
        detectedName: activity.artifacts.find((artifact) => artifact.id === currentMission.artifactId)?.name ?? '目标展品',
        confidence: 0.91,
        feedback: '照片清晰匹配当前关卡，观察角度能看出关键纹样。',
      },
      {
        status: '部分完成',
        detectedName: activity.artifacts[Math.min(activeMissionIndex + 1, activity.artifacts.length - 1)]?.name ?? '相邻展品',
        confidence: 0.68,
        feedback: '识别到相近展品，请补拍展签或主体局部后再次提交。',
      },
    ];
    const nextResult = statuses[completedMissions.length % statuses.length];
    setRecognition(nextResult);
    setUploadedName(uploadedName || 'team-photo.jpg');
    setStudentStep(5);
    if (nextResult.status === '完成') {
      setCompletedMissions((items) => [...new Set([...items, currentMission.id])]);
    }
  }

  function goNextMission() {
    const nextIndex = Math.min(activeMissionIndex + 1, missions.length - 1);
    setActiveMissionIndex(nextIndex);
    setRecognition(null);
    setUploadedName('');
    setStudentStep(nextIndex === activeMissionIndex && progress >= 100 ? 7 : 3);
  }

  return (
    <main className={`app-shell ${route}-app`}>
      {route === 'home' ? (
        <LandingPage activity={activity} onNavigate={navigate} />
      ) : (
        <>
          <header className="topbar portal-topbar">
            <button className="brand" onClick={() => navigate('home')}>
              <span className="brand-mark">MX</span>
              <span>
                <strong>MUSEUMAX</strong>
                <small>{route === 'teacher' ? '老师工作台' : '学生探险端'}</small>
              </span>
            </button>
            <nav className="portal-nav" aria-label="独立端入口">
              <button className={route === 'teacher' ? 'active' : ''} onClick={() => navigate('teacher')}>
                <GraduationCap size={18} /> 老师端
              </button>
              <button className={route === 'student' ? 'active' : ''} onClick={() => navigate('student')}>
                <Compass size={18} /> 学生端
              </button>
            </nav>
          </header>

          {route === 'teacher' ? (
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
          onGenerateActivity={generateActivity}
          onPublishActivity={publishActivity}
        />
      ) : (
        <StudentWorkspace
          step={studentStep}
          setStep={setStudentStep}
          activity={activity}
          studentName={studentName}
          setStudentName={setStudentName}
          studentCode={studentCode}
          setStudentCode={setStudentCode}
          onJoin={joinActivity}
          selectedTeamIndex={selectedTeamIndex}
          setSelectedTeamIndex={setSelectedTeamIndex}
          studentTeamName={studentTeamName}
          setStudentTeamName={setStudentTeamName}
          teamMembers={teamMembers.filter((member) => member.teamIndex === selectedTeamIndex)}
          onConfirmTeam={confirmStudentTeam}
          currentMission={currentMission}
          activeMissionIndex={activeMissionIndex}
          completedMissions={completedMissions}
          progress={progress}
          recognition={recognition}
          uploadedName={uploadedName}
          setUploadedName={setUploadedName}
          onSubmitPhoto={simulateRecognition}
          onNextMission={goNextMission}
        />
          )}
        </>
      )}
    </main>
  );
}

function LandingPage({ activity, onNavigate }: { activity: Activity; onNavigate: (route: AppRoute) => void }) {
  return (
    <section className="landing-page">
      <div className="landing-hero">
        <span className="brand-mark">MX</span>
        <small>学校研学版 MVP</small>
        <h1>MUSEUMAX</h1>
        <p>老师端负责课前策划、活动发布和复盘管理；学生端负责活动码加入、馆中探险、拍照识别和成果生成。</p>
      </div>
      <div className="portal-grid">
        <button className="portal-card teacher-card" onClick={() => onNavigate('teacher')}>
          <GraduationCap size={34} />
          <span>
            <small>Teacher Portal</small>
            <strong>进入老师端</strong>
            <em>搜索博物馆、生成藏品任务、发布活动与查看报告</em>
          </span>
          <ChevronRight size={22} />
        </button>
        <button className="portal-card student-card" onClick={() => onNavigate('student')}>
          <Compass size={34} />
          <span>
            <small>Student Portal</small>
            <strong>进入学生端</strong>
            <em>使用活动码 {activity.code} 加入小队探险</em>
          </span>
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  );
}

type TeacherWorkspaceProps = {
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
  onGenerateActivity: () => void;
  onPublishActivity: () => void;
};

function TeacherWorkspace(props: TeacherWorkspaceProps) {
  const steps = ['选馆策划', '藏品推荐', '任务生成', '发布复盘'];

  return (
    <section className="workspace">
      <aside className="sidebar">
        <div className="sidebar-title">
          <LayoutDashboard size={20} /> 老师工作台
        </div>
        {steps.map((label, index) => (
          <button key={label} className={props.step === index ? 'step active' : 'step'} onClick={() => props.setStep(index)}>
            <span>{index + 1}</span>
            {label}
          </button>
        ))}
        <div className="quick-card">
          <small>最近活动</small>
          <strong>{props.activity.name}</strong>
          <p>活动码 {props.activity.code}</p>
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

  const curatedArtifacts = getArtifactsForMuseum(museum.id).slice(0, 10);
  const hasCuratedSet = curatedArtifacts.some((artifact) => artifact.sourceName);
  return {
    artifacts: curatedArtifacts,
    message: hasCuratedSet ? `已加载 ${museum.name} 的人工策划藏品清单，图片和来源按单件藏品校准。` : '暂未接入该馆官方馆藏接口，已使用人工策划示例藏品。',
  };
}

function isMetMuseum(museum: Museum) {
  return museum.id === 'met' || /metropolitan museum of art|大都会艺术博物馆/i.test(museum.name);
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

async function fetchMetMuseumArtifacts(): Promise<Artifact[]> {
  const searchEndpoint = new URL('https://collectionapi.metmuseum.org/public/collection/v1/search');
  searchEndpoint.searchParams.set('hasImages', 'true');
  searchEndpoint.searchParams.set('isHighlight', 'true');
  searchEndpoint.searchParams.set('q', 'art');

  const searchPayload = await fetchJsonWithTimeout<{ objectIDs?: number[] }>(searchEndpoint.toString(), 10000);
  const objectIds = (searchPayload.objectIDs ?? []).slice(0, 24);
  const objectResults = await Promise.allSettled(
    objectIds.map((objectId) => fetchJsonWithTimeout<MetObject>(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`, 10000)),
  );

  return objectResults
    .flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
    .filter((object) => object.title && (object.primaryImageSmall || object.primaryImage))
    .slice(0, 10)
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

function MuseumSearch({ query, setQuery, museums, selectedMuseum, onSelectMuseum, onSearchMuseumOnline, isSearchingMuseums, museumSearchError }: TeacherWorkspaceProps) {
  return (
    <div className="screen-grid two-columns">
      <section className="panel wide-panel">
        <div className="section-heading">
          <span><Search size={20} /> 全球博物馆搜索</span>
          <small>输入关键词后点击搜索，可联网获取公开博物馆详情</small>
        </div>
        <div className="search-row">
          <label className="searchbox">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索：大英博物馆、Shanghai Museum、古埃及..." />
          </label>
          <button className="primary-button search-button" onClick={onSearchMuseumOnline} disabled={isSearchingMuseums}>
            {isSearchingMuseums ? <RefreshCw size={18} className="spin" /> : <Search size={18} />}
            {isSearchingMuseums ? '搜索中' : '联网搜索'}
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
        <img src={selectedMuseum.image} alt="" />
        <div>
          <small>当前策划对象</small>
          <h1>{selectedMuseum.name}</h1>
          <p>{selectedMuseum.summary}</p>
          <div className="tag-row">{selectedMuseum.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          {selectedMuseum.sourceUrl && <a className="source-link" href={selectedMuseum.sourceUrl} target="_blank" rel="noreferrer">查看公开来源</a>}
        </div>
      </section>
    </div>
  );
}

function ArtifactPlanner(props: TeacherWorkspaceProps) {
  return (
    <section className="panel">
      <div className="section-heading split-heading">
        <span><Sparkles size={20} /> AI 代表藏品推荐</span>
        <div className="toolbar-actions">
          <button className="ghost-button" onClick={props.onSelectAllArtifacts}>全选</button>
          <button className="ghost-button" onClick={props.onClearArtifactSelection}>清空</button>
          <button className="ghost-button" onClick={props.onRegenerateArtifacts}><RefreshCw size={17} /> 重新生成</button>
        </div>
      </div>
      {props.artifactLoadMessage && (
        <div className={props.isLoadingArtifacts ? 'inline-status loading' : 'inline-status'}>
          {props.isLoadingArtifacts && <RefreshCw size={17} className="spin" />}
          {props.artifactLoadMessage}
        </div>
      )}
      <div className="selection-summary">
        已选择 <strong>{props.selectedArtifactIds.length}</strong> / {props.artifacts.length} 件展品用于生成任务
      </div>
      <div className="artifact-grid">
        {props.artifacts.map((artifact, index) => (
          <article className={props.selectedArtifactIds.includes(artifact.id) ? 'artifact-card selected' : 'artifact-card'} key={artifact.id}>
            <label className="artifact-select">
              <input
                type="checkbox"
                checked={props.selectedArtifactIds.includes(artifact.id)}
                onChange={() => props.onToggleArtifactSelection(artifact.id)}
              />
              <span>用于任务</span>
            </label>
            <img src={artifact.image} alt="" />
            <div>
              <small>{artifact.era} · {artifact.gallery}</small>
              <h3>{artifact.name}</h3>
              <p>{artifact.summary}</p>
              <div className="tag-row compact">{artifact.educationTags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              {artifact.sourceUrl && <a className="source-link artifact-source" href={artifact.sourceUrl} target="_blank" rel="noreferrer">来源：{artifact.sourceName}</a>}
            </div>
            <footer>
              <button title="上移" onClick={() => props.onMoveArtifact(index, -1)}>↑</button>
              <button title="下移" onClick={() => props.onMoveArtifact(index, 1)}>↓</button>
              <button title="替换藏品" onClick={() => props.onReplaceArtifact(artifact.id)}><RefreshCw size={16} /></button>
              <button title="删除藏品" onClick={() => props.onRemoveArtifact(artifact.id)}><Trash2 size={16} /></button>
            </footer>
          </article>
        ))}
      </div>
      <div className="action-row">
        <button className="primary-button" onClick={() => props.setStep(2)} disabled={props.selectedArtifactIds.length === 0}>进入任务生成 <ChevronRight size={18} /></button>
      </div>
    </section>
  );
}

function MissionGenerator(props: TeacherWorkspaceProps) {
  const previewMissions = buildMissions(props.selectedArtifacts, props.storyStyle, props.subject, props.grade, props.goal);

  return (
    <div className="screen-grid planner-grid">
      <section className="panel settings-panel">
        <div className="section-heading">
          <span><ClipboardList size={20} /> 任务参数</span>
          <small>根据年级、学科、时长和故事风格生成</small>
        </div>
        <label>年级<input value={props.grade} onChange={(event) => props.setGrade(event.target.value)} /></label>
        <label>学科<input value={props.subject} onChange={(event) => props.setSubject(event.target.value)} /></label>
        <label>活动时长<input type="number" value={props.duration} onChange={(event) => props.setDuration(Number(event.target.value))} /></label>
        <label>分成几个小队<input type="number" min="1" max="12" value={props.teamCount} onChange={(event) => props.setTeamCount(Math.max(1, Math.min(12, Number(event.target.value) || 1)))} /></label>
        <label>教学目标<textarea value={props.goal} onChange={(event) => props.setGoal(event.target.value)} /></label>
        <div className="segmented">
          {storyStyles.map((style) => (
            <button key={style} className={props.storyStyle === style ? 'active' : ''} onClick={() => props.setStoryStyle(style)}>{style}</button>
          ))}
        </div>
        <button className="primary-button full" onClick={props.onGenerateActivity}><Sparkles size={18} /> 生成任务序列</button>
      </section>
      <section className="panel mission-list">
        <div className="section-heading">
          <span><BookOpen size={20} /> 任务卡预览</span>
          <small>{previewMissions.length} 个关卡 · 预计 {previewMissions.reduce((sum, mission) => sum + mission.minutes, 0)} 分钟</small>
        </div>
        {previewMissions.map((mission) => (
          <article className="mission-card" key={mission.id}>
            <h3>{mission.title}</h3>
            <p>{mission.story}</p>
            <dl>
              <div><dt>学生任务</dt><dd>{mission.requirement}</dd></div>
              <div><dt>提交</dt><dd>{mission.submission}</dd></div>
              <div><dt>谜题线索</dt><dd>{mission.hint}</dd></div>
              <div><dt>教师提示</dt><dd>{mission.teacherNote}</dd></div>
              <div><dt>教师答案</dt><dd>{mission.answer}</dd></div>
            </dl>
          </article>
        ))}
        <button className="primary-button" onClick={props.onPublishActivity}><Send size={18} /> 发布活动</button>
      </section>
    </div>
  );
}

function PublishAndReport(props: TeacherWorkspaceProps) {
  return (
    <div className="screen-grid two-columns">
      <section className="panel publish-panel">
        <div className="section-heading">
          <span><Flag size={20} /> 活动发布</span>
          <small>学生可使用活动码加入</small>
        </div>
        <div className="code-box">{props.activity.code}</div>
        <div className="summary-grid">
          <Metric label="活动名称" value={props.activity.name} />
          <Metric label="班级" value={props.activity.className} />
          <Metric label="分组" value={`${props.activity.teamCount} 个小队 · 每队 ${props.activity.teamSize} 人`} />
          <Metric label="关卡" value={`${props.activity.missions.length} 个`} />
        </div>
        <button className="primary-button full"><Send size={18} /> 复制发布链接</button>
      </section>
      <section className="panel report-panel">
        <div className="section-heading split-heading">
          <span><FileText size={20} /> 课后复盘报告</span>
          <button className="ghost-button"><Download size={17} /> 导出</button>
        </div>
        <div className="summary-grid">
          <Metric label="班级完成率" value="83%" />
          <Metric label="参与人数" value="36" />
          <Metric label="识别成功" value="128" />
          <Metric label="人工判定" value="7" />
        </div>
        <div className="rank-list">
          {['星图小队', '青铜小队', '远航小队'].map((team, index) => (
            <div key={team}><strong>{index + 1}. {team}</strong><span>{96 - index * 8} 分</span></div>
          ))}
        </div>
      </section>
    </div>
  );
}

type StudentWorkspaceProps = {
  step: number;
  setStep: (step: number) => void;
  activity: Activity;
  studentName: string;
  setStudentName: (name: string) => void;
  studentCode: string;
  setStudentCode: (code: string) => void;
  onJoin: () => void;
  selectedTeamIndex: number;
  setSelectedTeamIndex: (index: number) => void;
  studentTeamName: string;
  setStudentTeamName: (name: string) => void;
  teamMembers: StudentTeamMember[];
  onConfirmTeam: () => void;
  currentMission: Mission;
  activeMissionIndex: number;
  completedMissions: string[];
  progress: number;
  recognition: RecognitionResult | null;
  uploadedName: string;
  setUploadedName: (name: string) => void;
  onSubmitPhoto: () => void;
  onNextMission: () => void;
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
        <small>学生加入</small>
        <h1>输入活动码，进入小队探险</h1>
        <p>{props.activity.name} 已准备好，当前发布码为 {props.activity.code}。</p>
        <div className="join-form">
          <label>
            你的名字
            <input value={props.studentName} onChange={(event) => props.setStudentName(event.target.value)} placeholder="输入姓名" />
          </label>
          <label className="join-box">
            <input value={props.studentCode} onChange={(event) => props.setStudentCode(event.target.value.toUpperCase())} placeholder="输入活动码" />
            <button onClick={props.onJoin} disabled={!props.studentName.trim() || !props.studentCode.trim()}><ChevronRight size={20} /></button>
          </label>
        </div>
      </div>
      <img src={props.activity.museum.image} alt="" />
    </section>
  );
}

function TeamSetup(props: StudentWorkspaceProps) {
  return (
    <section className="panel team-setup-panel">
      <div className="section-heading">
        <span><Users size={20} /> 选择小队</span>
        <small>{props.studentName}同学，本次活动共 {props.activity.teamCount} 个小队，每队建议 {props.activity.teamSize} 人</small>
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
            <strong>第 {index + 1} 小队</strong>
            <span>{getDefaultTeamName(index)}</span>
          </button>
        ))}
      </div>
      <label className="team-name-field">
        小队名称
        <input value={props.studentTeamName} onChange={(event) => props.setStudentTeamName(event.target.value)} placeholder="为你的小队起个名字" />
      </label>
      <button className="primary-button" onClick={props.onConfirmTeam} disabled={!props.studentTeamName.trim()}>
        确认小队 <ChevronRight size={18} />
      </button>
    </section>
  );
}

function OpeningStory(props: StudentWorkspaceProps) {
  return (
    <section className="panel story-panel">
      <small>{props.activity.storyStyle}剧情</small>
      <h1>{props.studentName}同学，你们是“{props.studentTeamName}”</h1>
      <p>博物馆里的线索散落在不同展厅。你们需要根据谜题找到若干关键藏品，修复一条关于“{props.activity.goal}”的学习地图。</p>
      <div className="team-strip">
        {props.teamMembers.map((member) => <span key={member.id}>{member.name} · {member.role}</span>)}
      </div>
      <button className="primary-button" onClick={() => props.setStep(3)}><Compass size={18} /> 开始任务</button>
    </section>
  );
}

function StudentDashboard(props: StudentWorkspaceProps) {
  return (
    <section className="panel dashboard-panel">
      <div className="section-heading split-heading">
        <span><Compass size={20} /> {props.studentName}的任务主页</span>
        <button className="ghost-button" onClick={() => props.setStep(6)}><Users size={17} /> 小队</button>
      </div>
      <div className="progress-card">
        <div><strong>{props.progress}%</strong><span>总进度</span></div>
        <div className="progress-track"><i style={{ width: `${props.progress}%` }} /></div>
      </div>
      <div className="mission-map">
        {props.activity.missions.map((mission, index) => (
          <button key={mission.id} className={props.completedMissions.includes(mission.id) ? 'done' : index === props.activeMissionIndex ? 'current' : ''}>
            {props.completedMissions.includes(mission.id) ? <Check size={18} /> : index + 1}
            <span>{mission.title}</span>
          </button>
        ))}
      </div>
      <button className="primary-button" onClick={() => props.setStep(4)}>进入当前关卡 <ChevronRight size={18} /></button>
    </section>
  );
}

function MissionDetail(props: StudentWorkspaceProps) {
  const artifact = props.activity.artifacts.find((item) => item.id === props.currentMission.artifactId);
  return (
    <section className="mission-detail">
      <article className="panel detail-copy">
        <small>当前关卡</small>
        <h1>{props.currentMission.title}</h1>
        <p>{props.currentMission.story}</p>
        <div className="task-box"><strong>任务要求</strong>{props.currentMission.requirement}</div>
        <div className="hint-box"><ShieldCheck size={18} /> {props.currentMission.hint}</div>
      </article>
      <article className="panel camera-panel">
        {artifact && <img src={artifact.image} alt="" />}
        <label className="upload-zone">
          <ImagePlus size={28} />
          <span>{props.uploadedName || '选择或拍摄展品照片'}</span>
          <input type="file" accept="image/*" capture="environment" onChange={(event) => props.setUploadedName(event.target.files?.[0]?.name ?? '')} />
        </label>
        <button className="primary-button full" onClick={props.onSubmitPhoto}><Camera size={18} /> 提交识别</button>
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
      <small>AI 识别反馈</small>
      <h1>{result.status}</h1>
      <div className="summary-grid">
        <Metric label="识别展品" value={result.detectedName} />
        <Metric label="置信度" value={`${Math.round(result.confidence * 100)}%`} />
        <Metric label="照片" value={props.uploadedName || '已提交'} />
      </div>
      <p>{result.feedback}</p>
      <div className="action-row center">
        {result.status !== '完成' && <button className="ghost-button" onClick={() => props.setStep(4)}><Camera size={17} /> 重拍</button>}
        <button className="primary-button" onClick={canFinish ? () => props.setStep(7) : props.onNextMission}>
          {canFinish ? '查看成果' : '下一关'} <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

function TeamPage(props: StudentWorkspaceProps) {
  return (
    <section className="panel team-panel">
      <div className="section-heading split-heading">
        <span><Users size={20} /> {props.studentTeamName}</span>
        <button className="ghost-button" onClick={() => props.setStep(3)}>返回任务</button>
      </div>
      <div className="team-grid">
        {props.teamMembers.length > 0 ? props.teamMembers.map((member) => (
          <div key={member.id}>
            <strong>{member.name}</strong>
            <span>探险角色：{member.role}</span>
          </div>
        )) : <p className="empty-team">还没有成员加入这个小队</p>}
      </div>
      <div className="clue-board">
        {props.activity.missions.slice(0, 4).map((mission, index) => (
          <span key={mission.id}>{index + 1}. {mission.hint}</span>
        ))}
      </div>
    </section>
  );
}

function AchievementPage(props: StudentWorkspaceProps) {
  return (
    <section className="achievement-page">
      <div className="achievement-card">
        <Star size={44} />
        <small>{props.studentTeamName}称号</small>
        <h1>文明线索守护者</h1>
        <p>{props.studentName}同学和{props.studentTeamName}完成了 {props.completedMissions.length} 个关卡，沿着{props.activity.museum.name}的展厅线索，把藏品年代、材料、纹样和故事重新连接起来。小队最终证明：{props.activity.goal}。</p>
        <div className="summary-grid">
          <Metric label="完成率" value={`${props.progress}%`} />
          <Metric label="徽章" value="6 枚" />
          <Metric label="小队积分" value="96" />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

export default App;
