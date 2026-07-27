type EnvMap = Record<string, string | undefined>;

export function readJsonBody(req: any, limit: number, invalidFormatMessage: string) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      raw += chunk;
      if (raw.length > limit) {
        reject(new Error('图片太大，请压缩后再上传。'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error(invalidFormatMessage));
      }
    });
    req.on('error', reject);
  });
}

export async function recognizeWithAzure(body: Record<string, unknown>, env: EnvMap) {
  const endpoint = env.AZURE_OPENAI_ENDPOINT;
  const deployment = env.AZURE_OPENAI_DEPLOYMENT;
  const apiKey = env.AZURE_OPENAI_API_KEY;
  const apiVersion = env.AZURE_OPENAI_API_VERSION ?? '2024-10-21';

  if (!endpoint || !deployment || !apiKey) {
    throw new Error('缺少 Azure OpenAI 配置：需要 AZURE_OPENAI_ENDPOINT、AZURE_OPENAI_DEPLOYMENT 和 AZURE_OPENAI_API_KEY。');
  }

  const imageDataUrl = String(body.imageDataUrl ?? '');
  const artifact = body.artifact as Record<string, unknown> | undefined;
  const mission = body.mission as Record<string, unknown> | undefined;
  if (!imageDataUrl.startsWith('data:image/')) {
    throw new Error('请上传一张有效的展品图片。');
  }

  const targetName = String(artifact?.name ?? '目标展品');
  const targetReference = String(artifact?.image ?? '');
  const prompt = [
    '你是博物馆研学活动的图片识别助手。请判断学生上传的照片是否拍到了目标展品。',
    '只返回 JSON，不要使用 Markdown。',
    `目标展品名称：${targetName}`,
    `目标展品年代：${String(artifact?.era ?? '')}`,
    `目标展厅：${String(artifact?.gallery ?? '')}`,
    `目标展品说明：${String(artifact?.summary ?? '')}`,
    `当前任务：${String(mission?.title ?? '')}`,
    '返回格式：{"matched":boolean,"confidence":0到1之间的数字,"detectedName":"识别到的展品名或不确定","reason":"给学生看的简短反馈"}',
  ].join('\n');
  const endpointUrl = buildAzureEndpointUrl(endpoint, deployment, apiVersion);
  const useResponsesApi = endpointUrl.includes('/responses');
  const primaryBody = useResponsesApi
    ? buildResponsesBody(deployment, prompt, imageDataUrl, targetReference)
    : buildChatCompletionsBody(prompt, imageDataUrl, targetReference);

  let response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(primaryBody),
  });

  let data = await response.json();
  if (!response.ok && shouldRetryWithoutReference(data?.error?.message)) {
    const fallbackBody = useResponsesApi
      ? buildResponsesBody(deployment, prompt, imageDataUrl, '')
      : buildChatCompletionsBody(prompt, imageDataUrl, '');
    response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(fallbackBody),
    });
    data = await response.json();
  }

  if (!response.ok) {
    throw new Error(data?.error?.message ?? 'Azure AI 识别请求失败。');
  }

  const rawContent = data?.output_text ?? data?.choices?.[0]?.message?.content ?? data?.output?.[0]?.content;
  const parsed = parseAzureJson(rawContent);
  return {
    matched: Boolean(parsed.matched),
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    detectedName: String(parsed.detectedName ?? targetName),
    reason: String(parsed.reason ?? '模型已返回识别结果。'),
  };
}

export async function generateTextWithAzure(body: Record<string, unknown>, env: EnvMap) {
  const endpoint = env.AZURE_OPENAI_ENDPOINT;
  const deployment = env.AZURE_OPENAI_DEPLOYMENT;
  const apiKey = env.AZURE_OPENAI_API_KEY;
  const apiVersion = env.AZURE_OPENAI_API_VERSION ?? '2024-10-21';

  if (!endpoint || !deployment || !apiKey) {
    throw new Error('缺少 Azure OpenAI 配置：需要 AZURE_OPENAI_ENDPOINT、AZURE_OPENAI_DEPLOYMENT 和 AZURE_OPENAI_API_KEY。');
  }

  const type = String(body.type ?? '');
  const endpointUrl = buildAzureEndpointUrl(endpoint, deployment, apiVersion);
  const useResponsesApi = endpointUrl.includes('/responses');
  if (type === 'missions') {
    return generateMissionTextInBatches(body, endpointUrl, apiKey, deployment, useResponsesApi);
  }

  return requestStructuredText(type, body, endpointUrl, apiKey, deployment, useResponsesApi);
}

