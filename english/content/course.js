/** Original advanced-English practice. Activities are not a standardized level test. */
export const tracks = [
  {
    "id": "precision",
    "title": "表达精确",
    "subtitle": "Say exactly what you mean"
  },
  {
    "id": "register",
    "title": "语气与场合",
    "subtitle": "Fit the relationship and the moment"
  },
  {
    "id": "flow",
    "title": "思路与节奏",
    "subtitle": "Make the next sentence easy to follow"
  },
  {
    "id": "stance",
    "title": "判断与立场",
    "subtitle": "Be clear about what you stand behind"
  },
  {
    "id": "interaction",
    "title": "真实交流",
    "subtitle": "Clarify, respond, and keep things moving"
  },
  {
    "id": "story",
    "title": "讲述与细节",
    "subtitle": "Make an experience worth listening to"
  }
];

export const lessons = [
  {
    "id": "precision-01",
    "track": "precision",
    "title": "事实之后，别多走一步",
    "subtitle": "Observation is not explanation",
    "minutes": 18,
    "objective": "把观察、推断和待验证的原因分开，同时保留有用的判断。",
    "brief": "精确表达不是给每句话加 maybe，而是知道哪一步有证据。时间先后可以报告，因果关系需要另外说明。原句可以语法正确，却让听者误以为一个推断已经被证实。",
    "example": {
      "before": "The new onboarding flow improved retention. Repeat visits rose after the launch.",
      "after": "Repeat visits rose after the new onboarding flow launched. That is consistent with an improvement, but we cannot yet separate its effect from the seasonal increase.",
      "note": "after把能观察到的变化放在前面，并点出具体的竞争解释。它没有否认新流程可能有效，也没有把相关性当作因果。"
    },
    "questions": [
      {
        "id": "precision-01-q1",
        "prompt": "A satisfaction score rose after a redesign. The users surveyed also changed. Which update best preserves the finding without claiming a cause?",
        "options": [
          "The redesign improved satisfaction, although the respondents also changed.",
          "Satisfaction scores rose after the redesign, but the change in respondents makes the cause unclear.",
          "Satisfaction among the same users improved after the redesign.",
          "The redesign appears successful because the new respondents gave higher scores."
        ],
        "answer": 1,
        "explanation": "B报告实际变化，并指出样本变化限制了因果判断。A和D把结果归因于改版；C则误称比较的是同一批用户。"
      },
      {
        "id": "precision-01-q2",
        "prompt": "You observed fewer failed uploads, but did not measure user frustration. Which sentence stays within what you measured?",
        "options": [
          "Users found the upload process less frustrating during the test.",
          "The upload process required less effort from users.",
          "The observed upload failure rate fell during the test.",
          "Users needed less help to complete an upload."
        ],
        "answer": 2,
        "explanation": "C的对象就是被测量的失败率。其他句子可能成立，但需要额外证据。"
      },
      {
        "id": "precision-01-q3",
        "prompt": "You think a delivery delay contributed to cancellations, but price changes are another plausible explanation. Which sentence presents your hypothesis responsibly?",
        "options": [
          "The delay may have contributed to cancellations; we should also examine the price change.",
          "The delay explains the cancellations, with price playing a secondary role.",
          "The price change is unlikely to matter because the delivery delay came first.",
          "We should describe the cancellations without mentioning any possible explanation."
        ],
        "answer": 0,
        "explanation": "A提出可继续检验的假设，同时保留竞争解释。精确不意味着必须完全不作判断。"
      }
    ],
    "task": {
      "prompt": "Write a four-sentence research update. A trial group completed more tasks than last month, but the tasks were easier and the group was smaller. State the observation, offer a tentative explanation, name a competing explanation, and propose a useful next check.",
      "model": "The trial group completed more tasks than last month. The revised workflow may have helped, but the tasks were also easier and the group was smaller. We therefore cannot attribute the increase to the workflow alone. A useful next check would compare completion on tasks of similar difficulty and report the result per participant.",
      "notes": [
        "先写观察，不在第一句就宣布成功。",
        "把不确定放在归因上，而不是把已观察到的数据也说得含糊。",
        "其他表达也成立，只要没有把未测量的效果写成事实。"
      ],
      "checklist": [
        "我报告的是实际被测量的结果。",
        "推断与观察有明确区分。",
        "我指出了一项具体替代解释。",
        "下一步检查能够帮助区分解释。"
      ]
    },
    "chunks": [
      {
        "id": "precision-01-c1",
        "text": "That is consistent with ...",
        "meaning": "这与某种解释相符，但不等于已经证明。",
        "example": "That is consistent with a seasonal effect, though it does not establish one.",
        "prompt": "Introduce an explanation that fits the evidence without calling it proven."
      },
      {
        "id": "precision-01-c2",
        "text": "We cannot yet separate ... from ...",
        "meaning": "暂时无法区分两种因素的影响。",
        "example": "We cannot yet separate the effect of the training from the effect of extra supervision.",
        "prompt": "Say that two possible influences are still mixed together."
      },
      {
        "id": "precision-01-c3",
        "text": "The data show ...; they do not tell us ...",
        "meaning": "明确证据能够与不能够回答的问题。",
        "example": "The data show fewer complaints; they do not tell us whether users found the process easier.",
        "prompt": "Draw a clear boundary around what a dataset establishes."
      }
    ]
  },
  {
    "id": "precision-02",
    "track": "precision",
    "title": "把范围说清楚",
    "subtitle": "Scope, comparison, and exceptions",
    "minutes": 17,
    "objective": "说明结论适用于谁、相对于什么，以及有哪些例外。",
    "brief": "all、most、some和on average改变的是陈述范围，不是装饰。比较句还需要可识别的基准。听者不应该替你猜“更快”是比上周、旧版本，还是其他人更快。",
    "example": {
      "before": "The new process is faster, and users prefer it.",
      "after": "In this trial, the median completion time was shorter than with the old process. Most respondents preferred the new version, although first-time users were more evenly split.",
      "note": "after补上范围、比较对象和例外。若没有这些信息，应承认不知道，不应为了具体而编造。"
    },
    "questions": [
      {
        "id": "precision-02-q1",
        "prompt": "Seven of ten interviewees preferred option A. Which summary is accurate without generalizing beyond the interviews?",
        "options": [
          "The interviews confirm that customers prefer option A.",
          "Option A is preferred by nearly everyone.",
          "Most of the people we interviewed preferred option A.",
          "The preference for option A is consistent across the customer base."
        ],
        "answer": 2,
        "explanation": "C限定在已采访的人，七比十也支持most。A和D把结果推广到更大用户群；B把多数夸大为几乎所有人。"
      },
      {
        "id": "precision-02-q2",
        "prompt": "The average response time fell, but the slowest responses became slower. Which summary preserves both facts?",
        "options": [
          "Responses generally became faster, including the slowest cases.",
          "The average improved, though the slowest responses took longer.",
          "Response times became more consistent as the average fell.",
          "The average improved, so the slower cases are unlikely to matter."
        ],
        "answer": 1,
        "explanation": "平均值改善与尾部恶化可以同时成立。B不把平均表现外推到每一次响应，也不编造重要性判断。"
      },
      {
        "id": "precision-02-q3",
        "prompt": "You mean that cost is one consideration, but not the only one. Which sentence says that?",
        "options": [
          "Cost is not a consideration.",
          "Cost is a consideration we can set aside.",
          "Cost matters more than the other considerations.",
          "Cost is not the only consideration."
        ],
        "answer": 3,
        "explanation": "not the only否定的是“唯一”，不是否定cost本身的相关性。"
      }
    ],
    "task": {
      "prompt": "Rewrite this update using only the facts supplied: “Everyone found the pilot easier, and it was faster.” Facts: 12 of 18 participants said it was easier; experienced participants finished sooner than in the old version; first-time participants took about the same time.",
      "model": "Twelve of the eighteen pilot participants said the new version was easier to use. Experienced participants finished sooner than they did in the old version, while first-time participants took about the same time. The speed improvement in this pilot therefore appears concentrated among experienced users.",
      "notes": [
        "数字与受访范围比everyone更准确。",
        "最后一句是对已给事实的有限归纳，不代表未来所有用户。",
        "可以省去最后一句，但不能省掉初次使用者这一重要例外。"
      ],
      "checklist": [
        "范围是否限定在这次试用？",
        "比较对象是否明确？",
        "平均或多数是否被写成全部？",
        "例外是否影响读者的判断？"
      ]
    },
    "chunks": [
      {
        "id": "precision-02-c1",
        "text": "Among the people we spoke to, ...",
        "meaning": "把结论限定在接触过的样本中。",
        "example": "Among the people we spoke to, reliability mattered more than extra features.",
        "prompt": "Limit a finding to the people actually interviewed."
      },
      {
        "id": "precision-02-c2",
        "text": "Compared with the previous version, ...",
        "meaning": "明确比较基准。",
        "example": "Compared with the previous version, this one takes less time to set up.",
        "prompt": "State what your comparison is against."
      },
      {
        "id": "precision-02-c3",
        "text": "That was not true of every ...",
        "meaning": "保留总体趋势，同时指出并非全部如此。",
        "example": "Most teams adapted quickly, but that was not true of every team.",
        "prompt": "Add a measured exception to a broad pattern."
      }
    ]
  },
  {
    "id": "precision-03",
    "track": "precision",
    "title": "让动词承担意思",
    "subtitle": "Clear verbs, accurate agency",
    "minutes": 16,
    "objective": "减少不必要的名词化，同时准确说明谁做了什么。",
    "brief": "把conduct a review改成review常能让句子更短，但正式名词并非错误。真正的标准是读者能否看清动作、负责人和影响程度。不要为了主动语态而虚构执行者，也不要把help改写成solve。",
    "example": {
      "before": "We will carry out a review of the notes and provide a clarification of the remaining issues.",
      "after": "We will review the notes and clarify the remaining issues.",
      "note": "信息和承诺不变，只把动作放回动词。法律、流程或技术文件有时需要保留正式名词，应按用途决定。"
    },
    "questions": [
      {
        "id": "precision-03-q1",
        "prompt": "For a short internal update, you want the same meaning with fewer words. Which is the best revision of “We conducted an evaluation of the proposals”?",
        "options": [
          "We evaluated the proposals.",
          "We reviewed and approved the proposals.",
          "We completed the proposals.",
          "We resolved the issues in the proposals."
        ],
        "answer": 0,
        "explanation": "A把名词化结构改成动词，仍然只表示评估。批准、完成提案或解决问题都增加了原句没有承诺的动作。"
      },
      {
        "id": "precision-03-q2",
        "prompt": "You know a file was deleted but do not know who deleted it. Which sentence is most accurate?",
        "options": [
          "An unidentified employee deleted the file.",
          "The file was deleted during a routine cleanup.",
          "The file was deleted; we have not established who deleted it.",
          "The file was accidentally deleted by someone on the team."
        ],
        "answer": 2,
        "explanation": "C保留未知的执行者。被动语态在这里有信息上的理由，不能一律视为坏写法。"
      },
      {
        "id": "precision-03-q3",
        "prompt": "A checklist reduced mistakes but did not eliminate them. Which verb phrase keeps that distinction?",
        "options": [
          "resolved the recurring mistakes",
          "helped reduce mistakes",
          "prevented mistakes in the reviewed work",
          "made a separate review unnecessary"
        ],
        "answer": 1,
        "explanation": "helped reduce既表达贡献，也保留错误仍存在的事实。更强的动词会改变结论。"
      }
    ],
    "task": {
      "prompt": "Make this message clearer without adding responsibility or certainty: “A review of the draft has been completed. There is a need for a clarification of the deadline. The checklist made a contribution to the reduction of omissions.” You do not know who reviewed the draft.",
      "model": "The draft has been reviewed. We still need to clarify the deadline. The checklist helped reduce omissions.",
      "notes": [
        "第一句保留被动，因为执行者未知。",
        "第二句的we表示团队需要处理的事情；若团队身份也未知，可用The deadline still needs to be clarified。",
        "第三句保留helped，避免把部分贡献写成完全解决。"
      ],
      "checklist": [
        "删掉词语后，动作是否仍是同一个？",
        "我有没有猜测执行者？",
        "影响程度有没有被夸大？",
        "每句话是否容易找到主要动作？"
      ]
    },
    "chunks": [
      {
        "id": "precision-03-c1",
        "text": "We still need to clarify ...",
        "meaning": "明确尚待弄清的事项。",
        "example": "We still need to clarify who will review the final draft.",
        "prompt": "Name the specific point that remains unclear."
      },
      {
        "id": "precision-03-c2",
        "text": "This helped reduce ...",
        "meaning": "表达部分贡献，不承诺完全消除。",
        "example": "This helped reduce duplicate work, although some overlap remained.",
        "prompt": "Describe a useful but incomplete improvement."
      },
      {
        "id": "precision-03-c3",
        "text": "The remaining question is ...",
        "meaning": "把注意力集中到尚未回答的问题。",
        "example": "The remaining question is whether the result holds outside the pilot.",
        "prompt": "Move from completed work to the unresolved issue."
      }
    ]
  },
  {
    "id": "precision-04",
    "track": "precision",
    "title": "区分能力、计划和承诺",
    "subtitle": "What exactly are you committing to?",
    "minutes": 18,
    "objective": "让时间安排和情态动词准确反映自己的承诺。",
    "brief": "can表示能力或可行性，plan to表示计划，will常在具体语境中形成承诺。一个deadline也可能指初稿、评审稿或可发布版本。把承诺对象和条件说清，比模糊地说soon更有用。",
    "example": {
      "before": "I can send it on Friday.",
      "after": "I plan to send the review draft on Friday. The final version depends on the legal review, which is still pending.",
      "note": "before并非错误，但it和can留下了两个问题：发什么版本，是否已经承诺。after明确计划及其边界。"
    },
    "questions": [
      {
        "id": "precision-04-q1",
        "prompt": "You are confident you can deliver a draft on Thursday, but cannot promise final approval. Which commitment is appropriately bounded?",
        "options": [
          "I expect the report to be approved and delivered on Thursday.",
          "I will send a draft on Thursday; final approval is a separate step.",
          "I will send the report on Thursday once everyone has approved it.",
          "Thursday is our deadline for completing the report and its approval."
        ],
        "answer": 1,
        "explanation": "B对自己可控制的交付作明确承诺，并把审批单独说明。"
      },
      {
        "id": "precision-04-q2",
        "prompt": "You have capacity to help, but have not agreed to take ownership. Which statement communicates availability without claiming ownership?",
        "options": [
          "I will own the review from here.",
          "I have made the review my responsibility.",
          "I can help with the review if that would be useful.",
          "I will make sure the full review is completed."
        ],
        "answer": 2,
        "explanation": "C提供帮助，没有把自己变成整件事的负责人。"
      },
      {
        "id": "precision-04-q3",
        "prompt": "A deadline is possible only if feedback arrives by Tuesday. Which wording makes that condition clear?",
        "options": [
          "We can send the revision on Friday, provided we receive feedback by Tuesday.",
          "We can send the revision on Friday and collect any remaining feedback afterward.",
          "We expect feedback by Tuesday, so Friday is now a confirmed delivery date.",
          "We will send the revision on Friday; the feedback deadline is flexible."
        ],
        "answer": 0,
        "explanation": "provided明确交付依赖的条件，不把输入条件当成既定事实。"
      }
    ],
    "task": {
      "prompt": "Reply to a colleague asking, “Can we promise the client a finished report on Monday?” You can provide a complete draft on Monday. Two figures still require verification, and you expect that check to finish on Wednesday. Be useful without making a promise you cannot support.",
      "model": "We can commit to a complete draft on Monday. I would not promise a final report yet, because two figures still need to be verified. We expect that check to finish on Wednesday; once it is complete, we can confirm the final delivery date. If the client mainly needs the recommendations, we can highlight those in Monday’s draft.",
      "notes": [
        "把可承诺的draft放在前面。",
        "expect不是保证；最终日期仍需确认。",
        "最后提出能满足对方部分需求的具体选项，而不是只说不行。"
      ],
      "checklist": [
        "交付物的版本是否明确？",
        "哪些是承诺，哪些是预期？",
        "依赖条件是否可见？",
        "对方是否知道现在能依赖什么？"
      ]
    },
    "chunks": [
      {
        "id": "precision-04-c1",
        "text": "We can commit to ...",
        "meaning": "明确承诺的具体范围。",
        "example": "We can commit to a first draft by the end of the week.",
        "prompt": "State the deliverable you are prepared to promise."
      },
      {
        "id": "precision-04-c2",
        "text": "Provided we receive ...",
        "meaning": "明确可行性所依赖的条件。",
        "example": "We can complete the review on Thursday, provided we receive the data on Monday.",
        "prompt": "Attach a specific input condition to a deadline."
      },
      {
        "id": "precision-04-c3",
        "text": "That is a target, rather than a confirmed date.",
        "meaning": "说明日期是目标，还不是确认的承诺。",
        "example": "We are aiming for early May, but that is a target, rather than a confirmed date.",
        "prompt": "Clarify that a date is provisional without abandoning the plan."
      }
    ]
  },
  {
    "id": "register-01",
    "track": "register",
    "title": "写一封对方能马上处理的邮件",
    "subtitle": "A clear request can still be courteous",
    "minutes": 17,
    "objective": "用适量背景提出可执行的请求，避免堆叠客套和模糊要求。",
    "brief": "简洁与礼貌可以同时成立。需要对方做什么、为什么现在需要、什么时候回复，比多层just、perhaps、possibly更重要。但面对陌生人或较大请求，适当铺垫仍有价值。",
    "example": {
      "before": "I was just wondering whether you might possibly have a chance to look at the attached document when you have a moment.",
      "after": "Could you review the two highlighted assumptions by Thursday? We need your input before we finalize the estimate.",
      "note": "after明确工作范围、时间和用途。不是所有邮件都必须这样短，但请求应让对方容易判断工作量。"
    },
    "questions": [
      {
        "id": "register-01-q1",
        "prompt": "A colleague has agreed to review your draft. You now need feedback on only two paragraphs by tomorrow. Which message is clearest and still courteous?",
        "options": [
          "Could you take another look at the document when you have time?",
          "Could you review the two highlighted paragraphs by tomorrow afternoon? Those are the only sections I need feedback on.",
          "Would you mind reviewing the full draft again before tomorrow?",
          "Please prioritize the document; your feedback would be very helpful."
        ],
        "answer": 1,
        "explanation": "B与已经同意的范围一致，明确两段和截止时间。A、D需要对方继续猜范围或时间；C扩大成整份草稿。"
      },
      {
        "id": "register-01-q2",
        "prompt": "You are contacting someone for the first time to request a 20-minute interview. Which opening gives useful context without presuming agreement?",
        "options": [
          "I would like to schedule twenty minutes with you next week; please send your availability.",
          "Thank you for agreeing to an interview about handovers. When are you free?",
          "I am studying how small teams handle handovers. Would you be open to a 20-minute interview about your experience?",
          "I am collecting information about teams and would appreciate any assistance you can provide."
        ],
        "answer": 2,
        "explanation": "C提供身份目的和明确请求，同时允许对方决定是否接受。第一次联系需要这些背景。"
      },
      {
        "id": "register-01-q3",
        "prompt": "Your message requires an answer by Friday, but the recipient may be unable to help. Which ending is most useful?",
        "options": [
          "Please let me know by Friday whether you can take this on; if not, I will ask someone else.",
          "Thanks in advance for taking this on; I look forward to the finished work on Friday.",
          "Let me know when you have a chance, as the work needs to be assigned by Friday.",
          "Unless I hear otherwise, I will assume you can complete this by Friday."
        ],
        "answer": 0,
        "explanation": "A让接受和拒绝都可操作，没有把沉默解释为同意。"
      }
    ],
    "task": {
      "prompt": "Write a short email asking a busy colleague to check one chart. You need them to verify the units and the date range by 3 p.m. tomorrow. The chart will go into a client presentation. Make it easy for them to decline if they cannot fit it in.",
      "model": "Subject: Quick check of chart units and dates\n\nCould you check the units and date range in the attached chart by 3 p.m. tomorrow? It is going into the client presentation, and those are the two points I need verified.\n\nIf you cannot fit this in, please let me know today and I will find another reviewer. Thanks for your help.",
      "notes": [
        "quick只有在范围确实小的时候才合适，不能代替说明工作量。",
        "不要把整张图的全部质量责任暗中转给同事。",
        "结尾给出合理退出方式和后续处理。"
      ],
      "checklist": [
        "请求是否能用一句话概括？",
        "范围与截止时间是否明确？",
        "背景是否足够但不过量？",
        "拒绝或调整的路径是否清楚？"
      ]
    },
    "chunks": [
      {
        "id": "register-01-c1",
        "text": "Could you check ... by ...?",
        "meaning": "提出具体事项与截止时间。",
        "example": "Could you check the totals by noon tomorrow?",
        "prompt": "Ask for one clearly bounded check and give a deadline."
      },
      {
        "id": "register-01-c2",
        "text": "Those are the only points I need feedback on.",
        "meaning": "限制反馈范围，降低对方的猜测成本。",
        "example": "I have highlighted two assumptions; those are the only points I need feedback on.",
        "prompt": "Make clear that you are not asking for a full review."
      },
      {
        "id": "register-01-c3",
        "text": "If you cannot fit this in, ...",
        "meaning": "给对方实际拒绝或调整安排的空间。",
        "example": "If you cannot fit this in, let me know and I will ask another reviewer.",
        "prompt": "Offer an uncomplicated way to decline a request."
      }
    ]
  },
  {
    "id": "register-02",
    "track": "register",
    "title": "把英语说得像在聊天",
    "subtitle": "Warmth without trying too hard",
    "minutes": 16,
    "objective": "在轻松交流中给出具体回应、适量自我分享和自然追问。",
    "brief": "随意不等于满口俚语。一个具体反应加一个相关问题，通常比正式评价或连续盘问更自然。缩略形式如that’s、I’ve适合很多日常场合，但也不必为了“地道”强行塞入。",
    "example": {
      "before": "Your weekend activity sounds highly interesting. Please provide further details.",
      "after": "That sounds fun. Was it your first time trying it?",
      "note": "两句都能理解，after更适合朋友随口提到周末活动的场合。正式措辞在玩笑中也可能成立，但这里不预设这种关系。"
    },
    "questions": [
      {
        "id": "register-02-q1",
        "prompt": "A friend says, “I finally tried the little bakery near the station.” You are casually curious. Which reply fits best?",
        "options": [
          "Could you prepare a written review of the bakery?",
          "Nice—what did you get?",
          "I have not visited, so I cannot offer a view on it.",
          "You should try the bakery across town instead."
        ],
        "answer": 1,
        "explanation": "B承接朋友刚说的细节，并给对方一个容易回答的问题。这里不需要正式评价口吻。"
      },
      {
        "id": "register-02-q2",
        "prompt": "A colleague mentions taking a long walk after work. You want to share briefly and keep the conversation open. Which response does that?",
        "options": [
          "Regular walking has a number of documented benefits.",
          "I have been doing that too. Let me describe all my routes before you continue.",
          "I have been doing that too. Do you have a regular route?",
          "That reminds me—I need to tell you about an unrelated work issue."
        ],
        "answer": 2,
        "explanation": "C先连接自己的经历，再把话题交还对方。它不是唯一可行表达，但符合本题的轻松交流目标。"
      },
      {
        "id": "register-02-q3",
        "prompt": "A new acquaintance says they have had a busy week. You want to be friendly without pressing for private details. Which reply is most appropriate?",
        "options": [
          "What exactly has happened at home to make the week so difficult?",
          "You should explain why you accepted so much work.",
          "I know how you feel; your week was probably just like mine.",
          "Sounds like a lot. Anything you are looking forward to this weekend?"
        ],
        "answer": 3,
        "explanation": "D承认对方的状态，并给出可以轻松回应的方向。没有要求对方披露私人问题。"
      }
    ],
    "task": {
      "prompt": "A friend says, “I started taking a pottery class, but everything I make is a little crooked.” Write a two- or three-sentence reply. Show interest, respond to the joke gently, and ask one related question. Do not pretend you have experience you do not have.",
      "model": "Honestly, a slightly crooked mug has character. Are you enjoying the class so far? I would be curious to see what you make next.",
      "notes": [
        "轻松接住crooked这个细节，而不是泛泛说That is amazing。",
        "没有编造自己的陶艺经历。",
        "幽默并非必需；That sounds fun—what have you made so far?也可能自然。"
      ],
      "checklist": [
        "我回应了对方的一个具体细节。",
        "追问与刚才的话题相关。",
        "没有把交流变成盘问或独白。",
        "语气符合关系，不靠夸张赞美撑场。"
      ]
    },
    "chunks": [
      {
        "id": "register-02-c1",
        "text": "How did that go?",
        "meaning": "追问刚发生的活动或经历。",
        "example": "You tried the new class, right? How did that go?",
        "prompt": "Ask about the outcome of something the other person mentioned."
      },
      {
        "id": "register-02-c2",
        "text": "I have been meaning to try that.",
        "meaning": "表示一直有意尝试，但尚未做；只有真实如此才用。",
        "example": "I have been meaning to try that place. What would you recommend?",
        "prompt": "Show interest in an activity you genuinely intend to try."
      },
      {
        "id": "register-02-c3",
        "text": "Anything you are looking forward to?",
        "meaning": "轻松地邀请对方分享期待的事情。",
        "example": "It has been a long week. Anything you are looking forward to?",
        "prompt": "Move a casual conversation toward a positive future plan."
      }
    ]
  },
  {
    "id": "register-03",
    "track": "register",
    "title": "坚定，不必尖锐",
    "subtitle": "Directness with a reason",
    "minutes": 18,
    "objective": "在不同关系中明确提出问题，避免用礼貌外壳掩盖指责。",
    "brief": "with all due respect并不会自动让后面的攻击变礼貌。把问题落到具体内容、影响和可修改之处，更利于对方回应。需要直接说no时，可以直接，但不必额外评价对方能力或动机。",
    "example": {
      "before": "With all due respect, your conclusion makes no sense.",
      "after": "I do not think the conclusion follows from this comparison. The two groups differed before the trial started.",
      "note": "after明确反对哪一步，并给出理由。语气没有变成含糊赞同，也没有针对人。"
    },
    "questions": [
      {
        "id": "register-03-q1",
        "prompt": "You disagree with a colleague’s inference, not their data. Which sentence targets the actual issue?",
        "options": [
          "I am not sure the data are reliable.",
          "I think we need different figures before we discuss this.",
          "I agree with the figures, but I do not think they support that conclusion.",
          "I am not convinced that the analyst understands the issue."
        ],
        "answer": 2,
        "explanation": "C准确区分数据与推论。针对推理提出异议，不暗示数据本身也被否定。"
      },
      {
        "id": "register-03-q2",
        "prompt": "A recurring late handover is blocking your work. You need a firm, professional request. Which is best?",
        "options": [
          "The team needs to show more respect for other people’s time.",
          "Please send the handover by 4 p.m.; when it arrives later, we cannot complete the same-day checks.",
          "Send the handover whenever you can; earlier would be better.",
          "Could you explain why you keep making the handover difficult for everyone?"
        ],
        "answer": 1,
        "explanation": "B给出具体行为、时点和后果。坚定来自清楚，不需要猜对方的态度或过度道歉。"
      },
      {
        "id": "register-03-q3",
        "prompt": "A peer asks for blunt feedback on a draft. You want to say the main point arrives too late. Which response is direct and actionable?",
        "options": [
          "The draft does not yet feel as strong as it could.",
          "I would make it more engaging and professional throughout.",
          "You should rethink your overall approach to writing.",
          "I would move the recommendation to the opening; readers currently reach it only in the final paragraph."
        ],
        "answer": 3,
        "explanation": "D提出具体位置与修改方向。对方要求直接反馈，不等于要求人身评价。"
      }
    ],
    "task": {
      "prompt": "Rewrite this message for a colleague you respect: “Your instructions are confusing, and this always wastes everyone’s time.” The concrete problem is that the instructions do not say which file to use. Ask for a fix before the next handover.",
      "model": "The instructions do not specify which file to use, so we have had to check before starting. Could you add the file name or link before the next handover? That would let us begin without a separate clarification.",
      "notes": [
        "去掉always和everyone，除非确有证据支持。",
        "把对人的评价改为对文本中缺失信息的描述。",
        "请求保留明确截止条件，不用过多缓和词。"
      ],
      "checklist": [
        "我批评的是具体内容还是对方的人格？",
        "影响是否有事实支撑？",
        "对方知道该改什么吗？",
        "语气是否清楚而非讽刺？"
      ]
    },
    "chunks": [
      {
        "id": "register-03-c1",
        "text": "I do not think that follows from ...",
        "meaning": "明确质疑推论与依据之间的连接。",
        "example": "I do not think that follows from the interview data alone.",
        "prompt": "Disagree with an inference while leaving the underlying facts intact."
      },
      {
        "id": "register-03-c2",
        "text": "The part I would change is ...",
        "meaning": "把反馈限定在具体可改的部分。",
        "example": "The part I would change is the opening paragraph; the main request is hard to find.",
        "prompt": "Give focused feedback rather than a general negative judgment."
      },
      {
        "id": "register-03-c3",
        "text": "When ..., it means we cannot ...",
        "meaning": "说明具体行为对后续工作的影响。",
        "example": "When the figures arrive late, it means we cannot check them before the meeting.",
        "prompt": "Explain the practical consequence of a recurring problem."
      }
    ]
  },
  {
    "id": "register-04",
    "track": "register",
    "title": "同一个意思，换一个场合",
    "subtitle": "Change the tone, not the facts",
    "minutes": 18,
    "objective": "在聊天、内部工作和对外说明之间调整语气，同时保持事实与承诺不变。",
    "brief": "正式程度不是优劣等级。对朋友说I regret to inform you可能显得刻意，对外说明延期只说Oops也可能不够。调整的是关系、背景和责任的呈现，不应顺便改变日期、原因或确定程度。",
    "example": {
      "before": "I cannot make Thursday. Could we do Friday instead?",
      "after": "I am unavailable on Thursday. Would Friday work for you instead?",
      "note": "before适合许多熟悉关系，after稍正式。两者都自然、都保留同一个改期请求，并非一个正确一个错误。"
    },
    "questions": [
      {
        "id": "register-04-q1",
        "prompt": "You are rescheduling coffee with a close friend. Which message is most natural in this ordinary, non-ironic context?",
        "options": [
          "Unfortunately, I am unable to attend our appointment on Thursday and would like to propose an alternative.",
          "I cannot do Thursday after all. Would Friday work?",
          "Please note that Thursday’s arrangement has been postponed until Friday.",
          "Friday is free for me, so I have moved our coffee to then."
        ],
        "answer": 1,
        "explanation": "B适合普通朋友之间的改期，并仍征求对方意见。A可用于较正式关系；C和D更像已决定改期，而不是协商。"
      },
      {
        "id": "register-04-q2",
        "prompt": "A client needs a factual delay update. You have a confirmed delivery date of Tuesday. Which message fits?",
        "options": [
          "We have hit a snag and hope to get it to you sometime next week.",
          "Tuesday is a possibility, but we are not ready to commit to it.",
          "Delivery is now confirmed for Tuesday. I am sorry for the delay; the final checks took longer than expected.",
          "The final checks have taken longer than expected; we appreciate your understanding."
        ],
        "answer": 2,
        "explanation": "C保留已确认日期，承认延误并给出适量原因。正式说明也可以很简洁。"
      },
      {
        "id": "register-04-q3",
        "prompt": "Make “Can you send me the file?” slightly more formal without changing the requested action. Which is best?",
        "options": [
          "Could you send me the file, please?",
          "Could you review the file before sending it?",
          "Could you confirm that the file has been approved?",
          "Could you explain why the file has not been sent?"
        ],
        "answer": 0,
        "explanation": "A只调整请求语气，不把发送变成审批、责问或完成声明。"
      }
    ],
    "task": {
      "prompt": "Write two versions of the same message: one to a friend and one to a new professional contact. You cannot meet on Wednesday, you can meet on Friday afternoon, and you want to know whether that works for them. Do not invent an excuse.",
      "model": "To a friend: I cannot make Wednesday after all. Are you free on Friday afternoon instead?\n\nTo a new professional contact: I am unavailable on Wednesday. Would Friday afternoon work for you instead?",
      "notes": [
        "两版都不需要解释未提供的原因。",
        "熟人版可以用can’t；正式版也不禁止缩略形式，重点是整体关系与信息。",
        "避免把“我可以”改写成“对方必须”。"
      ],
      "checklist": [
        "两版的事实和可选时间是否完全相同？",
        "语气是否符合关系？",
        "是否存在不必要的隆重词汇？",
        "对方是否容易回应？"
      ]
    },
    "chunks": [
      {
        "id": "register-04-c1",
        "text": "I cannot make ... after all.",
        "meaning": "自然说明最终无法赴约。",
        "example": "I cannot make Thursday after all. Could we try next week?",
        "prompt": "Reschedule informally without inventing an excuse."
      },
      {
        "id": "register-04-c2",
        "text": "Would ... work for you instead?",
        "meaning": "提出替代时间或安排并询问对方。",
        "example": "Would Friday afternoon work for you instead?",
        "prompt": "Offer an alternative while leaving the other person a choice."
      },
      {
        "id": "register-04-c3",
        "text": "I am sorry for the delay; ...",
        "meaning": "简洁承认延迟，再给相关说明。",
        "example": "I am sorry for the delay; the final review took longer than expected.",
        "prompt": "Acknowledge a delay without burying the practical update."
      }
    ]
  },
  {
    "id": "flow-01",
    "track": "flow",
    "title": "先给对方需要的那一句",
    "subtitle": "Answer first, then explain",
    "minutes": 17,
    "objective": "根据读者的问题决定信息顺序，把决策、请求或结论放在容易找到的位置。",
    "brief": "不必所有写作都结论先行，但当对方问能不能做、要不要继续、需要我干什么时，先回应问题通常更有效。背景不是删除，而是按读者需要重新排序。",
    "example": {
      "before": "We spoke to the team, reviewed the notes, and checked the calendar. There are two unresolved issues. We should postpone the launch.",
      "after": "I recommend postponing the launch until the two unresolved issues are checked. The team has reviewed the notes and calendar, but neither issue has an owner yet.",
      "note": "after先给建议，再给直接影响决定的原因。若owner信息未知就不能这样补写；本例视为完整情境中的已知事实。"
    },
    "questions": [
      {
        "id": "flow-01-q1",
        "prompt": "Your manager asks, “Do you need a decision from me today?” You do. Which opening answers the question most efficiently?",
        "options": [
          "We have discussed both options and have some background to share.",
          "Yes—please choose between the two delivery options by 2 p.m. so we can book the team.",
          "The team has been waiting to book the work since last week.",
          "There is a decision to make, and I will explain the options first."
        ],
        "answer": 1,
        "explanation": "B先回答yes，再说明具体决定和时间。背景可以放在后面。"
      },
      {
        "id": "flow-01-q2",
        "prompt": "A reader asks whether a draft is ready to circulate. It is ready except for one unverified figure. Which opening is most useful?",
        "options": [
          "The draft has been revised and includes the requested sections.",
          "The main changes are complete, and the team has worked hard on it.",
          "The draft is nearly ready, but I would verify the cost figure before circulating it.",
          "The draft is ready to circulate; the cost figure is the only thing not yet checked."
        ],
        "answer": 2,
        "explanation": "C把状态和阻碍一起说明，避免D先给过强结论再撤回。"
      },
      {
        "id": "flow-01-q3",
        "prompt": "You need approval for a small schedule change. Which subject line makes the required action easiest to identify?",
        "options": [
          "Updated review schedule",
          "A question about Friday",
          "Next steps for the review",
          "Approval requested: move the review to Friday"
        ],
        "answer": 3,
        "explanation": "D说明需要的动作和对象。主题行不必精巧，能帮助对方处理即可。"
      }
    ],
    "task": {
      "prompt": "Write a three-sentence update for a reader deciding whether to continue a pilot. The pilot should continue for one more week because weekend usage is missing. Weekday usage was stable. Put the recommendation first and keep the reasoning limited to the supplied facts.",
      "model": "I recommend continuing the pilot for one more week so we can observe weekend usage. Weekday usage was stable, but we have not yet covered the weekend. That additional period would fill a specific gap rather than simply extend the trial without a purpose.",
      "notes": [
        "第一句直接服务继续与否的决定。",
        "不要把stable解释成successful，除非另有成功标准。",
        "理由围绕缺失的周末样本，不添加成本或收益推断。"
      ],
      "checklist": [
        "第一句是否回答了读者的问题？",
        "后续背景是否直接支持这个回答？",
        "有无重复表达同一个结论？",
        "建议的范围与理由是否相称？"
      ]
    },
    "chunks": [
      {
        "id": "flow-01-c1",
        "text": "My recommendation is to ...",
        "meaning": "直接提出建议，再展开理由。",
        "example": "My recommendation is to keep the pilot open for one more week.",
        "prompt": "Lead an update with the decision you recommend."
      },
      {
        "id": "flow-01-c2",
        "text": "The main reason is ...",
        "meaning": "标出最影响判断的理由。",
        "example": "The main reason is that weekend usage is still missing.",
        "prompt": "Identify the reason that matters most to the decision."
      },
      {
        "id": "flow-01-c3",
        "text": "What I need from you is ...",
        "meaning": "在上下文足够时明确所需行动。",
        "example": "What I need from you is a choice between the two delivery dates.",
        "prompt": "Tell a reader exactly what action you need from them."
      }
    ]
  },
  {
    "id": "flow-02",
    "track": "flow",
    "title": "让每句话接得上",
    "subtitle": "Clear reference and topic continuity",
    "minutes": 18,
    "objective": "用明确指代和信息衔接减少读者回头寻找对象的负担。",
    "brief": "this、it和they能减少重复，也可能造成歧义。尤其在两个候选对象刚出现时，重复一个名词往往比追求变化更清楚。句子顺序还应让旧信息承接前句，再引入新的重点。",
    "example": {
      "before": "We compared the draft with the summary. It was missing the main limitation.",
      "after": "We compared the draft with the summary. The summary was missing the main limitation.",
      "note": "after牺牲一点变化，换来明确指代。若上下文已经唯一确定对象，it也完全可以保留。"
    },
    "questions": [
      {
        "id": "flow-02-q1",
        "prompt": "“The analyst sent the editor a revised chart because she had found an error.” The analyst found the error. Which revision removes the ambiguity?",
        "options": [
          "The analyst sent the editor a revised chart because she had found an error in it.",
          "After finding an error, the analyst sent the editor a revised chart.",
          "After finding an error, the editor received a revised chart from the analyst.",
          "The analyst sent the editor a revised chart after they discussed an error."
        ],
        "answer": 1,
        "explanation": "B让finding的主语明确是analyst，且不改变谁发现错误。"
      },
      {
        "id": "flow-02-q2",
        "prompt": "Two proposals have just been discussed. You mean proposal B is cheaper. Which sentence is clearest?",
        "options": [
          "It is cheaper.",
          "That option has a lower cost.",
          "Proposal B is cheaper.",
          "The alternative is less expensive."
        ],
        "answer": 2,
        "explanation": "两个候选对象都活跃时，直接点名比模糊指示更有效。"
      },
      {
        "id": "flow-02-q3",
        "prompt": "Which order best connects these two ideas in a short update: “The survey revealed a recurring concern.” and “We added a question to explore that concern.”?",
        "options": [
          "The survey revealed a recurring concern, so we added a question to explore it.",
          "We added a question to explore it; the survey had revealed something important.",
          "A question was added, and the survey also revealed a concern.",
          "We added a question, which is why the survey had revealed a recurring concern."
        ],
        "answer": 0,
        "explanation": "A先引入concern，再用it承接，并明确新增问题的动机。"
      }
    ],
    "task": {
      "prompt": "Rewrite this paragraph so every reference is clear. The shorter guide lacks troubleshooting examples; the longer manual has them. “We looked at the guide and the manual. It was shorter, but it did not include them. This made it less useful when something went wrong.”",
      "model": "We compared the shorter guide with the longer manual. The guide did not include the troubleshooting examples that were in the manual. Without those examples, the guide was less useful when something went wrong.",
      "notes": [
        "用guide和manual保留两个对象的身份。",
        "those examples的先行词清晰，因此不必每次写完整名称。",
        "可以有更短版本；关键是读者无需猜it、them和this分别指什么。"
      ],
      "checklist": [
        "每个代词都有唯一明显的对象吗？",
        "重要名词是否在代词前出现？",
        "有没有为了避免重复而变模糊？",
        "句子间的关系是否清楚？"
      ]
    },
    "chunks": [
      {
        "id": "flow-02-c1",
        "text": "By “that,” I mean ...",
        "meaning": "在指代可能含糊时明确具体对象。",
        "example": "By “that,” I mean the cost estimate, not the delivery date.",
        "prompt": "Clarify what a vague reference points to."
      },
      {
        "id": "flow-02-c2",
        "text": "That concern led us to ...",
        "meaning": "承接刚提出的问题，说明后续行动。",
        "example": "That concern led us to add a separate check for first-time users.",
        "prompt": "Connect a previously named concern to the action it prompted."
      },
      {
        "id": "flow-02-c3",
        "text": "Without those details, ...",
        "meaning": "承接已说明的细节，解释缺失的后果。",
        "example": "Without those details, the reader cannot tell which version to use.",
        "prompt": "Explain why some previously mentioned information matters."
      }
    ]
  },
  {
    "id": "flow-03",
    "track": "flow",
    "title": "连接词要真的连接",
    "subtitle": "Choose the relationship before the phrase",
    "minutes": 17,
    "objective": "区分补充、对比、结果和限定，避免用连接词制造不存在的逻辑。",
    "brief": "however并不自动让文章有层次，therefore也不能替你完成推理。先用中文说清两句的关系，再选英语表达。有时不用连接词，比加一个错误关系更好。",
    "example": {
      "before": "The new format is easier to scan. Therefore, it contains less detail.",
      "after": "The new format is easier to scan, but it contains less detail.",
      "note": "此处给定的是一个取舍，不是已证实的因果。but比therefore更准确；如果删减细节确实导致易读，论证就应另外交代。"
    },
    "questions": [
      {
        "id": "flow-03-q1",
        "prompt": "You want to describe a trade-off: the service is cheaper, but support is slower. Which connector fits?",
        "options": [
          "The service is cheaper; similarly, support is slower.",
          "The service is cheaper; however, support is slower.",
          "The service is cheaper; consequently, support is slower.",
          "The service is cheaper; for example, support is slower."
        ],
        "answer": 1,
        "explanation": "however标记价格优势与支持速度劣势之间的取舍。其他选项暗示相似、因果或例证关系，均不符合给定语境。"
      },
      {
        "id": "flow-03-q2",
        "prompt": "You have named two separate benefits, not a cause and effect: easier setup and clearer documentation. Which sentence fits?",
        "options": [
          "Setup is easier; as a result, the documentation is clearer.",
          "Setup is easier despite the documentation being clearer.",
          "Setup is easier, and the documentation is clearer as well.",
          "Setup is easier because the documentation is clearer."
        ],
        "answer": 2,
        "explanation": "and/as well表达并列补充，不假设两者的因果关系。"
      },
      {
        "id": "flow-03-q3",
        "prompt": "You want to narrow a positive conclusion to a pilot group. Which follow-up does that?",
        "options": [
          "The result should therefore apply to the rest of the organization.",
          "That makes it unnecessary to repeat the trial elsewhere.",
          "The pilot group also received the regular weekly newsletter.",
          "That said, the result comes from a small pilot group."
        ],
        "answer": 3,
        "explanation": "That said引入对前述判断的保留。关键仍是后面的小样本限制，而非连接词本身。"
      }
    ],
    "task": {
      "prompt": "Combine these facts into a short paragraph without adding a causal claim: the tool is easier to learn; experienced users complete routine tasks faster; complex tasks still require manual work; the trial included only one team.",
      "model": "The tool is easier to learn, and experienced users complete routine tasks faster. Complex tasks still require manual work, however. These are encouraging results, but they come from a trial with just one team.",
      "notes": [
        "第一句是两项并列观察。",
        "第二句提供仍存在的限制。",
        "最后一句把评价限制在当前试用，不能推出所有团队都会如此。"
      ],
      "checklist": [
        "每个连接词对应真实关系吗？",
        "有没有把同时出现写成因果？",
        "限制是否放在相关结论附近？",
        "删去连接词后逻辑仍站得住吗？"
      ]
    },
    "chunks": [
      {
        "id": "flow-03-c1",
        "text": "The trade-off is ...",
        "meaning": "明确一个好处伴随的代价。",
        "example": "The trade-off is that the shorter guide leaves out some edge cases.",
        "prompt": "Name the downside that comes with a benefit."
      },
      {
        "id": "flow-03-c2",
        "text": "That said, ...",
        "meaning": "承认前句后加入保留或限制。",
        "example": "The feedback was encouraging. That said, we heard from only a few participants.",
        "prompt": "Add a relevant qualification without retracting the entire point."
      },
      {
        "id": "flow-03-c3",
        "text": "A separate issue is ...",
        "meaning": "标明另一问题，避免暗示它由前者造成。",
        "example": "A separate issue is whether the team can maintain the process over time.",
        "prompt": "Introduce another concern without creating a false causal link."
      }
    ]
  },
  {
    "id": "flow-04",
    "track": "flow",
    "title": "给口语留出呼吸",
    "subtitle": "Structure a spoken answer",
    "minutes": 18,
    "objective": "在即兴回答中先给结构，再展开有限要点，并把话轮交回。",
    "brief": "口语不必像编辑过的文章一样没有停顿。短暂停顿和自然自我修正可以帮助组织思路。要避免的是不断加新分支，让听者不知道你的主线在哪里。",
    "example": {
      "before": "There are lots of things, and the timing is important, and we also have staffing issues, and the scope might change.",
      "after": "I see two main issues: timing and staffing. The deadline is tight, and we do not yet have a reviewer. I would settle those before expanding the scope.",
      "note": "after给出可跟随的结构和一个落点。它并非鼓励所有回答都机械说three points，而是控制这一轮想表达的内容。"
    },
    "questions": [
      {
        "id": "flow-04-q1",
        "prompt": "You are asked for a quick view in a meeting and need a moment to organize it. Which opening is natural and useful?",
        "options": [
          "I will begin with the full background before deciding which points matter.",
          "Let me think for a second. I see two issues here.",
          "There are quite a few issues, and each one requires a separate discussion.",
          "I have a detailed written answer that I will read out in full."
        ],
        "answer": 1,
        "explanation": "B给自己短暂思考空间，并为听者提供结构。停顿不是能力不足的证明。"
      },
      {
        "id": "flow-04-q2",
        "prompt": "You promised to give the main concern in thirty seconds. Which response best keeps that focus?",
        "options": [
          "The main concern is reviewer availability. Without a reviewer by Tuesday, we cannot finish the checks on time.",
          "Reviewer availability is one issue; there are also several broader questions about our review culture.",
          "We have discussed the reviewer question in three meetings, which I should describe first.",
          "The concern is best understood through the history of how we allocated reviewers last year."
        ],
        "answer": 0,
        "explanation": "A用两句交代问题及后果，符合短回答的任务。"
      },
      {
        "id": "flow-04-q3",
        "prompt": "You have explained your recommendation and want to invite a response. Which ending opens the conversation?",
        "options": [
          "That is the approach I will proceed with unless someone contacts me later.",
          "I could say more, but I have used my time.",
          "That is how I see it. What am I missing?",
          "Those are my comments; I will leave the decision to the chair."
        ],
        "answer": 2,
        "explanation": "C明确邀请别人指出遗漏。其他结尾可能在不同场合有用，但没有同样直接地打开这一轮讨论。"
      }
    ],
    "task": {
      "prompt": "Give a 30-second spoken answer to: “What would you change about our weekly meeting?” Choose one change, explain its purpose, and invite a response. Record or say it once, then try again without reading your first version.",
      "model": "I would send a short decision list before the meeting. We spend a lot of time discovering what needs to be decided, so a list would help people prepare and keep the discussion focused. I would still leave room for urgent issues. Does that fit what others have noticed?",
      "notes": [
        "建议只选一个，避免30秒内塞入完整改革方案。",
        "we spend a lot of time是示例情境中的观察；迁移时换成你能支持的事实。",
        "第二遍不要逐字背稿，保留结构即可。"
      ],
      "checklist": [
        "我是否只展开一个主要建议？",
        "第一句能否让人知道方向？",
        "停顿是否帮助理解，而非不断增加分支？",
        "结尾是否给别人回应空间？"
      ]
    },
    "chunks": [
      {
        "id": "flow-04-c1",
        "text": "Let me think for a second.",
        "meaning": "自然争取短暂组织思路的时间。",
        "example": "Let me think for a second. The main issue is timing.",
        "prompt": "Buy a brief moment to organize a spoken answer."
      },
      {
        "id": "flow-04-c2",
        "text": "I see two main issues here.",
        "meaning": "为听者提供有限、可跟随的结构。",
        "example": "I see two main issues here: cost and the time required to maintain it.",
        "prompt": "Preview a short answer with two clearly defined points."
      },
      {
        "id": "flow-04-c3",
        "text": "What am I missing?",
        "meaning": "邀请别人指出遗漏，而非宣布讨论结束。",
        "example": "I would start with the smaller trial. What am I missing?",
        "prompt": "Invite a real response after stating your own view."
      }
    ]
  },
  {
    "id": "stance-01",
    "track": "stance",
    "title": "不确定，也可以有判断",
    "subtitle": "Calibrate the claim, not your confidence as a speaker",
    "minutes": 19,
    "objective": "把确信程度放在具体命题上，避免过度断言和整句无效弱化。",
    "brief": "I could be wrong有时有用，但不能说明你究竟不确定什么。把已知事实直接说清，把不确定放在原因、推广范围或未来结果上，能同时做到坚定与诚实。",
    "example": {
      "before": "I might be wrong, but maybe the process could perhaps be unreliable.",
      "after": "Three handovers were missed this week. That raises a reliability concern, although one week is too short to establish a pattern.",
      "note": "after对观察直接，对模式判断保留。不是所有句子都需要同样强度的hedge。"
    },
    "questions": [
      {
        "id": "stance-01-q1",
        "prompt": "You are certain that three errors occurred, but uncertain whether they signal a wider problem. Which sentence calibrates those two claims?",
        "options": [
          "Three errors may have occurred, which shows the process is broadly unreliable.",
          "Three errors occurred; whether they indicate a wider problem is still unclear.",
          "Three errors occurred, establishing that we have a wider reliability problem.",
          "It is unclear whether there is a wider problem, so I would leave the three errors out of the update."
        ],
        "answer": 1,
        "explanation": "B把事实和推论的确信度分开。A把两者恰好反过来。"
      },
      {
        "id": "stance-01-q2",
        "prompt": "Which phrase best introduces a provisional interpretation that you are willing to revise?",
        "options": [
          "The evidence establishes that...",
          "We can now rule out any alternative to...",
          "My current reading is...",
          "The settled explanation is..."
        ],
        "answer": 2,
        "explanation": "current reading表示现阶段解读，允许证据变化后修正。它仍然是一个明确判断。"
      },
      {
        "id": "stance-01-q3",
        "prompt": "You think an effect is likely, but have not measured its size. Which sentence identifies the remaining uncertainty?",
        "options": [
          "I expect an effect large enough to justify the change.",
          "The size of the effect is unknown, so I have no view on whether one is likely.",
          "The effect has been measured, although its size remains unknown.",
          "I expect an effect; the main uncertainty is how large it will be."
        ],
        "answer": 3,
        "explanation": "D把预测和幅度未知分开。expect属于判断，不应伪装成已观测结果。"
      }
    ],
    "task": {
      "prompt": "State a provisional view in three sentences. In a fictional trial, people asked fewer basic questions after reading a new guide. You suspect the guide helped, but do not know whether people simply had easier tasks. Identify what would change your view.",
      "model": "My current reading is that the guide helped people answer some basic questions on their own. The reduction in questions supports that view, but easier tasks could also explain it. I would be more confident if the same pattern appeared on tasks of comparable difficulty.",
      "notes": [
        "不要把问题变少直接当成理解更深。",
        "what would change my view应是具体证据，不是“更多信息”。",
        "也可以写更谨慎的版本，但仍要说明当前倾向。"
      ],
      "checklist": [
        "当前判断是否明确？",
        "不确定具体落在哪个部分？",
        "是否区分预测、解释与观察？",
        "改变判断的条件是否可验证？"
      ]
    },
    "chunks": [
      {
        "id": "stance-01-c1",
        "text": "My current reading is ...",
        "meaning": "提出目前的解释，保留修正空间。",
        "example": "My current reading is that the change helped newer users more than experienced ones.",
        "prompt": "Offer your present interpretation without treating it as final."
      },
      {
        "id": "stance-01-c2",
        "text": "The main uncertainty is ...",
        "meaning": "点明最影响判断的未知项。",
        "example": "The main uncertainty is whether the result will hold over a longer period.",
        "prompt": "Locate the uncertainty instead of weakening every sentence."
      },
      {
        "id": "stance-01-c3",
        "text": "I would be more confident if ...",
        "meaning": "说明增强判断所需的证据。",
        "example": "I would be more confident if we saw the same pattern in another team.",
        "prompt": "Say what evidence would strengthen your view."
      }
    ]
  },
  {
    "id": "stance-02",
    "track": "stance",
    "title": "不同意哪一步？",
    "subtitle": "Disagree with the claim you actually mean",
    "minutes": 18,
    "objective": "明确异议针对事实、解释、价值取舍还是行动建议。",
    "brief": "I disagree后面最好接一个可讨论的对象。你可以同意问题存在，却反对解决方案；也可以接受数据，却不同意归因。先定位分歧，才能避免双方反复捍卫彼此其实都同意的部分。",
    "example": {
      "before": "I disagree with the proposal.",
      "after": "I agree that the handover is too slow. My concern is with adding another approval step, which could make that delay worse.",
      "note": "after不装作赞同整个方案，而是准确说明共同点和分歧点。could保留的是未来影响。"
    },
    "questions": [
      {
        "id": "stance-02-q1",
        "prompt": "You agree that response times are too slow, but think hiring is not yet justified. Which response locates the disagreement?",
        "options": [
          "I am not sure response times are actually too slow.",
          "I agree that response times are a problem; I am not yet convinced that hiring is the right first response.",
          "I agree that hiring is needed, but I would delay the recruitment process.",
          "I do not think the team has made a convincing case about either the problem or the solution."
        ],
        "answer": 1,
        "explanation": "B把问题判断和行动建议分开。这样双方可以讨论为什么不先招聘。"
      },
      {
        "id": "stance-02-q2",
        "prompt": "You accept a cost estimate but disagree that the cheapest option is best. What is the real disagreement?",
        "options": [
          "Whether the estimate is arithmetically correct.",
          "Whether the cheaper option is genuinely cheaper.",
          "Which criteria should determine the decision.",
          "Whether the estimate should be updated before discussion."
        ],
        "answer": 2,
        "explanation": "成本数字不是争议点，争议是决策标准与取舍。"
      },
      {
        "id": "stance-02-q3",
        "prompt": "You want to challenge a claim that one anecdote proves a general trend. Which reply addresses the reasoning?",
        "options": [
          "That example is useful, but I do not think one case is enough to establish a trend.",
          "I doubt the example happened as described.",
          "I agree that the example establishes a trend, though I dislike the implications.",
          "We should avoid using examples in discussions of trends."
        ],
        "answer": 0,
        "explanation": "A承认例子的价值，同时质疑从一例到趋势的推理范围。"
      }
    ],
    "task": {
      "prompt": "Respond to this fictional proposal: “Support replies are slow, so we should add a manager’s approval to every reply.” You agree that replies are slow, but worry that another approval will increase delays. Suggest a narrower alternative without claiming you know it will work.",
      "model": "I agree that the response time needs attention. My concern is that requiring approval for every reply could add another delay. Could we instead test pre-approved guidance for common questions and reserve review for unusual cases? That would let us check whether we can improve speed without losing oversight.",
      "notes": [
        "先承认真实共同点，不说I agree with the proposal后立刻全面反对。",
        "替代方案用test和whether，不把预期效果当成必然。",
        "分歧针对机制，不针对提出者的意图。"
      ],
      "checklist": [
        "共同点是否真实？",
        "我反对的具体步骤是否明确？",
        "理由是否解释机制而非表达情绪？",
        "替代方案是否仍允许验证与调整？"
      ]
    },
    "chunks": [
      {
        "id": "stance-02-c1",
        "text": "I agree with the problem statement, but ...",
        "meaning": "接受问题描述，同时区分后续方案。",
        "example": "I agree with the problem statement, but I am not sure another approval step addresses it.",
        "prompt": "Separate agreement on the problem from disagreement on the solution."
      },
      {
        "id": "stance-02-c2",
        "text": "My concern is with ...",
        "meaning": "准确指向争议的部分。",
        "example": "My concern is with the proposed timing, not the goal itself.",
        "prompt": "Name the part of a proposal you are challenging."
      },
      {
        "id": "stance-02-c3",
        "text": "I am not yet convinced that ...",
        "meaning": "表达尚未被说服，保留继续讨论空间。",
        "example": "I am not yet convinced that the smaller sample explains the whole difference.",
        "prompt": "Disagree provisionally without pretending certainty in the opposite view."
      }
    ]
  },
  {
    "id": "stance-03",
    "track": "stance",
    "title": "承认对方的好理由",
    "subtitle": "Concession without surrendering the argument",
    "minutes": 18,
    "objective": "准确承认反方论点的价值，再解释为什么它尚未改变整体判断。",
    "brief": "让步不是先赞美一句再忽略对方。要承认对方真正提出的理由，并说明它与自己更看重的因素如何权衡。even if讨论假设，although通常承认事实；两者不能随意互换。",
    "example": {
      "before": "The simpler plan is cheaper, but I still prefer the other one.",
      "after": "The simpler plan is cheaper, and that matters. I still prefer the other option because it covers the failure case we cannot afford to leave unresolved.",
      "note": "after承认成本理由，并给出当前取舍依据。它没有否认成本，也没有声称另一方案在所有维度都更好。"
    },
    "questions": [
      {
        "id": "stance-03-q1",
        "prompt": "A lower price is a genuine advantage, but reliability matters more in this decision. Which sentence represents that trade-off fairly?",
        "options": [
          "I would set price aside entirely, since reliability is the only relevant factor.",
          "The lower price is an advantage, but I would prioritize reliability for this use case.",
          "The lower price suggests that this is also the more reliable option.",
          "I agree that price should decide this, although reliability deserves a mention."
        ],
        "answer": 1,
        "explanation": "B承认真实优势，并限定这次用途中的优先级。"
      },
      {
        "id": "stance-03-q2",
        "prompt": "You do not know whether a proposal will save money. You want to say that even a saving would not resolve the safety concern. Which wording fits?",
        "options": [
          "Although it saves money, the safety concern remains.",
          "Since it saves money, we should accept the safety concern.",
          "Even if it saves money, the safety concern would remain.",
          "It is unlikely to save money, so we do not need to discuss safety."
        ],
        "answer": 2,
        "explanation": "even if不把节省费用当成已知事实。although会让听者通常理解为你已接受该事实。"
      },
      {
        "id": "stance-03-q3",
        "prompt": "Which response genuinely engages with a colleague’s point rather than merely using a polite preface?",
        "options": [
          "I understand your point, but my original view has not changed.",
          "I appreciate the comment; the alternative is still my preference.",
          "You are right, so I agree that there is no reason to try another approach.",
          "You are right that the current process is familiar. I think the recurring errors still justify testing an alternative."
        ],
        "answer": 3,
        "explanation": "D承认具体优势，并说明为什么另一个考虑仍使自己支持试验。"
      }
    ],
    "task": {
      "prompt": "Argue for a small trial of a new scheduling method. A colleague correctly notes that the current method is familiar and requires no training. Acknowledge that advantage, then explain why a limited trial may still be worthwhile. Do not invent a proven benefit.",
      "model": "The current method is familiar, and avoiding extra training is a real advantage. I would still consider a small trial because we do not yet know whether another approach could reduce the repeated clashes. Keeping the trial to one team would let us examine that possibility without asking everyone to change at once.",
      "notes": [
        "real advantage是真正承认，而不是礼貌遮罩。",
        "could reduce表示试验要检验的可能性。",
        "有限范围是管理未知的方法，不是成功保证。"
      ],
      "checklist": [
        "是否准确重述对方的最强理由？",
        "我保留的判断是否有明确理由？",
        "事实与假设是否分开？",
        "是否避免把一个取舍描述成全方位胜出？"
      ]
    },
    "chunks": [
      {
        "id": "stance-03-c1",
        "text": "That is a real advantage.",
        "meaning": "明确承认对方指出的优点。",
        "example": "The team already knows the system, and that is a real advantage.",
        "prompt": "Acknowledge a concrete strength in the other option."
      },
      {
        "id": "stance-03-c2",
        "text": "Even if that is true, ...",
        "meaning": "即使某个尚未确认的前提成立，后续问题仍存在。",
        "example": "Even if that is true, we would still need a plan for the transition.",
        "prompt": "Explore a hypothetical concession without asserting it as fact."
      },
      {
        "id": "stance-03-c3",
        "text": "I would still prioritize ... because ...",
        "meaning": "在承认取舍后说明当前优先级。",
        "example": "I would still prioritize reliability because the cost of a missed alert is high.",
        "prompt": "Explain why one factor outweighs a genuine competing benefit here."
      }
    ]
  },
  {
    "id": "stance-04",
    "track": "stance",
    "title": "改判断，不必改写过去",
    "subtitle": "Explain what changed your mind",
    "minutes": 19,
    "objective": "诚实呈现原判断、新证据与修正后的观点，并保留仍未解决的部分。",
    "brief": "更新判断并不要求宣布过去的一切都错了。说明哪一条证据改变了哪一步推论，比含糊说things changed更有价值。新的结论也可以是范围变窄或信心下降，而不是完全翻转。",
    "example": {
      "before": "I have always thought we should take a more cautious approach.",
      "after": "I initially supported a full rollout. The follow-up showed that the gains were concentrated in one team, so I now favor a smaller expansion while we test elsewhere.",
      "note": "after承认真实的前后变化，而不是为了保持形象改写自己的历史立场。例子中的证据只支持缩小推广范围。"
    },
    "questions": [
      {
        "id": "stance-04-q1",
        "prompt": "You first thought a change helped every group. New results show improvement only for experienced users. Which update is most accurate?",
        "options": [
          "My earlier conclusion was that only experienced users would benefit.",
          "The new results show that the change provides no useful improvement.",
          "I would narrow my earlier conclusion: the improvement appears concentrated among experienced users.",
          "The change will not benefit first-time users in any future trial."
        ],
        "answer": 2,
        "explanation": "C修正范围，既不改写过去，也不把当前未观察到的收益写成永远不会有。"
      },
      {
        "id": "stance-04-q2",
        "prompt": "Which explanation best identifies why a view changed?",
        "options": [
          "My view has evolved as the project has progressed.",
          "The follow-up included weekend data, and the pattern did not hold there.",
          "The new analysis gave me a different overall impression.",
          "I now prefer a different interpretation of the situation."
        ],
        "answer": 1,
        "explanation": "B指出新增证据和具体差异，让别人能评估修正是否合理。"
      },
      {
        "id": "stance-04-q3",
        "prompt": "A result weakens your hypothesis but does not rule it out. Which statement fits?",
        "options": [
          "This rules out the hypothesis.",
          "This does not change my confidence in the hypothesis.",
          "This is sufficient to establish the hypothesis.",
          "This lowers my confidence in the hypothesis, though it does not rule it out."
        ],
        "answer": 3,
        "explanation": "信心下降不是彻底排除。D准确表达证据对判断力度的影响。"
      }
    ],
    "task": {
      "prompt": "Write a short update on a changed view. You initially favored expanding a pilot immediately. A follow-up shows that the gains disappear when extra support is removed. You now prefer testing whether the process can work without that support. State the change plainly.",
      "model": "I initially favored expanding the pilot immediately. The follow-up changes that view: the gains disappeared when the extra support was removed. I now think we should test whether the process can work under normal staffing before expanding it. The pilot may still be useful, but we have not yet shown that its results are sustainable.",
      "notes": [
        "说明变化来自什么证据。",
        "normal staffing是本题对去掉额外支持的重述，不应随意换成budget cuts等新事实。",
        "保留pilot可能有用，同时撤回已证明可持续的暗示。"
      ],
      "checklist": [
        "原来的观点是否被准确描述？",
        "新证据具体改变了哪一步？",
        "新行动是否跟随新的判断？",
        "仍然未知的部分是否保留？"
      ]
    },
    "chunks": [
      {
        "id": "stance-04-c1",
        "text": "I would narrow my earlier conclusion.",
        "meaning": "修正原结论的适用范围。",
        "example": "I would narrow my earlier conclusion: the benefit is clearer for repeat users.",
        "prompt": "Revise an overbroad claim without reversing every part of it."
      },
      {
        "id": "stance-04-c2",
        "text": "What changed my view was ...",
        "meaning": "明确指出改变看法的证据或理由。",
        "example": "What changed my view was the result after the extra support was removed.",
        "prompt": "Explain the specific reason you changed your mind."
      },
      {
        "id": "stance-04-c3",
        "text": "This lowers my confidence, but does not rule it out.",
        "meaning": "降低确信程度，但不作过强排除。",
        "example": "The follow-up was less convincing. This lowers my confidence, but does not rule it out.",
        "prompt": "Respond to weakening evidence without declaring the idea impossible."
      }
    ]
  },
  {
    "id": "interaction-01",
    "track": "interaction",
    "title": "问到真正不懂的地方",
    "subtitle": "Clarify narrowly",
    "minutes": 17,
    "objective": "把澄清问题定位在词义、范围或行动上，而不是让对方从头重讲。",
    "brief": "I do not understand很诚实，但往往范围过大。指出哪个词、哪个版本、哪个时间点不清楚，能更快修复交流。必要时提供两个可能解释，但不要把它们伪装成唯一选项。",
    "example": {
      "before": "What do you mean?",
      "after": "When you say “ready,” do you mean ready for internal review or ready to send to the client?",
      "note": "after直接定位ready的范围。开放问法也可以更合适，例如What would count as ready here?，不必每次都做二选一。"
    },
    "questions": [
      {
        "id": "interaction-01-q1",
        "prompt": "A colleague says, “We need this live by Friday.” You are unsure whether live means a small pilot or a full release. Which question resolves that ambiguity?",
        "options": [
          "Could you walk me through the whole launch plan again?",
          "By “live,” do you mean the pilot or the full release?",
          "Can we agree that “live” is not a useful term?",
          "So I will treat Friday as the full-release date unless you object."
        ],
        "answer": 1,
        "explanation": "B询问真正含糊的词，不先把一个解释当成事实。"
      },
      {
        "id": "interaction-01-q2",
        "prompt": "You heard the recommendation clearly but not the reason for it. Which question targets the missing information?",
        "options": [
          "Could you repeat your recommendation?",
          "Could you tell me when you reached the decision?",
          "What led you to prefer that option?",
          "Could you explain who will implement it?"
        ],
        "answer": 2,
        "explanation": "缺的是理由，不是声音或建议本身。C对准信息缺口。"
      },
      {
        "id": "interaction-01-q3",
        "prompt": "You want to confirm whether a deadline applies to a draft or final version. Which wording is clearest?",
        "options": [
          "Is Friday the deadline for the draft or for the final version?",
          "Could you confirm that Friday is still the deadline?",
          "Do you expect the work to take much longer?",
          "I will aim to send the final version on Friday."
        ],
        "answer": 0,
        "explanation": "A把版本与日期联系起来，一次澄清关键边界。"
      }
    ],
    "task": {
      "prompt": "A teammate writes, “Please clean this up before the meeting.” You do not know whether they want formatting changes or a rewrite of the argument. Ask a focused clarification question and say what you can do immediately.",
      "model": "When you say “clean this up,” do you mean the formatting or the argument itself? I can fix the formatting now; if you want the argument revised, could you point me to the main concern?",
      "notes": [
        "不把clean up自动理解成全面重写。",
        "先说可立即推进的部分，避免澄清成为完全停工。",
        "如果两种解释都不合适，对方仍能补充真正需求。"
      ],
      "checklist": [
        "我指出了具体含糊的词吗？",
        "问题是否比“什么意思”更容易回答？",
        "有没有把自己的猜测当成结论？",
        "哪些工作无需等待也能做？"
      ]
    },
    "chunks": [
      {
        "id": "interaction-01-c1",
        "text": "When you say ..., do you mean ...?",
        "meaning": "围绕一个词或表达澄清含义。",
        "example": "When you say “finished,” do you mean reviewed or simply drafted?",
        "prompt": "Ask what a specific ambiguous word means in this conversation."
      },
      {
        "id": "interaction-01-c2",
        "text": "What would count as ... here?",
        "meaning": "询问当前场景中的判断标准。",
        "example": "What would count as a successful trial here?",
        "prompt": "Ask for the criterion behind a broad label."
      },
      {
        "id": "interaction-01-c3",
        "text": "What led you to prefer that option?",
        "meaning": "请对方解释选择背后的理由。",
        "example": "I understand the recommendation. What led you to prefer that option?",
        "prompt": "Ask for the reasoning rather than a repetition of the conclusion."
      }
    ]
  },
  {
    "id": "interaction-02",
    "track": "interaction",
    "title": "说偏了，就及时修复",
    "subtitle": "Repair meaning without making it awkward",
    "minutes": 17,
    "objective": "识别误解后明确重述自己的意思，不把责任全部推给听者。",
    "brief": "自我修正是正常交流的一部分。I meant可以改正事实，Let me put that differently可以改表达。若原句确实含糊，承认这一点有助于合作；但不必为每次措辞调整长篇道歉。",
    "example": {
      "before": "You misunderstood me. That is not what I said.",
      "after": "I was not clear about the timing. I meant that we should start the review on Monday, not finish it then.",
      "note": "after指出误解发生在哪里，并提供可直接替换的新信息。若听者确实听错，仍可温和纠正，无须机械揽责。"
    },
    "questions": [
      {
        "id": "interaction-02-q1",
        "prompt": "You said “next week,” but meant the week after next. Which correction is cleanest?",
        "options": [
          "Let us leave the exact timing open for now.",
          "Sorry, I meant the week after next, not next week.",
          "As I said, it is the week after next.",
          "The timing may change, so next week is only a possibility."
        ],
        "answer": 1,
        "explanation": "B明确给出旧信息与新信息，不放大成全面否定，也不责怪听者。"
      },
      {
        "id": "interaction-02-q2",
        "prompt": "A listener thinks you oppose the project. You only oppose the current timing. Which response repairs the misunderstanding?",
        "options": [
          "I have reservations about the project as a whole.",
          "I thought I had already explained my position clearly.",
          "I support the project; my concern is the timing.",
          "I agree with the timing, but I am unsure about the project."
        ],
        "answer": 2,
        "explanation": "C重新划定立场范围，让对方能继续在真正分歧处讨论。"
      },
      {
        "id": "interaction-02-q3",
        "prompt": "You notice your explanation has become too complicated. Which transition helps you restart more clearly?",
        "options": [
          "Let me put that more simply.",
          "Let me give you the full technical background before continuing.",
          "The explanation is complicated because the issue is complicated.",
          "Let me add another qualification to what I just said."
        ],
        "answer": 0,
        "explanation": "A把注意力放在表达调整上，不评价听者能力。"
      }
    ],
    "task": {
      "prompt": "During a meeting, someone says, “So you want to cancel the review?” You actually want to shorten the review and move detailed comments into the document. Respond in two or three sentences and make the intended action clear.",
      "model": "Not cancel it—shorten it. I would put the detailed comments in the document beforehand and use the meeting for the points we need to discuss together. I should have made that distinction clearer.",
      "notes": [
        "第一句直接修复cancel与shorten的区别。",
        "第二句给行动，不停留在否认。",
        "最后一句承认表达不清，可按真实情况保留或省略。"
      ],
      "checklist": [
        "新表达是否明确替换旧理解？",
        "关键对比是否一听就懂？",
        "有没有把修复变成责备？",
        "对方是否知道接下来怎么做？"
      ]
    },
    "chunks": [
      {
        "id": "interaction-02-c1",
        "text": "I meant ..., not ...",
        "meaning": "简短替换被误解或说错的信息。",
        "example": "I meant the review draft, not the final version.",
        "prompt": "Correct one specific piece of information."
      },
      {
        "id": "interaction-02-c2",
        "text": "Let me put that differently.",
        "meaning": "换一种更清楚的表达方式。",
        "example": "Let me put that differently: the issue is timing, not whether we should do it.",
        "prompt": "Restart an explanation without blaming the listener."
      },
      {
        "id": "interaction-02-c3",
        "text": "I should have made that distinction clearer.",
        "meaning": "承认原表达没有说明关键区别。",
        "example": "I support a trial, not a full rollout. I should have made that distinction clearer.",
        "prompt": "Acknowledge your own ambiguous wording after clarifying the distinction."
      }
    ]
  },
  {
    "id": "interaction-03",
    "track": "interaction",
    "title": "加入讨论，也让别人加入",
    "subtitle": "Enter, connect, and hand back",
    "minutes": 18,
    "objective": "自然取得话轮，承接他人观点，并在需要时把讨论交回。",
    "brief": "参与讨论不只是等待空隙说自己的稿。说清你接的是哪一点、是补充还是挑战，能让新发言进入同一条讨论线。打断有时必要，语气与时机取决于关系和紧迫程度。",
    "example": {
      "before": "I have something to say. My topic is staffing.",
      "after": "Can I pick up on the timing point? It also depends on whether we have a reviewer available that week.",
      "note": "after把staffing与已有话题连接起来。并非每次都要请求许可，但先标出关联能帮助听者跟上。"
    },
    "questions": [
      {
        "id": "interaction-03-q1",
        "prompt": "Someone is discussing a tight deadline. You want to add a related staffing constraint. Which entry best connects your point?",
        "options": [
          "On a separate topic, I wanted to discuss staffing.",
          "Can I pick up on the deadline? We also need to check reviewer availability.",
          "Before you finish that point, I would like to give my general view.",
          "I agree with the deadline and will discuss staffing later."
        ],
        "answer": 1,
        "explanation": "B明确承接deadline，并补上相关约束。"
      },
      {
        "id": "interaction-03-q2",
        "prompt": "Two people speak at once in a friendly meeting. You are happy to let the other person continue. Which response fits?",
        "options": [
          "Let me finish first, then you can add your point.",
          "I will be very brief, so I will continue.",
          "Go ahead—I can come back to my point.",
          "Perhaps we should both save our comments for another meeting."
        ],
        "answer": 2,
        "explanation": "C让出当前话轮，同时保留稍后发言的空间。"
      },
      {
        "id": "interaction-03-q3",
        "prompt": "The group is drifting into details, but a decision is needed first. Which intervention keeps the discussion constructive?",
        "options": [
          "Could we leave all the details out of this discussion?",
          "I think the details are less important than everyone suggests.",
          "We have discussed enough, so I will make the decision now.",
          "Could we settle the main decision first, then come back to the details?"
        ],
        "answer": 3,
        "explanation": "D调整顺序而非否定细节价值，适合把讨论拉回当前任务。"
      }
    ],
    "task": {
      "prompt": "You are in a discussion about choosing a venue. People are comparing decoration, but no one has checked whether the venue fits the expected group size. Write a brief intervention that connects to the conversation, raises the missing constraint, and suggests a next step.",
      "model": "Before we choose between the two styles, could we check capacity? We expect a fairly large group, and I am not sure both venues can accommodate it. Once that is clear, we can return to the look and feel.",
      "notes": [
        "没有说装饰不重要，而是提出先决信息。",
        "I am not sure准确表达未核实，不直接断言容量不够。",
        "最后明确会回到原话题，避免让人觉得被强行转移。"
      ],
      "checklist": [
        "发言与当前讨论的关联是否明确？",
        "我是在补充、挑战还是调整顺序？",
        "未知信息是否被当作未知？",
        "有没有给出回到讨论的路径？"
      ]
    },
    "chunks": [
      {
        "id": "interaction-03-c1",
        "text": "Can I pick up on ...?",
        "meaning": "承接别人刚提出的某一点。",
        "example": "Can I pick up on the capacity issue? We have not confirmed the final number yet.",
        "prompt": "Enter a discussion by connecting to a specific point."
      },
      {
        "id": "interaction-03-c2",
        "text": "Go ahead—I can come back to that.",
        "meaning": "自然让出话轮，并保留稍后补充。",
        "example": "Go ahead—I can come back to that after you finish.",
        "prompt": "Let someone else continue after an overlap."
      },
      {
        "id": "interaction-03-c3",
        "text": "Could we settle ... first?",
        "meaning": "建议先完成更基础的决定。",
        "example": "Could we settle the date first, then discuss the room layout?",
        "prompt": "Refocus a discussion on the decision that needs to come first."
      }
    ]
  },
  {
    "id": "interaction-04",
    "track": "interaction",
    "title": "拒绝之后，留下清楚的选择",
    "subtitle": "Boundaries and workable alternatives",
    "minutes": 18,
    "objective": "明确不能承担的范围，说明可行替代，不用模糊缓和制造虚假期待。",
    "brief": "I will try有时是真实意愿，有时让对方误以为已经接受。若确实无法按原要求完成，直接说明限制，再提出能做到的方案。只有真实可行的替代才有帮助；拒绝也不一定必须附带借口。",
    "example": {
      "before": "I will try to get the whole thing done tonight.",
      "after": "I cannot complete the full review tonight. I can check the key assumptions by noon tomorrow, or do the full review by Friday.",
      "note": "after让对方可以重新安排。不要为了听起来合作而承诺自己知道做不到的事情。"
    },
    "questions": [
      {
        "id": "interaction-04-q1",
        "prompt": "You cannot finish a full review today, but can check the conclusion. Which reply is honest and useful?",
        "options": [
          "I will do my best to complete the full review today.",
          "I cannot complete the full review today, but I can check the conclusion by 4 p.m.",
          "I can review the document, although it may take longer than expected.",
          "I will try to find time for the review after my other work."
        ],
        "answer": 1,
        "explanation": "B明确拒绝原范围，同时给出真实可行的小范围交付。"
      },
      {
        "id": "interaction-04-q2",
        "prompt": "A friend invites you out. You do not want to go and do not want to invent an excuse. Which response is clear and considerate?",
        "options": [
          "I may be able to come; let me see how the evening develops.",
          "I have another appointment, although I do not actually have one.",
          "Thanks for inviting me. I am going to pass this time, but I hope you have a good evening.",
          "I cannot come tonight, but let us definitely meet tomorrow instead."
        ],
        "answer": 2,
        "explanation": "C感谢邀请并明确不参加，不强迫自己编理由或提供并不想要的另一次约定。"
      },
      {
        "id": "interaction-04-q3",
        "prompt": "Two urgent requests compete for the same time. You need the requester to choose a priority. Which sentence does that?",
        "options": [
          "I can complete one today; which should take priority?",
          "I will start both and see how much I can finish.",
          "I think one is probably more urgent, so I will decide without checking.",
          "Both are important, so I will keep both deadlines as they are."
        ],
        "answer": 0,
        "explanation": "A把资源限制转化为明确的优先级决定，而非隐瞒冲突。"
      }
    ],
    "task": {
      "prompt": "A colleague asks for a full analysis by tomorrow morning. You can provide a short summary by then, or a full analysis by Thursday. Write a reply that sets a clear boundary and asks which option would be more useful.",
      "model": "I cannot complete a full analysis by tomorrow morning. I can send a short summary by then, or the full analysis by Thursday. Which would be more useful for your decision?",
      "notes": [
        "不要用I will try模糊已知限制。",
        "两项替代都要有明确交付物和日期。",
        "最后询问用途，有助于决定合适范围。"
      ],
      "checklist": [
        "原要求是否被明确接受或拒绝？",
        "替代方案是否真实可行？",
        "交付范围和时间是否成对说明？",
        "有没有留下会被误当承诺的模糊话？"
      ]
    },
    "chunks": [
      {
        "id": "interaction-04-c1",
        "text": "I cannot take on the full ..., but I can ...",
        "meaning": "明确边界，同时提供可承担的部分。",
        "example": "I cannot take on the full rewrite, but I can review the opening.",
        "prompt": "Decline a scope you cannot handle and offer a smaller one."
      },
      {
        "id": "interaction-04-c2",
        "text": "Which should take priority?",
        "meaning": "在资源冲突时请求明确优先级。",
        "example": "Both requests need the same afternoon. Which should take priority?",
        "prompt": "Ask for a decision when two tasks cannot both be completed."
      },
      {
        "id": "interaction-04-c3",
        "text": "I am going to pass this time.",
        "meaning": "清楚而不过度解释地拒绝一次邀请。",
        "example": "Thanks for thinking of me. I am going to pass this time.",
        "prompt": "Decline an invitation without inventing an excuse."
      }
    ]
  },
  {
    "id": "story-01",
    "track": "story",
    "title": "让故事先动起来",
    "subtitle": "A small setup, then a change",
    "minutes": 18,
    "objective": "给足听懂所需的背景，尽早引出变化或问题。",
    "brief": "日常故事不需要戏剧化开头，但需要一点值得继续听的变化。地点、人物和目的只保留与变化相关的部分。讲述顺序可以调整，但不能为了吸引人虚构经历。",
    "example": {
      "before": "On Saturday I woke up, had breakfast, checked my phone, and decided to go for a walk. Then I found the street market had moved.",
      "after": "I went looking for the Saturday market and found an empty square. I was sure I had the right place—until I noticed a small sign pointing two streets away.",
      "note": "after从有变化的时刻开始，保留理解所需背景。它不是要求每段经历都制造悬念；普通故事也可以平实。"
    },
    "questions": [
      {
        "id": "story-01-q1",
        "prompt": "You have one minute to tell a friend about taking the wrong bus. Which opening gets to the relevant change without unnecessary setup?",
        "options": [
          "I left home after breakfast and walked to the stop near my usual route.",
          "I realized I was on the wrong bus when the route stopped looking familiar.",
          "I usually choose the bus because it is convenient and reasonably priced.",
          "The bus system has several routes that connect the same two neighborhoods."
        ],
        "answer": 1,
        "explanation": "B直接进入这段经历的转折点。其余背景可能真实，但不服务一分钟故事。"
      },
      {
        "id": "story-01-q2",
        "prompt": "In a short story about a failed cake, which detail is most relevant to understanding what happened?",
        "options": [
          "The narrator had recently painted the kitchen.",
          "The cake was baked in a tin received as a gift.",
          "The narrator used salt instead of sugar.",
          "The mixing bowl was stored on the top shelf."
        ],
        "answer": 2,
        "explanation": "C解释了变化或问题。相关性取决于故事目的，不是细节越多越好。"
      },
      {
        "id": "story-01-q3",
        "prompt": "Which ending resolves a simple story about getting lost on the way to a class?",
        "options": [
          "The neighborhood had changed a lot since my previous visit.",
          "I still think classes are a good way to meet people.",
          "The class was something I had been looking forward to for weeks.",
          "A shopkeeper pointed me to the next building, and I arrived just as the class began."
        ],
        "answer": 3,
        "explanation": "D完成这条行动线，交代怎么解决和最终结果。"
      }
    ],
    "task": {
      "prompt": "Tell a fictional 45-second story about arriving at an event and discovering you are a day early. Include the purpose, the moment of realization, and what happens next. Keep the background short.",
      "model": "I arrived at the community hall carrying a notebook, ready for a photography workshop. The room was completely empty. I checked the confirmation again and realized I had read the date correctly but remembered the day wrong—the workshop was tomorrow. A volunteer laughed with me and pointed out a small exhibition downstairs, so I stayed for that instead. At least the trip was not wasted.",
      "notes": [
        "虚构练习应明确是fictional；真实交流时换成真实经历。",
        "empty room承担转折作用，不需要额外形容词堆叠。",
        "结尾解决当天去了哪里，不必强行上升成重大人生道理。"
      ],
      "checklist": [
        "背景是否只保留必要信息？",
        "哪一刻发生了变化？",
        "结果是否回应开头的问题？",
        "有没有无关支线挤占时间？"
      ]
    },
    "chunks": [
      {
        "id": "story-01-c1",
        "text": "I realized something was wrong when ...",
        "meaning": "用察觉异常的时刻开启故事。",
        "example": "I realized something was wrong when nobody else got off at my stop.",
        "prompt": "Start a story at the moment you noticed a problem."
      },
      {
        "id": "story-01-c2",
        "text": "It turned out that ...",
        "meaning": "揭示后来才知道的实际情况。",
        "example": "It turned out that the class had moved to the building next door.",
        "prompt": "Reveal the explanation you discovered later."
      },
      {
        "id": "story-01-c3",
        "text": "In the end, ...",
        "meaning": "交代经历最终怎样收束。",
        "example": "In the end, we found a smaller cafe and stayed there for the afternoon.",
        "prompt": "Bring the main action of a story to its outcome."
      }
    ]
  },
  {
    "id": "story-02",
    "track": "story",
    "title": "用一个细节代替三次very",
    "subtitle": "Specific, selective detail",
    "minutes": 18,
    "objective": "选择能让听者理解感受或情境的具体细节，不堆砌修饰。",
    "brief": "very busy可以正确，也可以不够有画面。一个相关动作或感官细节常能让感受更可信。不过细节不是文学竞赛：每句都雕琢会拖慢日常交流，且不能把想象写成真实记忆。",
    "example": {
      "before": "The cafe was very busy and quite noisy.",
      "after": "Every table was full, and we had to lean across the table to hear each other.",
      "note": "after用具体观察呈现忙与吵。若只想快速说明为什么换店，before也可能足够。表达选择取决于目的。"
    },
    "questions": [
      {
        "id": "story-02-q1",
        "prompt": "You want to show that a waiting room was quiet using one observable detail. Which sentence does that without inventing anyone’s thoughts?",
        "options": [
          "Everyone seemed to be keeping their worries to themselves.",
          "The waiting room was unusually quiet that morning.",
          "I could hear the clock ticking from the far side of the room.",
          "The receptionist had asked people to wait quietly."
        ],
        "answer": 2,
        "explanation": "C用一个直接可观察的声音细节呈现安静。B是概括性描述；A推测内心状态；D报告要求，而不说明现场实际怎样。"
      },
      {
        "id": "story-02-q2",
        "prompt": "A short story is about being unable to hear a friend in a restaurant. Which detail earns its place?",
        "options": [
          "The restaurant had recently changed its opening hours.",
          "We kept asking each other to repeat the last sentence.",
          "The menu was printed on two separate sheets.",
          "I had first heard about the restaurant from a neighbor."
        ],
        "answer": 1,
        "explanation": "B直接呈现听不清造成的互动，支持这段故事的主线。"
      },
      {
        "id": "story-02-q3",
        "prompt": "You remember that a train was crowded, but not any exact number. Which description is vivid without false precision?",
        "options": [
          "There were exactly 147 people in the carriage.",
          "Everyone in the carriage was irritated by the crowd.",
          "The carriage was at twice its official capacity.",
          "I stood by the door with barely enough room to turn around."
        ],
        "answer": 3,
        "explanation": "D以自己可观察的空间体验描述拥挤，不编造人数或他人情绪。"
      }
    ],
    "task": {
      "prompt": "Describe a fictional moment of arriving home after a long day in 60–80 words. Use two concrete details and one restrained statement of feeling. Avoid a chain of intensifiers such as very, really, and incredibly.",
      "model": "I put my bag down by the door and noticed that I was still holding my keys. The flat was quiet except for the fridge. I made a cup of tea and sat at the kitchen table without turning on the main light. For the first time that day, I did not have to answer anyone immediately. I felt myself slow down.",
      "notes": [
        "keys、fridge与light构成少量具体细节，不需要全部保留。",
        "最后的感觉来自前面的动作和环境。",
        "这是虚构写作练习；实际回忆不要借用未发生的细节。"
      ],
      "checklist": [
        "细节是否可观察而非猜测？",
        "每个细节是否支持主要感受？",
        "是否存在无意义的程度副词堆叠？",
        "表达是否仍像自己会自然说的话？"
      ]
    },
    "chunks": [
      {
        "id": "story-02-c1",
        "text": "I could hear ... from ...",
        "meaning": "通过具体声音与距离描写场景。",
        "example": "I could hear the music from the other end of the street.",
        "prompt": "Describe a setting through one specific sound."
      },
      {
        "id": "story-02-c2",
        "text": "There was barely enough room to ...",
        "meaning": "通过可做或不可做的动作表现拥挤。",
        "example": "There was barely enough room to open the door fully.",
        "prompt": "Show limited space without inventing an exact measurement."
      },
      {
        "id": "story-02-c3",
        "text": "What I noticed first was ...",
        "meaning": "选择一个主导细节，避免无序罗列。",
        "example": "What I noticed first was the smell of fresh bread.",
        "prompt": "Begin a description with one detail that genuinely stood out."
      }
    ]
  },
  {
    "id": "story-03",
    "track": "story",
    "title": "让感想从经历里长出来",
    "subtitle": "A takeaway the story can support",
    "minutes": 19,
    "objective": "把个人反思与经历中的具体变化连接，不从一次经历推出普遍真理。",
    "brief": "一个小故事可以带来小而真实的认识，不需要以never give up结尾。区分“我以后会怎样做”与“所有人都应该怎样做”，能让反思既有个性又不过度。",
    "example": {
      "before": "I missed the first train. This proves that everything happens for a reason.",
      "after": "I missed the first train because I had not checked the weekend timetable. Since then, I check the schedule the night before an early trip.",
      "note": "after的感想是可追溯的行为调整，不把偶然事件提升为无法支持的普遍结论。"
    },
    "questions": [
      {
        "id": "story-03-q1",
        "prompt": "A colleague helped you find an error by asking a simple question. Which reflection stays close to that experience?",
        "options": [
          "The right question can solve any difficult problem immediately.",
          "That made me more willing to explain my reasoning before assuming it was clear.",
          "I now believe that independent work is generally ineffective.",
          "The incident showed that experienced people do not need technical knowledge."
        ],
        "answer": 1,
        "explanation": "B描述个人习惯变化，与经历直接相关。其他选项把一次事件扩张成普遍断言。"
      },
      {
        "id": "story-03-q2",
        "prompt": "You enjoyed a class you had almost skipped. Which conclusion is appropriately limited?",
        "options": [
          "I should accept every invitation I feel uncertain about.",
          "Feeling hesitant is usually a sign that an activity will be worthwhile.",
          "This time, I was glad I gave it a try.",
          "The class would probably be equally enjoyable for everyone."
        ],
        "answer": 2,
        "explanation": "This time限定结论，不把一次积极结果变成永远应接受的规则。"
      },
      {
        "id": "story-03-q3",
        "prompt": "Which ending connects a story about a confusing handover to a practical change?",
        "options": [
          "Now I include the file link and the next action in every handover I send.",
          "The experience confirmed that people rarely read instructions carefully.",
          "The incident reminded me that communication is a large and complicated subject.",
          "Since then, I have assumed that written handovers cannot be trusted."
        ],
        "answer": 0,
        "explanation": "A给出具体可执行的改变，回应故事中的问题。"
      }
    ],
    "task": {
      "prompt": "Tell a short fictional story about discovering that someone interpreted your message differently from how you intended. End with one specific communication habit you would change. Do not generalize about all people or all cultures.",
      "model": "I once wrote “send it when you can” because I wanted to sound considerate. I still expected the file that afternoon, but my colleague understood that there was no deadline. We only noticed the mismatch when I asked for it before the meeting. Since then, I state the real deadline and say explicitly whether it can move. Being vague had not made the request kinder; it had made it harder to plan.",
      "notes": [
        "反思来自这次deadline误解，不归因于国籍或人格。",
        "最后一句是对该事件的解读，不需要把所有含糊表达都判为不好。",
        "行动改变比泛泛说“沟通很重要”更可迁移。"
      ],
      "checklist": [
        "反思能从前面的事件推出吗？",
        "是否把个人经验外推成所有人的规律？",
        "新的行为是否具体？",
        "故事与结尾是否属于同一条主线？"
      ]
    },
    "chunks": [
      {
        "id": "story-03-c1",
        "text": "Since then, I have ...",
        "meaning": "连接一次经历与后来持续的行为变化。",
        "example": "Since then, I have checked the date before booking anything.",
        "prompt": "Explain a habit that changed after an experience."
      },
      {
        "id": "story-03-c2",
        "text": "What stayed with me was ...",
        "meaning": "指出经历中真正留下影响的部分。",
        "example": "What stayed with me was how much one clear question changed the conversation.",
        "prompt": "Name the part of an experience that you kept thinking about."
      },
      {
        "id": "story-03-c3",
        "text": "It made me more willing to ...",
        "meaning": "描述程度有限的个人态度变化。",
        "example": "It made me more willing to ask for clarification early.",
        "prompt": "Describe a personal shift without claiming a universal lesson."
      }
    ]
  },
  {
    "id": "story-04",
    "track": "story",
    "title": "同一故事，讲短也讲好",
    "subtitle": "Keep the spine when you compress",
    "minutes": 20,
    "objective": "根据时间和听者兴趣压缩故事，保留目的、变化、结果与必要感受。",
    "brief": "短版本不是把长版本说得更快，而是选择更少的信息。先保留故事骨架，再决定是否加入一个有意义的细节。听者追问时可以展开；不必第一轮把全部背景一次说完。",
    "example": {
      "before": "We planned a picnic, checked several forecasts, packed food, discussed three parks, and drove across town before it started raining.",
      "after": "Our picnic got rained out, so we moved to a friend’s kitchen and ended up talking there all afternoon.",
      "note": "after保留计划变化和结果，适合作为聊天中的首轮回答。若重点是天气判断失败，就应保留不同的细节。"
    },
    "questions": [
      {
        "id": "story-04-q1",
        "prompt": "A friend asks for the short version of a trip that involved a missed connection and an unexpected pleasant stop. Which answer keeps the main arc?",
        "options": [
          "We missed our connection, spent the afternoon in a town we had not planned to visit, and ended up enjoying the detour.",
          "We traveled through several places and had a number of memorable experiences.",
          "We packed light, left early, and followed the route we had planned in detail.",
          "We missed a connection, and I can list the departure time and platform of every train afterward."
        ],
        "answer": 0,
        "explanation": "A保留变化与结果。压缩靠选择信息，不靠加速或把内容变空。"
      },
      {
        "id": "story-04-q2",
        "prompt": "You are telling a past-tense story about discovering a ticket problem. Which sentence places the mistaken booking before that discovery?",
        "options": [
          "I had booked the ticket for the wrong day.",
          "I booked a replacement ticket after I discovered the mistake.",
          "I was about to book the ticket when I noticed the date.",
          "I would book a different ticket the next morning."
        ],
        "answer": 0,
        "explanation": "had booked把订错票放在过去的发现时刻之前。其他选项都是可以成立的英语句子，但描述的是之后换票、尚未订票或后续计划。"
      },
      {
        "id": "story-04-q3",
        "prompt": "Your listener asks, “What happened next?” after your short version. What is the best next move?",
        "options": [
          "Repeat the summary from the beginning so the listener hears the same structure again.",
          "Add the next relevant event or detail they asked for.",
          "Switch to the general lesson because you have already given the short version.",
          "Explain all the background before answering what happened next."
        ],
        "answer": 1,
        "explanation": "听者给出了展开方向，补充对应细节比重新从头讲或继续背稿更自然。"
      }
    ],
    "task": {
      "prompt": "Use the same fictional event for two versions. Event: you went to a book discussion, brought the wrong book, felt awkward, and discovered that the group welcomed your different perspective. Give a 20-second version and a 60-second version. Preserve the same facts in both.",
      "model": "Short version: I brought the wrong book to a book discussion and expected an awkward evening. It turned out the group was happy to hear a different perspective, so the mistake became part of the conversation.\n\nLonger version: I arrived at a book discussion, took out my copy, and noticed that everyone else had a different cover. I had mixed up two titles. For a moment, I thought I should leave, but the group invited me to stay and compare the themes with the book I had read. I could not comment on their plot details, but I could contribute to the wider discussion. What started as an awkward mistake turned into a surprisingly relaxed evening.",
      "notes": [
        "短版保留问题与结果，长版增加发现过程和参与方式。",
        "事实一致，不能为了长版精彩新增不存在的冲突。",
        "说出来计时，目标时长是练习约束，不是评分标准。"
      ],
      "checklist": [
        "两个版本的核心事实是否相同？",
        "短版是否仍有变化和结果？",
        "长版新增细节是否值得听？",
        "能否根据追问调整，而非只能背固定稿？"
      ]
    },
    "chunks": [
      {
        "id": "story-04-c1",
        "text": "The short version is ...",
        "meaning": "明确给一个压缩版本。",
        "example": "The short version is that we missed the train but enjoyed the unexpected stop.",
        "prompt": "Signal that you are giving the main arc rather than every detail."
      },
      {
        "id": "story-04-c2",
        "text": "I had already ... by the time ...",
        "meaning": "把两个过去动作的先后关系说清。",
        "example": "I had already bought the ticket by the time I noticed the date.",
        "prompt": "Explain which action happened first in a past story."
      },
      {
        "id": "story-04-c3",
        "text": "What started as ... turned into ...",
        "meaning": "概括经历从一种状态变为另一种状态。",
        "example": "What started as a quick visit turned into an afternoon-long conversation.",
        "prompt": "Summarize the central change in a story."
      }
    ]
  }
];

