const SHEET_ID = '1z9Xi8qHqDZ7QOHiI0D6SefqBkVmN6vmf-B-_xyZWtIY'; 
const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'); 
const DRIVE_FOLDER_ID = '1wGMT5TVIYRVFm_fr7SDLiXSgrX4YHi0J'; // Your folder ID

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Ғылыми Зертхана (The Science Lab)')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let result = {};

    switch (data.action) {
      case 'register':
        result = registerUser(data.username, data.password);
        break;
      case 'login':
        result = authenticateUser(data.username, data.password);
        break;
      case 'ask_gemini':
        result = { success: true, response: askGemini(data.prompt, data.lang) };
        break;
      case 'save_progress':
        result = saveProgress(data.username, data.progress);
        break;
      case 'upload_file':
        result = uploadFile(data.username, data.filename, data.mimeType, data.base64);
        break;
      case 'get_files':
        result = getUserFiles(data.username);
        break;
      case 'search_projects':
        result = { success: true, response: searchEnglishArticles(data.topic, data.lang) };
        break;
      case 'check_plagiarism':
        result = checkPlagiarism(data.text, data.lang);
        break;
      default:
        result = { success: false, message: data.lang === 'kk' ? "Белгісіз әрекет." : (data.lang === 'ru' ? "Неизвестное действие." : "Unknown action.") };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Backend Error: " + error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- DIAGNOSTIC FUNCTION (RUN THIS MANUALLY IN EDITOR) ---
function testDriveAccess() {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    Logger.log("Success! Folder name: " + folder.getName());
    return "Connected to: " + folder.getName();
  } catch (e) {
    Logger.log("Error: " + e.toString());
    return "Error: " + e.toString();
  }
}

// --- CORE FUNCTIONS ---

/**
 * 
 * Бір рет іске қосыңыз (Run once from Editor).
 * Бұл функция жаңа API кілтін Script Properties-ке қауіпсіз түрде сақтайды.
 * Сақтап болған соң, бұл функцияны өшіріп тастауға немесе осылай қалдыруға болады.
 */


function saveToSheet(data, sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.appendRow(data);
  return { success: true };
}

function getFromSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  return sheet.getDataRange().getValues().slice(1);
}

function generateUniqueId(users) {
  let id;
  let isUnique = false;
  while (!isUnique) {
    id = Math.floor(100000 + Math.random() * 900000);
    isUnique = true;
    for (let u of users) {
      if (String(u[2]) === String(id)) {
        isUnique = false;
        break;
      }
    }
  }
  return id;
}

function authenticateUser(username, password) {
  const users = getFromSheet('Users');
  for (let i = 0; i < users.length; i++) {
    if (String(users[i][0]) === String(username) && String(users[i][1]) === String(password)) {
      let id = users[i][2];
      if (!id) {
        id = generateUniqueId(users);
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const sheet = ss.getSheetByName('Users');
        sheet.getRange(i + 2, 3).setValue(id);
      }
      const progress = getProgress(username);
      return { success: true, username: username, id: String(id), progress: progress };
    }
  }
  return { success: false, message: "Қате логин немесе құпия сөз." };
}

function registerUser(username, password) {
  if (!username || !password) return { success: false, message: "Деректерді толтырыңыз." };
  const users = getFromSheet('Users');
  for (let u of users) {
    if (String(u[0]) === String(username)) return { success: false, message: "Мұндай қолданушы бар." };
  }
  const uniqueId = generateUniqueId(users);
  saveToSheet([username, password, uniqueId, new Date()], 'Users');
  return { success: true, message: "Тіркелу сәтті өтті.", username: username, id: uniqueId };
}


function askGemini(prompt, lang = 'kk') {
  const model = "gemma-3-27b-it";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  const langName = lang === 'ru' ? 'Russian' : (lang === 'en' ? 'English' : 'Kazakh');
  const systemInstruction = `You are the intelligent assistant of "The Science Lab" platform. Your goal is to help users with writing scientific papers, research methodology, data analysis, and academic writing. Please provide all your answers in ${langName}, in a polite and professional (academic) style. If you are asked an irrelevant or inappropriate question, politely remind the user that your main focus is scientific research and try to steer the question in that direction. In your answers, highlight important parts in bold or as a list.`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: systemInstruction + "\n\nҚолданушы сұрағы: " + prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    
    if (json.candidates && json.candidates[0] && json.candidates[0].content) {
      return json.candidates[0].content.parts[0].text;
    } else {
      return "Bot Error: " + (json.error ? json.error.message : "Түсініксіз қателік орын алды.");
    }
  } catch (e) {
    return "Network Error: " + e.toString();
  }
}