function shouldRetryWithoutReference(message: unknown) {
  const text = typeof message === 'string' ? message : '';
  return text.includes('Error while downloading file') || text.includes('status code: 403') || text.includes('403');
}

async function generateMissionTextInBatches(
  body: Record<string, unknown>,
  endpointUrl: string,
  apiKey: string,
  deployment: string,
  useResponsesApi: boolean,
) {
  const context = (body.context as Record<string, unknown> | undefined) ?? {};
  const artifacts = Array.isArray(context.artifacts) ? context.artifacts : [];
  const chunkSize = 1;

  if (artifacts.length <= chunkSize) {
    return requestStructuredText('missions', body, endpointUrl, apiKey, deployment, useResponsesApi);
  }

  const chunkBodies: Array<{ chunkIndex: number; chunkBody: Record<string, unknown> }> = [];
  for (let start = 0; start < artifacts.length; start += chunkSize) {
    chunkBodies.push({
      chunkIndex: start / chunkSize,
      chunkBody: {
        ...body,
        context: {
          ...context,
          artifacts: artifacts.slice(start, start + chunkSize),
        },
      },
    });
  }

  const settledChunks = await runChunkedMissionGeneration(
    chunkBodies,
    async ({ chunkIndex, chunkBody }) => ({
      chunkIndex,
      result: await requestStructuredText('missions', chunkBody, endpointUrl, apiKey, deployment, useResponsesApi),
    }),
    2,
  );

  const batchedMissions = settledChunks
    .sort((left, right) => left.chunkIndex - right.chunkIndex)
    .flatMap(({ result }) => Array.isArray(result.missions) ? result.missions : []);

  return { missions: batchedMissions };
}

async function runChunkedMissionGeneration<TInput, TResult>(
  items: TInput[],
  worker: (item: TInput) => Promise<TResult>,
  concurrency: number,
) {
  const results: TResult[] = [];
  let nextIndex = 0;

  async function consumeQueue() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => consumeQueue());
  await Promise.all(workers);
  return results;
}

