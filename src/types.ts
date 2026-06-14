export type StoryStyle = '魔幻' | '科幻' | '历史穿越' | '冒险';

export type Museum = {
  id: string;
  name: string;
  country: string;
  city: string;
  summary: string;
  tags: string[];
  image: string;
  sourceUrl?: string;
  sourceName?: string;
  wikidataId?: string;
};

export type Artifact = {
  id: string;
  name: string;
  era: string;
  gallery: string;
  summary: string;
  educationTags: string[];
  image: string;
  sourceUrl?: string;
  sourceName?: string;
};

export type Mission = {
  id: string;
  artifactId: string;
  title: string;
  story: string;
  requirement: string;
  submission: string;
  hint: string;
  teacherNote: string;
  answer: string;
  minutes: number;
};

export type Activity = {
  code: string;
  name: string;
  className: string;
  grade: string;
  subject: string;
  duration: number;
  teamSize: number;
  teamCount: number;
  mode: '个人' | '小队';
  museum: Museum;
  artifacts: Artifact[];
  missions: Mission[];
  storyStyle: StoryStyle;
  goal: string;
};

export type RecognitionStatus = '完成' | '部分完成' | '未匹配';

export type RecognitionResult = {
  status: RecognitionStatus;
  detectedName: string;
  confidence: number;
  feedback: string;
};
