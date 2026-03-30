const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; // Replace with your actual Spreadsheet ID
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace with your actual Gemini API Key

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Ғылыми Зертхана (The Science Lab)')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
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
 * Authenticates a user against the "Users" sheet.
 * Users sheet should have columns: [Username, Password]
 */
function authenticateUser(username, password) {
  const users = getFromSheet('Users');
  
  // Skip the header row if it exists (assuming first row is "Username", "Password")
  for (let i = 0; i < users.length; i++) {
    if (users[i][0] === username && users[i][1] === password) {
      return { success: true, username: username };
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
  
  saveToSheet([username, password, new Date()], 'Users');
  return { success: true, message: "Тіркелу сәтті өтті (Registration successful)." };
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