async function requestStructuredText(
  type: string,
  body: Record<string, unknown>,
  endpointUrl: string,
  apiKey: string,
  deployment: string,
  useResponsesApi: boolean,
) {
  const basePrompt = buildTextGenerationPrompt(type, body);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const prompt = attempt === 0 ? basePrompt : `${basePrompt}\n最后提醒：整段回复必须是一个可直接 JSON.parse 的 JSON 对象，不能包含代码块、解释、前缀或后缀。`;
    const responseBody = useResponsesApi
      ? buildTextResponsesBody(deployment, prompt)
      : buildTextChatCompletionsBody(prompt);

    try {
      const data = await requestAzurePayload(endpointUrl, apiKey, responseBody, 28000);
      const rawContent = extractAzureText(data);
      const parsed = parseAzureJson(rawContent);
      return validateTextGenerationPayload(type, parsed);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Azure AI 文本生成请求失败。');
      if (!shouldRetryTextGeneration(lastError, attempt)) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error('Azure AI 文本生成请求失败。');
}

function buildTextGenerationPrompt(type: string, body: Record<string, unknown>) {
  const rawContext = (body.context ?? {}) as Record<string, unknown>;
  const outputLanguage = rawContext.language === 'en' ? 'English' : 'Chinese';
  const context = JSON.stringify(rawContext, null, 2);
  if (type === 'missions') {
    return [
      '你是 MUSEUMAX 博物馆研学任务设计助手。请根据输入 JSON 为每个 artifact 生成一张任务卡。',
      '只返回 JSON，不要 Markdown，不要解释。',
      `这次输出语言必须是${outputLanguage}。如果输入 JSON 中 language 为 en，则 title、story、selfIntro、requirement、submission、hint、teacherNote、answer 必须全部用自然英文书写；如果 language 为 zh，则全部用中文书写。不要混用两种语言。`,
      '必须返回 {"missions":[...]}。',
      '每个 mission 必须包含：id, artifactId, title, story, selfIntro, requirement, submission, hint, teacherNote, answer, minutes。',
      '你需要为每个 artifact 完整生成标题、任务故事、学生任务、谜题线索和教师备注，不能只改标题。',
      '核心目标只有四个：一，让学生觉得像在经历一场真实冒险；二，每件展品都写出不同的气质和切入口；三，知识点严格受输入的 grade 和 subject 约束，不超纲；四，学生可见部分不要直接剧透藏品完整名称。',
      '输入 JSON 中的 backgroundStory 是整场活动已经生成好的序章。每一关的 story 都要像是在这段序章之后继续展开的一个章节，而不是彼此无关的新任务。任务之间应当共享同一条正在推进的主线，只是切入点不同。',
      '叙事风格必须同时读取输入 JSON 中的 theme 和 storyStyle。theme 决定整体世界质感，storyStyle 决定讲故事的方法和任务推进方式，两者都必须真实生效。',
      'theme 氛围边界：典藏暖光偏温润古典，夜游解谜偏悬疑潜行，未来科考偏数字修复与探索，手账探索偏笔记与纸页感。',
      'storyStyle 写法边界：魔幻=神秘召唤、隐秘异象、仿佛器物有灵但不幼稚；科幻=扫描、终端、异常档案、系统修复、数字考古；历史穿越=古今错位、时空回声、像与过去的人隔空接力；冒险=探险队、路线推进、线索追踪、现场发现。',
      '请像真正的作者一样自由写作，不要为了整齐而重复相同句式、相同比喻、相同开场装置。不同任务可以从不同角度切入，例如一张便笺、一段巡馆记录、一处展柜反光、一次档案修复、一条路线误差、一个讲解员批注，但不要机械轮换。',
      '同一组展品在不同 storyStyle 下，任务序列应该让人明显感觉是不同版本，而不是只换几个词。',
      'story 字段：写成本关任务开场，100-180 字，像背景故事进入具体展品时的一个场景切面，有画面、有动作或发现，不要写成课程说明。',
      'selfIntro 字段：写成文物的第一人称自我介绍，1-2 句，像文物在对学生低声说话。要有性格、有历史气息，但不要直接说出自己的完整官方名称。',
      'hint 字段：写成谜题提示短文，2-4 行即可，像探险中的线索，而不是分点说明。但它必须真的可解，不能只营造氛围。',
      'hint 至少要稳定给出三类有效线索：1. 展区或附近陈列关系；2. 学生肉眼可见的外观/材质/纹样/文字/造型特征；3. 可通过展签验证的年代、用途、文明背景或交流信息。',
      '三类线索需要自然织进故事化表达里，不要直接写出完整名称，但必须让学生把这些线索拼起来后，大致能锁定目标，而不是只能碰运气。',
      'requirement 字段：写成两行即可。第一行以“实地行动：”开头，引导学生去指定展区寻找并拍摄；第二行以“课堂表达：”开头，引导学生用符合年级和学科的语言说出证据关系。除此之外不需要再加格式要求。',
      'teacherNote 字段：写成教师内部备课备注，结构清楚但语气自然。必须包含完整官方名称、馆藏机构或来源信息、与课标匹配的讲解切口和一个可追问的问题。',
      'title 保持简洁有记忆点，但不要为了文学感而悬空；它应该和该展品的材料、用途、纹样、时代或交流主题真正相关。',
      'answer 字段写教师答案摘要，可以出现完整藏品名称；minutes 使用 8-14 的整数。',
      'submission 字段也必须跟随输出语言：中文可写“照片上传 + 简短观察”，英文可写 “Photo upload + short observation”。',
      '控制整体长度，避免卡片过长；不要额外增加分割线、标题、特殊符号。',
      `输入 JSON：${context}`,
    ].join('\n');
  }

  if (type === 'activity_background') {
    return [
      '你是 MUSEUMAX 博物馆研学总叙事作者。请在任务生成之前，先为整场活动写一个统一的背景故事，奠定后续所有任务的故事基调。',
      '只返回 JSON，不要 Markdown，格式为 {"paragraphs":["...","..."]}。',
      `这次输出语言必须是${outputLanguage}。如果输入 JSON 中 language 为 en，paragraphs 必须全部用自然英文；如果 language 为 zh，则全部用中文。不要混用。`,
      '写 2 段，每段 100-170 字。',
      '这段背景故事用于老师端任务生成预览，也会在学生端完成组队后首先展示，所以必须像整场冒险的序章，而不是某一件展品的任务提示。',
      '叙事风格必须严格匹配输入的 theme 和 storyStyle。theme 决定氛围质感，storyStyle 决定序章的叙事方式。',
      'storyStyle 写法边界：魔幻=像被某种不可见力量召唤入局；科幻=像接到一段异常任务或档案修复请求；历史穿越=像收到来自过去的回声或误投信件；冒险=像拿到路线图、线索卡或入场挑战。',
      '必须自然点出本次研学目标、博物馆场域和“即将围绕多件展品展开探索”的整体设定，但不要提前剧透具体任务答案。',
      '文字要有画面感和故事性，不能写成课程说明、系统提示、教师口吻或操作指南。两段之间允许有情绪推进和悬念。',
      `输入 JSON：${context}`,
    ].join('\n');
  }

  if (type === 'final_story') {
    return [
      '你是 MUSEUMAX 学生端长线成果故事作者。请根据学生实际完成任务顺序生成一段有小说阅读感的最终冒险故事。',
      '只返回 JSON，不要 Markdown，格式为 {"paragraphs":["...","...","...","..."]}。',
      `这次输出语言必须是${outputLanguage}。如果输入 JSON 中 language 为 en，paragraphs 必须全部用自然英文；如果 language 为 zh，则全部用中文。不要混用。`,
      '固定基础设定必须全部写入：故事背景是大英博物馆 90 分钟“时光探险”研学课；唯一队员是 L，身份是小队专属纹样解码师；核心课题主线是“探索文明交流如何改变人类生活”。',
      '人物塑造必须贯穿全文：L 随身带放大镜，习惯描摹文物纹样，会对着古老文字低声解读；必须写出疑惑、顿悟、惊叹或成长变化，不能把 L 写成工具人。',
      '必须保留并贯穿“星图”道具：星图在开头出现，中段作为伏笔推进，结尾完成情绪升华。',
      '文风必须严格匹配输入 theme：典藏暖光=复古温润、书卷气、缓慢细腻；夜游解谜=沉静悬疑、展厅光影；未来科考=轻快科幻、数字全息、档案数字化；手账探索=柔和文艺、笔记和手绘纹样。',
      '必须遵守输入 completedMissions 的顺序，不调换、不删减；但禁止写成“先去了A，再去了B”的列举式摘要，也不要把任务标题一串一串摆出来。',
      '输入 completedMissions 中已经给了每次经历的 story、selfIntro、hint 和 completer。请把这些信息改写成真实发生过的场景：学生走到哪里，看见什么，停下来想了什么，又是怎样被下一段线索牵着继续往前。',
      '每一段经历都要写成正在发生的故事片段，而不是对任务卡内容的总结。要让读者感觉是在看一段连续冒险，而不是看复盘提纲。',
      '历史知识点必须贴合输入 grade 和 subject 的课标范围，自然融入剧情，不单独罗列知识点，不做超纲扩展。',
      '结尾禁止生硬总结课程结论，必须通过 L 的人物感悟自然升华。',
      '篇幅适中，每段 100-170 字，避免卡片溢出。',
      `输入 JSON：${context}`,
    ].join('\n');
  }

  throw new Error('未知文本生成类型。');
}

function buildAzureEndpointUrl(endpoint: string, deployment: string, apiVersion: string) {
  const url = new URL(endpoint);
  if (url.pathname && url.pathname !== '/') {
    return url.toString();
  }
  return `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
}

function buildChatCompletionsBody(prompt: string, imageDataUrl: string, targetReference: string) {
  const content: Array<Record<string, unknown>> = [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: imageDataUrl } },
  ];

  if (targetReference.startsWith('http') || targetReference.startsWith('data:image/')) {
    content.push({ type: 'text', text: '下面是目标展品参考图，请和学生照片进行对比。' });
    content.push({ type: 'image_url', image_url: { url: targetReference } });
  }

  return {
    messages: [
      { role: 'system', content: '你擅长根据博物馆展品照片、展签和参考资料做谨慎判断。无法确认时必须返回 matched:false。' },
      { role: 'user', content },
    ],
    temperature: 0.1,
    max_tokens: 500,
  };
}

function buildResponsesBody(model: string, prompt: string, imageDataUrl: string, targetReference: string) {
  const content: Array<Record<string, unknown>> = [
    { type: 'input_text', text: prompt },
    { type: 'input_image', image_url: imageDataUrl },
  ];

  if (targetReference.startsWith('http') || targetReference.startsWith('data:image/')) {
    content.push({ type: 'input_text', text: '下面是目标展品参考图，请和学生照片进行对比。' });
    content.push({ type: 'input_image', image_url: targetReference });
  }

  return {
    model,
    input: [
      { role: 'system', content: '你擅长根据博物馆展品照片、展签和参考资料做谨慎判断。无法确认时必须返回 matched:false。' },
      { role: 'user', content },
    ],
    max_output_tokens: 500,
  };
}

function buildTextChatCompletionsBody(prompt: string) {
  return {
    messages: [
      { role: 'system', content: '你是专业的博物馆研学内容生成助手。输出必须稳定、简洁、严格符合 JSON 格式，且字段完整。' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.75,
    max_tokens: 2600,
  };
}

function buildTextResponsesBody(model: string, prompt: string) {
  return {
    model,
    input: [
      { role: 'system', content: '你是专业的博物馆研学内容生成助手。输出必须稳定、简洁、严格符合 JSON 格式，且字段完整。' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.75,
    max_output_tokens: 2600,
  };
}

function extractAzureText(data: Record<string, unknown>) {
  if (typeof data.output_text === 'string') return data.output_text;
  const choiceContent = (data.choices as Array<{ message?: { content?: unknown } }> | undefined)?.[0]?.message?.content;
  if (typeof choiceContent === 'string') return choiceContent;
  if (Array.isArray(choiceContent)) {
    return choiceContent.map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item?.text === 'string') return item.text;
      return typeof item?.content?.[0]?.text === 'string' ? item.content[0].text : '';
    }).join('');
  }
  const output = data.output as Array<{ content?: Array<{ text?: string; type?: string }> }> | undefined;
  return output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? '').join('') ?? '';
}

function parseAzureJson(content: unknown) {
  const text = typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.map((item) => item?.text ?? item?.content?.[0]?.text ?? '').join('')
      : '';
  const normalizedText = text
    .replace(/```json/gi, '```')
    .trim();
  const fencedMatch = normalizedText.match(/```([\s\S]*?)```/);
  const sourceText = fencedMatch?.[1]?.trim() || normalizedText;
  const jsonText = extractFirstJsonObject(sourceText);
  return JSON.parse(jsonText) as Record<string, unknown>;
}

