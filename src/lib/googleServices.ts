/**
 * Google Workspace Integration Service
 * Client-side integration for Google Sheets, Google Drive, and Gmail
 */

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

let accessToken: string | null = null;

export const setGoogleAccessToken = (token: string) => {
  accessToken = token;
};

export const getGoogleAccessToken = () => accessToken;

/**
 * Request OAuth token using Google Identity Services GIS token client
 */
export const requestGoogleAuthToken = (scopes: string[] = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send'
]): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('مكتبة Google Identity Services غير محملة بعد'));
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      scope: scopes.join(' '),
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        setGoogleAccessToken(response.access_token);
        resolve(response.access_token);
      },
    });

    client.requestAccessToken();
  });
};

/**
 * Export tabular data (e.g. Attendance/Commissions) directly to Google Sheets
 */
export const exportDataToGoogleSheets = async (
  title: string,
  headers: string[],
  rows: (string | number)[][]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('يرجى تسجيل الدخول إلى حساب Google أولاً');
  }

  // 1. Create Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `حِصّتي - ${title} (${new Date().toLocaleDateString('ar-EG')})`,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'تعذر إنشاء جدول البيانات في Google Sheets');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // 2. Append Data Rows
  const values = [headers, ...rows];
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    }
  );

  if (!updateRes.ok) {
    console.warn('Google Sheets append data notice:', await updateRes.text());
  }

  return { spreadsheetId, spreadsheetUrl };
};

/**
 * Send an email notification via Gmail API
 */
export const sendEmailViaGmail = async (params: {
  to: string;
  subject: string;
  bodyText: string;
}): Promise<boolean> => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('يرجى تسجيل الدخول إلى حساب Google أولاً');
  }

  const emailLines = [
    `To: ${params.to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
    '',
    params.bodyText,
  ];

  const rawMessage = btoa(unescape(encodeURIComponent(emailLines.join('\r\n'))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawMessage,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'تعذر إرسال البريد الإلكتروني عبر Gmail');
  }

  return true;
};