function searchEnglishArticles(topic, lang = 'kk') {
  const model = "gemma-3-27b-it";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  const systemInstruction = `You are an academic search engine. Find 5 specific scientific articles in English that match the topic provided by the user. 
Return the response ONLY as a JSON array in the following format, without any extra text or backticks:
[
  {
    "title": "Article Title",
    "authors": "Author name(s)",
    "year": "Publication Year",
    "link": "URL to article"
  }
]
If articles are found, return only this JSON.`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: systemInstruction + "\n\nТақырып: " + topic }]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    
    if (json.candidates && json.candidates[0] && json.candidates[0].content) {
      return json.candidates[0].content.parts[0].text;
    } else {
      return "Error: " + (json.error ? json.error.message : "Түсініксіз қателік орын алды.");
    }
  } catch (e) {
    return "Error: " + e.toString();
  }
}

function saveProgress(username, progress) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName('Progress');
  if (!sheet) {
    sheet = ss.insertSheet('Progress');
    sheet.appendRow(['Username', 'Data']);
  }
  const data = sheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(username)) {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(progress));
      found = true;
      break;
    }
  }
  if (!found) sheet.appendRow([username, JSON.stringify(progress)]);
  return { success: true };
}

function getProgress(username) {
  const allData = getFromSheet('Progress');
  for (let row of allData) {
    if (String(row[0]) === String(username)) {
      try { return JSON.parse(row[1]); } catch(e) { return {}; }
    }
  }
  return {};
}

function uploadFile(username, originalName, mimeType, base64Data) {
  try {
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, originalName);
    
    let userId = "000000";
    const users = getFromSheet('Users');
    for (let u of users) {
      if (String(u[0]) === String(username)) { userId = String(u[2]); break; }
    }

    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const savedName = userId + "_" + originalName;
    const file = folder.createFile(blob);
    file.setName(savedName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileUrl = file.getUrl();
    const timestamp = new Date().toISOString();
    saveToSheet([username, originalName, savedName, fileUrl, timestamp], 'Files');
    
    return { success: true, url: fileUrl };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function getUserFiles(username) {
  try {
    const allRecords = getFromSheet('Files');
    const userFiles = [];
    for (let row of allRecords) {
      if (String(row[0]) === String(username)) {
        userFiles.push({ originalName: row[1], url: row[3], timestamp: row[4] });
      }
    }
    return { success: true, files: userFiles };
  } catch (e) {
    return { success: false, message: "Fetch Error: " + e.toString() };
  }
}

function checkPlagiarism(text, lang = 'kk') {
  const model = "gemma-3-27b-it";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  const langName = lang === 'ru' ? 'Russian' : (lang === 'en' ? 'English' : 'Kazakh');
  const systemInstruction = `You are an academic anti-plagiarism expert. Analyze the provided text for originality. 
Return the response ONLY in JSON format, without any extra text or backticks:
{
  "percentage": "80-90%",
  "status": "GOOD",
  "tips": [
    "Academic tip 1 in ${langName}",
    "Academic tip 2 in ${langName}",
    "Academic tip 3 in ${langName}"
  ]
}
Rules:
1. "percentage" - should be a 10% range.
2. "status" - use ONE word in ${langName} equivalent to: 80%+ "GOOD", 50-80% "MEDIUM", <50% "LOW".
3. "tips" - 3 concrete tips in ${langName}.
4. The answer must be strictly JSON.`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: systemInstruction + "\n\nМәтінді талда:\n\n" + text }]
      }
    ],
    generationConfig: {
      temperature: 0.1, 
      maxOutputTokens: 2048,
    }
  };

  try {
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    
    if (json.candidates && json.candidates[0] && json.candidates[0].content) {
      return { success: true, response: json.candidates[0].content.parts[0].text };
    } else {
      let errMsg = "AI жауап бере алмады.";
      if (json.error) errMsg += " API Error: " + json.error.message;
      else if (json.promptFeedback) errMsg += " Blocked by safety filters.";
      return { success: false, message: errMsg };
    }
  } catch (e) {
    return { success: false, message: "Network Error: " + e.toString() };
  }
}