export const diagnostic = [
  {
    "id": "baseline-01",
    "skill": "precision",
    "prompt": "A report shows that ten interviewed customers found setup easier. No wider survey was conducted. Which summary keeps the correct scope?",
    "options": [
      "The interviews confirm that setup is easier for customers generally.",
      "The ten customers interviewed said setup was easier.",
      "The redesign made setup easier for all users.",
      "The respondents preferred every part of the revised setup."
    ],
    "answer": 1,
    "explanation": "B准确报告这十位受访者的反馈；不能据此断言所有用户。"
  },
  {
    "id": "baseline-02",
    "skill": "register",
    "prompt": "A friendly colleague has already agreed to review a paragraph. You want to ask whether Friday is feasible. Which message best fits?",
    "options": [
      "Please ensure that your review is completed by Friday.",
      "Let me know whenever you have a chance to think about the paragraph.",
      "Would Friday work for the paragraph review?",
      "Thank you for completing the paragraph review by Friday."
    ],
    "answer": 2,
    "explanation": "C在已有审阅约定上询问星期五是否可行。A、D把这个日期写得像已经确定；B没有解决具体时间问题。"
  },
  {
    "id": "baseline-03",
    "skill": "flow",
    "prompt": "A reader asks, “Should we send the draft today?” One key figure is unverified. Which opening answers the decision directly?",
    "options": [
      "The draft includes the main findings and a revised cost table.",
      "The team has completed most of the planned changes.",
      "There is one figure that deserves further discussion.",
      "I would wait until the key figure is verified before sending it."
    ],
    "answer": 3,
    "explanation": "D先回应发送决定，并提供直接相关的理由。"
  },
  {
    "id": "baseline-04",
    "skill": "stance",
    "prompt": "New evidence weakens an explanation you previously favored, but does not eliminate it. Which update is best calibrated?",
    "options": [
      "The new evidence lowers my confidence in that explanation, though it remains possible.",
      "The new evidence rules that explanation out.",
      "My earlier explanation remains just as convincing as before.",
      "The new evidence confirms that the opposite explanation must be true."
    ],
    "answer": 0,
    "explanation": "A把信心下降与彻底排除分开。"
  },
  {
    "id": "baseline-05",
    "skill": "interaction",
    "prompt": "A teammate asks for a “final” version. You are unsure whether they mean ready for internal approval or ready for publication. Which reply best clarifies the request?",
    "options": [
      "I will prepare it for publication unless you tell me otherwise.",
      "By “final,” do you mean ready for internal approval or ready to publish?",
      "Could you repeat the delivery date?",
      "Would you prefer a document or a presentation?"
    ],
    "answer": 1,
    "explanation": "B定位final的具体含义，不扩大成无关的大问题。"
  },
  {
    "id": "baseline-06",
    "skill": "story",
    "prompt": "You have twenty seconds to tell a friend why your planned walk turned into a cafe visit. Which version has a clear, economical arc?",
    "options": [
      "We chose a route after checking several maps and discussing the weather.",
      "We began with a walk and later spent some time in a different place.",
      "It started raining halfway through our walk, so we ducked into a cafe and stayed talking for an hour.",
      "We had considered a cafe beforehand, and the area had several we wanted to try."
    ],
    "answer": 2,
    "explanation": "C保留计划变化和结果，既不是无关背景，也不是空泛概括。"
  },
  {
    "id": "baseline-07",
    "skill": "precision",
    "prompt": "You can deliver an outline on Tuesday, but a finished draft needs another review. Which sentence accurately sets expectations?",
    "options": [
      "I will send the finished draft on Tuesday after the review is complete.",
      "I expect the outline and the approved draft to be ready together on Tuesday.",
      "The next review is scheduled for Tuesday, so the final draft is confirmed for then.",
      "I can send the outline on Tuesday; the finished draft depends on the next review."
    ],
    "answer": 3,
    "explanation": "D区分可交付范围与后续依赖，不用outline代替finished draft。"
  },
  {
    "id": "baseline-08",
    "skill": "interaction",
    "prompt": "A listener thinks you want to remove all meetings. You only want to shorten one weekly meeting. Which response repairs the misunderstanding?",
    "options": [
      "I mean shortening the weekly meeting, not removing all meetings.",
      "I have some general reservations about the way we use meetings.",
      "I thought my view on meetings was already clear.",
      "We can discuss whether all meetings are necessary at another time."
    ],
    "answer": 0,
    "explanation": "A直接替换误解中的范围，随后可以再解释具体做法。"
  }
];
