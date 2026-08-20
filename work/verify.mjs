import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../data/ep01.js", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const data = context.window.EP01_DATA;
const placeholders = [...data.paragraphs.join("\n").matchAll(/\{\{([A-Za-z]+)\}\}/g)].map(match => match[1]);
const keys = Object.keys(data.words);
const required = ["phonetic", "pos", "context", "core", "meanings", "collocations", "storyHook"];

const failures = [];
if (keys.length !== 27) failures.push(`Expected 27 word records, got ${keys.length}`);
if (placeholders.length !== 27) failures.push(`Expected 27 clickable tokens, got ${placeholders.length}`);
if (new Set(placeholders).size !== placeholders.length) failures.push("Duplicate target token found in article");
if (JSON.stringify(placeholders) !== JSON.stringify(keys)) failures.push("Article token order and data order differ");
if (!keys.includes(data.defaultWord)) failures.push("Default word is missing");
for (const word of keys) {
  for (const field of required) {
    if (!data.words[word][field] || data.words[word][field].length === 0) failures.push(`${word}: missing ${field}`);
  }
  if (!data.words[word].wordFormation && !data.words[word].mnemonic) failures.push(`${word}: missing formation/mnemonic`);
}

const original = [
  "“签了。”", "结婚第三十天。", "我把 divorce 协议推到陆沉舟面前。", "他神色 indifferent，冷淡的 appearance 看不出情绪。",
  "“这是你的 initial 决定？”", "“是。”", "他翻开 previous 版本。", "“你对这一条的 interpret 是 erroneous 的。”",
  "我皱眉：“什么后果？”", "“离婚后，沈家的债务会成为你的 obligation。”", "我终于 perceive 到问题。",
  "短短三十天，沈家的事已经成了我的 burden，这份协议却比想象中更 complicated。", "“Regardless——任何 consequence，我都离。”",
  "他第一次 hesitate，却没有签字。", "“先 consult 律师。”", "“没必要。”", "“你连自己 submit 的协议都没看懂。”", "我被噎住。",
  "从我的 perspective，离婚只需要双方 accord，必要时各退一步 compromise。", "可陆沉舟显然不这么想。", "“现在 aware 到问题了？”",
  "“所以你到底签不签？”", "“不签。”", "第二天，新协议送到我手里。", "原来的债务条款全部 reverse，我有了更多 available 选择。",
  "律师低声说：“陆总改的。”", "我有些 doubtful。", "那个看起来最冷漠的人，为什么替我承担风险？", "我决定亲自 confront 他。",
  "手机却先亮了。", "陆沉舟只有一句：", "“协议不会 seal。”", "“等你足够 mature，再来和我谈离婚。”",
  "我盯着屏幕，第一次开始 appreciate 他的“不肯签字”。"
];
const renderedText = data.paragraphs.map(p => p.replace(/\{\{([A-Za-z]+)\}\}/g, "$1"));
if (JSON.stringify(renderedText) !== JSON.stringify(original)) failures.push("Rendered EP01 text differs from source transcription");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`PASS: ${data.paragraphs.length} paragraphs, ${keys.length} data records, ${placeholders.length} clickable tokens.`);
console.log("PASS: EP01 rendered text exactly matches the source transcription.");
