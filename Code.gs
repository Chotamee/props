const SHEET_ID = '1z9Xi8qHqDZ7QOHiI0D6SefqBkVmN6vmf-B-_xyZWtIY'; 
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace with yours
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
        result = { success: true, response: askGemini(data.prompt) };
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
      default:
        result = { success: false, message: "Белгісіз әрекет." };
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

function askGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  const options = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload) };
  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    return json.candidates[0].content.parts[0].text;
  } catch (e) {
    return "Gemini API Error: " + e.toString();
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
