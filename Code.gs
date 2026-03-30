const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; // Replace with your actual Spreadsheet ID
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace with your actual Gemini API Key

function doGet(e) {
  // Option to still serve the HTML via GET if desired
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Ғылыми Зертхана (The Science Lab)')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function doPost(e) {
  // Support CORS headers if required, though Apps Script automatically wraps responses
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
      default:
        result = { success: false, message: "Белгісіз әрекет (Unknown action)." };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Saves data to a specified sheet.
 */
function saveToSheet(data, sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  sheet.appendRow(data);
  return { success: true };
}

/**
 * Retrieves data from the specified sheet.
 */
function getFromSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) return [];
  
  return sheet.getDataRange().getValues();
}

/**
 * Generate a unique 6-digit ID
 */
function generateUniqueId(users) {
  let id;
  let isUnique = false;
  while (!isUnique) {
    id = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit ID
    isUnique = !users.some(r => r[2] == id); // check index 2 (ID column)
  }
  return id;
}

/**
 * Authenticates a user against the "Users" sheet.
 * Users sheet format: [Username, Password, ID, CreatedAt]
 */
function authenticateUser(username, password) {
  if (!username || !password) {
    return { success: false, message: "Логин немесе құпия сөз бос болмауы керек." };
  }
  
  const users = getFromSheet('Users');
  
  // Skip header if it exists
  for (let i = 0; i < users.length; i++) {
    if (users[i][0] === username && users[i][1] === password) {
      // ID is at index 2
      let id = users[i][2];
      if (!id) {
        // Migration: give them an ID if they don't have one
        id = generateUniqueId(users);
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const sheet = ss.getSheetByName('Users');
        sheet.getRange(i + 1, 3).setValue(id); // row is i+1, column is 3 (1-indexed)
      }
      return { success: true, username: username, id: id };
    }
  }
  return { success: false, message: "Қате логин немесе құпия сөз (Invalid login or password)." };
}

/**
 * Registers a new user to the "Users" sheet.
 */
function registerUser(username, password) {
  if (!username || !password) {
    return { success: false, message: "Деректерді толтырыңыз (Fill in all fields)." };
  }
  
  const users = getFromSheet('Users');
  
  for (let i = 0; i < users.length; i++) {
    if (users[i][0] === username) {
      return { success: false, message: "Мұндай қолданушы бар (Username already exists)." };
    }
  }
  
  const uniqueId = generateUniqueId(users);
  
  saveToSheet([username, password, uniqueId, new Date()], 'Users');
  return { success: true, message: "Тіркелу сәтті өтті (Registration successful).", username: username, id: uniqueId };
}

/**
 * Calls the Gemini API from the backend
 */
function askGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    "contents": [{
      "parts": [{ "text": prompt }]
    }]
  };
  
  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.candidates && result.candidates.length > 0) {
      const textResponse = result.candidates[0].content.parts[0].text;
      saveToSheet([new Date(), prompt, textResponse], "QueryHub_Logs");
      return textResponse;
    } else {
      return "Gemini API-ден жауап жоқ (No response).";
    }
  } catch (error) {
    return "Қате (Error): " + error.toString();
  }
}