async function requestAzurePayload(endpointUrl: string, apiKey: string, responseBody: Record<string, unknown>, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(responseBody),
      signal: controller.signal,
    });

    const rawText = await response.text();
    const data = rawText.trim() ? tryParseJsonObject(rawText) : {};
    if (!response.ok) {
      throw new Error(readAzureErrorMessage(data, rawText));
    }
    return data as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Azure AI 文本生成超时，请稍后重试。');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function tryParseJsonObject(rawText: string) {
  try {
    return JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function readAzureErrorMessage(data: Record<string, unknown>, rawText: string) {
  const nestedError = data.error as { message?: string } | undefined;
  if (nestedError?.message) return nestedError.message;
  const normalized = rawText
    .replace(/\s+/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .trim();
  if (!normalized) return 'Azure AI 文本生成请求失败。';
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function validateTextGenerationPayload(type: string, payload: Record<string, unknown>) {
  if (type === 'missions') {
    if (!Array.isArray(payload.missions) || payload.missions.length === 0) {
      throw new Error('Azure AI 返回的任务结构不完整。');
    }
    return payload;
  }

  if (type === 'activity_background' || type === 'final_story') {
    if (!Array.isArray(payload.paragraphs) || payload.paragraphs.length === 0) {
      throw new Error('Azure AI 返回的故事结构不完整。');
    }
    return payload;
  }

  return payload;
}

function shouldRetryTextGeneration(error: Error, attempt: number) {
  if (attempt > 0) return false;
  return [
    '超时',
    'JSON',
    '结构不完整',
    'Unterminated string',
    'Unexpected token',
    'Unexpected end',
    '请求失败',
  ].some((keyword) => error.message.includes(keyword));
}

function extractFirstJsonObject(text: string) {
  const start = text.indexOf('{');
  if (start === -1) return text;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;

    if (depth === 0) {
      return text.slice(start, index + 1);
    }
  }

  return text.slice(start);
}
