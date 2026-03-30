# How to Deploy "The Science Lab" (Қалай орнату керек)

Follow these exact steps to update your Google Apps Script project with the new **Kazakh Language, Authentication, and Responsive System**.

## Step 1: Update Google Apps Script Backend (Code.gs)
1. Go to your Google Sheet, and open the Apps Script editor (**Extensions > Apps Script**).
2. Open `C:\Users\zogog\Desktop\Projects\Science\Code.gs` on your computer.
3. **Copy all the text** from that file.
4. Replace the contents of the `Code.gs` file in Apps Script.
5. Make sure to put your actual `"YOUR_GOOGLE_SHEET_ID"` and `"YOUR_GEMINI_API_KEY"` at the top!

## Step 2: Update Frontend (Index.html)
1. Open `C:\Users\zogog\Desktop\Projects\Science\Index.html`.
2. **Copy all the text** from that file.
3. Open `Index.html` in your Apps Script window, delete the old code, and Paste the new code.

## Step 3: IMPORTANT - Prepare Your Database (Sheets)
Because we added an **Authentication System**, your script will crash if it cannot find the users database.
1. Open your Google Spreadsheet (the one linked in `SHEET_ID`).
2. At the bottom, click the **+** to add a new sheet.
3. Rename this new sheet exactly: `Users`
4. In the `Users` sheet, put **Username** in cell A1, and **Password** in cell B1. (You can also leave it blank, the script will append logs automatically when users register).

You should also have your `QueryHub_Logs` and `Dataset` sheets from the previous setup.

## Step 4: Deploy
1. Click **Deploy > Manage deployments**.
2. Click the edit pencil icon on your current deployment.
3. In "Version", switch it to **New version**.
4. Click **Deploy**.

Your app is now fully localized in Kazakh, fully responsive on mobile phones, has perfectly sized dashboard cards, and asks for a Login upon entry!
