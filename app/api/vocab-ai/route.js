import openai from "@/services/openai";
import db from "@/services/db"

// 讓前方取得資料庫資料的API 
export async function GET() {
    // 取得 vocab-ai 集合內的所有文件 並定義由最新排到最舊
    const docList = await db.collection("vocab-ai").orderBy("createdAt", "desc").get()
    // 準備要回應的資料
    const vocabList = []
    // 將取得的資料一個一個取出
    docList.forEach(doc => {
    // console.log("一筆文件:", doc)
    // console.log("一筆資料:", doc.date())
    const result = doc.data()
    console.log("一筆資料:", result)
    // 將result放入vocabList
    vocabList.push(result)
})
    // 將 vocabList 回傳給前端
    return Response.json(vocabList)
}

export async function POST(req) {
    const body = await req.json();
    console.log("body:", body);
    const { userInput, language } = body;
    // TODO: 透過gpt-4o-mini模型讓AI回傳相關單字
    // 10:10 繼續上課
    // 文件連結：https://platform.openai.com/docs/guides/text-generation/chat-completions-api?lang=node.js
    // JSON Mode: https://platform.openai.com/docs/guides/text-generation/json-mode?lang=node.js
    const systemPrompt = `請作為一個單字聯想AI根據所提供的單字聯想5個相關單字並放在JSON中  
# 例如:
主題: 水果
語言: English

# 回應範例:
{
    wordList: ["Apple", "Banana", "Cherry", "Date", "Elderberry"],
    zhWordList: ["蘋果", "香蕉", "櫻桃", "棗子", "接骨木"],
}
`;
    const prompt = `
主題: ${userInput}
語言: ${language}    
`;

    const openAIReqBody = {
        messages: [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": prompt }
        ],
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
    };
    const completion = await openai.chat.completions.create(openAIReqBody);
    // 將ai回傳的字串轉換為物件
    const payload = JSON.parse(completion.choices[0].message.content);
    console.log("payload:", payload);
    console.log("payload的型別:", typeof payload);
    // 準備要回傳給前端的資料
    const result = {
        title: userInput,
        payload,
        language,
        createdAt: new Date().getTime(),
    };
    console.log("result", result)
    // 將result存到 vocab-ai 集合內
    await db.collection('vocab-ai').add(result);
    // 把result回傳給前端
    return Response.json(result);
}