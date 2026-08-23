(function () {
  "use strict";
  const add = (chapter, map) => Object.entries(map).forEach(([word, fields]) => {
    if (chapter?.words?.[word]) Object.assign(chapter.words[word], fields);
  });

  add(window.EP01_DATA, {
    interpret: { confusables: ["interpret：解释、理解含义", "translate：在不同语言之间翻译"], examUsage: "高频结构 interpret A as B：把 A 理解为 B。", errorPoint: "interpretation 是名词；interpreter 通常指口译员。", example: { en: "The clause can be interpreted in several ways.", zh: "这一条款可以有几种不同的理解。" } },
    erroneous: { confusables: ["erroneous：基于错误认识，较正式", "wrong：一般性的“错误”"], examUsage: "常修饰 conclusion、belief、assumption、information。", example: { en: "The decision was based on an erroneous assumption.", zh: "这项决定建立在一个错误假设之上。" } },
    obligation: { confusables: ["obligation：法律、道德或约定产生的义务", "responsibility：职责或应承担的责任"], examUsage: "常见 fulfill an obligation；be under an obligation to do 表示“有义务做……”。", example: { en: "Companies have a legal obligation to protect personal data.", zh: "企业有保护个人数据的法律义务。" } },
    consequence: { confusables: ["consequence：行为产生的后果，常含负面意味", "result：中性的结果"], examUsage: "常见 as a consequence 和 face the consequences。", example: { en: "Small errors can have serious consequences.", zh: "小错误也可能造成严重后果。" } },
    submit: { examUsage: "submit a report 表示“提交”；submit to 表示“屈服于、服从”。", errorPoint: "表示提交给某人，用 submit sth. to sb.。", example: { en: "Applicants must submit the form by Friday.", zh: "申请人必须在周五前提交表格。" } },
    perspective: { confusables: ["perspective：看问题的视角", "prospect：前景；可能性"], examUsage: "from a … perspective 是阅读和写作中的常用结构。", example: { en: "The issue looks different from a legal perspective.", zh: "从法律角度看，这个问题会有所不同。" } },
    compromise: { examUsage: "除“妥协”外，动词还可表示“危及、损害”，如 compromise safety。", errorPoint: "与某人妥协用 compromise with sb.；达成妥协用 reach a compromise。", example: { en: "Neither side was willing to compromise.", zh: "双方都不愿作出让步。" } },
    appreciate: { examUsage: "除“欣赏、感激”外，还常表示“充分理解”；也可表示资产升值。", errorPoint: "不用 appreciate sb. to do；可用 appreciate sb.'s doing 或 appreciate it if…。", example: { en: "We appreciate the difficulty of reaching an agreement.", zh: "我们理解达成协议并非易事。" } }
  });

  add(window.EP02_DATA, {
    bankrupt: { confusables: ["bankrupt：依法或事实上无力偿债", "broke：没钱的，口语表达"], examUsage: "还可作动词表示“使破产”；bankrupt of ideas 表示“完全缺乏想法”。", example: { en: "Several small firms went bankrupt during the crisis.", zh: "危机期间，几家小公司破产了。" } },
    revenue: { confusables: ["revenue：企业或政府取得的收入", "profit：扣除成本后的利润", "income：个人或机构的收入"], examUsage: "经济类阅读中，revenue 不能直接译为“利润”。", example: { en: "Advertising provides most of the company's revenue.", zh: "广告贡献了这家公司大部分收入。" } },
    reserve: { examUsage: "名词可指“储备”；动词可指“保留、预订”。reserve the right to do 是正式表达。", errorPoint: "reservation 既可指“预订”，也可指“保留意见”。", example: { en: "The company keeps a cash reserve for emergencies.", zh: "公司保留一笔现金储备以应对紧急情况。" } },
    vanish: { confusables: ["vanish：突然或完全消失", "fade：逐渐变淡、消退", "disappear：一般性的消失"], example: { en: "The funds appeared to vanish without a trace.", zh: "这笔资金似乎消失得无影无踪。" } },
    inflation: { confusables: ["inflation：整体物价持续上涨", "price rise：某种商品价格上涨"], examUsage: "常见 rising inflation、control inflation、inflation rate。", example: { en: "High inflation reduces the value of household savings.", zh: "高通胀会降低家庭储蓄的实际价值。" } },
    currency: { confusables: ["currency：一国流通的货币体系", "cash：纸币和硬币形式的现金"], examUsage: "还可表示观点或说法的“流行、通行”，如 gain currency。", example: { en: "The local currency fell sharply against the dollar.", zh: "当地货币对美元大幅贬值。" } },
    sensitive: { examUsage: "be sensitive to 表示“对……敏感”；sensitive information 指需谨慎处理的信息。", errorPoint: "sensible 是“明智的”，不要与 sensitive 混淆。", example: { en: "Financial records contain highly sensitive information.", zh: "财务记录包含高度敏感的信息。" } },
    application: { confusables: ["application：申请行为或申请材料", "applicant：申请人"], examUsage: "除“申请”外，还常表示“应用、适用”。", errorPoint: "申请某职位用 application for；向机构申请用 application to。", example: { en: "Please submit your application before the deadline.", zh: "请在截止日期前提交申请材料。" } }
  });

  add(window.EP03_DATA, {
    qualification: { confusables: ["qualification：资格、资历或合格条件", "quality：质量；品质"], examUsage: "复数 qualifications 常指学历和工作资历。", example: { en: "Experience is an essential qualification for the position.", zh: "经验是胜任该职位的一项必要条件。" } },
    executive: { examUsage: "可作名词指企业高管，也可作形容词指“行政的、执行的”。", example: { en: "Senior executives approved the training plan.", zh: "公司高管批准了这项培训计划。" } },
    skeptical: { confusables: ["skeptical：不轻信、持怀疑态度", "doubtful：不确定或觉得可疑"], examUsage: "常见 be skeptical about / of。", example: { en: "Many researchers remain skeptical about the claim.", zh: "许多研究人员仍对这一说法持怀疑态度。" } },
    competence: { confusables: ["competence：完成任务所需的胜任能力", "ability：泛指做某事的能力"], examUsage: "常见 professional competence；通常作不可数名词。", example: { en: "The interview is designed to assess professional competence.", zh: "这次面试旨在评估专业胜任能力。" } },
    curriculum: { confusables: ["curriculum：一套课程体系", "course：一门具体课程"], errorPoint: "复数既可用 curricula，也可用 curriculums。", example: { en: "The university revised its business curriculum.", zh: "这所大学调整了商科课程体系。" } },
    personnel: { confusables: ["personnel：一个机构的全体人员", "personal：个人的；私人的"], errorPoint: "personnel 本身具有集合含义，不写 personnels。", example: { en: "Only authorized personnel may enter the laboratory.", zh: "只有获授权的工作人员可以进入实验室。" } },
    approach: { confusables: ["approach：处理问题的整体思路", "method：具体、系统的方法"], examUsage: "an approach to doing；作动词时直接接宾语。", errorPoint: "不要写 an approach of doing。", example: { en: "We need a more practical approach to staff training.", zh: "我们需要一种更务实的员工培训方式。" } },
    feedback: { examUsage: "常见 provide / receive feedback on sth.。", errorPoint: "feedback 通常是不可数名词，不说 a feedback 或 feedbacks。", example: { en: "Regular feedback helps employees improve their performance.", zh: "定期反馈有助于员工改善表现。" } }
  });

  add(window.EP04_DATA, {
    acquaintance: { confusables: ["acquaintance：认识但不亲近的人", "friend：有较亲近关系的朋友"], examUsage: "make sb.'s acquaintance 表示“结识某人”。", example: { en: "He is a business acquaintance rather than a close friend.", zh: "他只是生意上的熟人，并非亲密朋友。" } },
    casual: { confusables: ["casual：随意的、非正式的", "careless：粗心的"], examUsage: "还可表示“临时的、非正式雇用的”，需结合修饰对象判断。", example: { en: "His casual remark offended several people.", zh: "他随口的一句话冒犯了好几个人。" } },
    prejudice: { confusables: ["prejudice：缺乏事实依据的成见", "bias：使判断偏向一方的倾向"], examUsage: "常见 prejudice against；动词还可表示“损害、不利于”。", example: { en: "Education can help reduce prejudice against outsiders.", zh: "教育有助于减少对外来者的偏见。" } },
    appeal: { examUsage: "可表示“吸引力、呼吁、上诉”；appeal to 可指“吸引”或“向……呼吁”。", errorPoint: "表示“对某人有吸引力”用 appeal to sb.。", example: { en: "The proposal may appeal to younger consumers.", zh: "这项提议可能会吸引年轻消费者。" } },
    inferior: { confusables: ["inferior：质量、地位等较差的", "junior：资历或级别较低的"], examUsage: "常见 be inferior to 和 inferior quality。", errorPoint: "固定搭配 inferior to，不用 inferior than。", example: { en: "The cheaper product proved inferior to the original.", zh: "事实证明，便宜的产品不如原来的产品。" } },
    imaginative: { confusables: ["imaginative：富有想象力的", "imaginary：想象中的、虚构的"], errorPoint: "形容有创造力的人或作品用 imaginative。", example: { en: "The team proposed an imaginative solution.", zh: "团队提出了一个富有创意的解决方案。" } },
    vocal: { examUsage: "除“嗓音的”外，be vocal about/in support of 表示“公开而强烈地表达”。", example: { en: "She has been vocal in her support for equal opportunity.", zh: "她一直公开支持机会平等。" } },
    impress: { examUsage: "impress sb. with sth.；be impressed by/with 表示“对……印象深刻”。", errorPoint: "人感到印象深刻用 impressed；事物令人印象深刻用 impressive。", example: { en: "Her calm response impressed everyone in the room.", zh: "她冷静的回应给在场所有人留下了深刻印象。" } }
  });
})();
