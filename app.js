import { plugin } from 'puppeteer-with-fingerprints';
import fs from 'fs';
import config from './config.js';
import recMail from './utility/recMail.js';
import puppeteer from 'puppeteer-extra';

async function start() {
  // حفظ المرجع الأصلي للـ console.log
  const originalLog = console.log;
  const originalError = console.error;

  const noop = () => { };
  console.log = noop;
  console.error = noop;


  try {
    // Fetch fingerprint and use it
    const fingerprint = await plugin.fetch('', {
      tags: ['Microsoft Windows', 'Chrome'],
    });
    plugin.useFingerprint(fingerprint);

    if (config.USE_PROXY) {
      plugin.useProxy(`${config.PROXY_USERNAME}:${config.PROXY_PASSWORD}@${config.PROXY_IP}:${config.PROXY_PORT}`, {
        detectExternalIP: true,
        changeGeolocation: true,
        changeBrowserLanguage: true,
        changeTimezone: true,
        changeWebRTC: true,
      });
    }

    const chrome = await plugin.spawn({
      headless: false,
    });

    const browser = await puppeteer.connect({
      browserWSEndpoint: chrome.url,
    });

    const page = await browser.newPage();

    page.on('console', () => { });

    await page.setDefaultTimeout(3600000);

    await createAccount(page);
    await delay(30000000);

    // إزالة userDataDir بعد انتهاء العملية لتجنب تسريب البيانات
    fs.rmSync(`./user_data_${process.pid}`, { recursive: true, force: true });

  } finally {
    // استعادة سلوك console.log و console.error الأصلي
    console.log = originalLog;
    console.error = originalError;
  }

  setTimeout(start, 1000); // تأخير لمدة ثانية قبل إعادة التشغيل
}


async function createAccount(page) {
  // Going to Outlook register page.

  await page.goto("https://outlook.live.com/owa/?nlp=1&signup=1");
  await page.waitForSelector(SELECTORS.USERNAME_INPUT);

  // Generating Random Personal Info.
  const PersonalInfo = await generatePersonalInfo();

  // Username
  await page.type(SELECTORS.USERNAME_INPUT, PersonalInfo.username);
  await page.keyboard.press("Enter");

  // Password
  const password = await generatePassword();
  await page.waitForSelector(SELECTORS.PASSWORD_INPUT);
  await page.type(SELECTORS.PASSWORD_INPUT, password);
  await page.keyboard.press("Enter");

  // First Name and Last Name
  await page.waitForSelector(SELECTORS.FIRST_NAME_INPUT);
  await page.type(SELECTORS.FIRST_NAME_INPUT, PersonalInfo.randomFirstName);
  await page.type(SELECTORS.LAST_NAME_INPUT, PersonalInfo.randomLastName);
  await page.keyboard.press("Enter");

  // Birth Date.
  await page.waitForSelector(SELECTORS.BIRTH_DAY_INPUT);
  await delay(1000);
  await page.select(SELECTORS.BIRTH_DAY_INPUT, PersonalInfo.birthDay);
  await page.select(SELECTORS.BIRTH_MONTH_INPUT, PersonalInfo.birthMonth);
  await page.type(SELECTORS.BIRTH_YEAR_INPUT, PersonalInfo.birthYear);
  await page.keyboard.press("Enter");
  const email = await page.$eval(SELECTORS.EMAIL_DISPLAY, el => el.textContent);
  console.log("Doing Captcha...");

  // Waiting for confirmed account.
  await page.waitForSelector(SELECTORS.DECLINE_BUTTON);
  console.log("Captcha Solved!");
  await page.click(SELECTORS.DECLINE_BUTTON);
  await page.waitForSelector(SELECTORS.OUTLOOK_PAGE);



  await writeCredentials(email, password);

}

async function writeCredentials(email, password) {
  // Writes account's credentials on "accounts.txt".
  const account = email + ":" + password;
  console.clear();
  console.log(account);
  fs.appendFile(config.ACCOUNTS_FILE, `\n${account}`, (err) => {
    if (err) {
      console.log(err);
    }
  });
}

async function generatePersonalInfo() {
  const names = fs.readFileSync(config.NAMES_FILE, "utf8").split("\n");
  const randomFirstName = names[Math.floor(Math.random() * names.length)].trim();
  const randomLastName = names[Math.floor(Math.random() * names.length)].trim();
  const username = randomFirstName + randomLastName + Math.floor(Math.random() * 9999);
  const birthDay = (Math.floor(Math.random() * 28) + 1).toString()
  const birthMonth = (Math.floor(Math.random() * 12) + 1).toString()
  const birthYear = (Math.floor(Math.random() * 10) + 1990).toString()
  return { username, randomFirstName, randomLastName, birthDay, birthMonth, birthYear };
}

async function generatePassword() {
  const words = fs.readFileSync(config.WORDS_FILE, "utf8").split("\n");
  const firstword = words[Math.floor(Math.random() * words.length)].trim();
  const secondword = words[Math.floor(Math.random() * words.length)].trim();
  return firstword + secondword + Math.floor(Math.random() * 9999) + '!';
}

const SELECTORS = {
  USERNAME_INPUT: '#usernameInput',
  PASSWORD_INPUT: '#Password',
  FIRST_NAME_INPUT: '#firstNameInput',
  LAST_NAME_INPUT: '#lastNameInput',
  BIRTH_DAY_INPUT: '#BirthDay',
  BIRTH_MONTH_INPUT: '#BirthMonth',
  BIRTH_YEAR_INPUT: '#BirthYear',
  EMAIL_DISPLAY: '#userDisplayName',
  DECLINE_BUTTON: '#declineButton',
  OUTLOOK_PAGE: '#mainApp',
  RECOVERY_EMAIL_INPUT: '#EmailAddress',
  EMAIL_CODE_INPUT: '#iOttText',
  AFTER_CODE: '#idDiv_SAOTCS_Proofs_Section',
  DOUBLE_VERIFY_EMAIL: '#idTxtBx_SAOTCS_ProofConfirmation',
  DOUBLE_VERIFY_CODE: '#idTxtBx_SAOTCC_OTC',
  INTERRUPT_CONTAINER: '#interruptContainer'
};

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

start()