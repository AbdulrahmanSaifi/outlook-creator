import figlet from 'figlet';
import inquirer from 'inquirer';
import { spawn } from 'child_process';

let subprocess; // متغير عالمي للاحتفاظ بالعملية الفرعية

const menuOptions1 = [
    {
        type: 'list',
        name: 'Menu',
        message: 'Choose from the list:',
        choices: [
            { name: '1 start', value: 'start' },
            { name: '2 exit', value: 'exit' }
        ]
    }
];

const menuOptions2 = [
    {
        type: 'list',
        name: 'Menu',
        message: 'Choose from the list:',
        choices: [
            { name: 'exit', value: 'exit' }
        ]
    }
];

function clear() {
    return new Promise((resolve) => {
        console.clear();
        resolve();
    });
}

function startOtherFile() {
    // تشغيل app.js مباشرة كعملية فرعية
    subprocess = spawn('node', ['app.js'], {
        stdio: 'inherit' // هذا سيعرض مخرجات app.js في نفس النافذة
    });

    subprocess.on('close', (code) => {
        console.log(`app.js End with exit code${code}`);
    });

    subprocess.on('error', (err) => {
        console.error('Failed to run app.js:', err);
    });
}

function showMenu1() {
    return inquirer.prompt(menuOptions1).then(async (answers) => {
        switch (answers.Menu) {
            case 'start':
                await clear();
                await logo();
                startOtherFile();
                await showMenu2();
                break;
            case 'exit':
                console.log('Exiting the program...');
                process.exit();
                break;
            default:
                console.log('خيار غير معروف');
        }
    });
}

const showMenu2 = async () => {
    return inquirer.prompt(menuOptions2).then((answers) => {
        switch (answers.Menu) {
            case 'exit':
                if (subprocess) {
                    subprocess.kill(); // إنهاء العملية الفرعية
                    console.log('app.js is closed');
                }
                console.log('Exiting the program...');
                process.exit();
                break;
        }
    });
}

function logo() {
    return new Promise((resolve, reject) => {
        figlet.text('Outlook Creator', {
            font: 'Standard',
            horizontalLayout: 'default',
            verticalLayout: 'default',
            width: 80,
            whitespaceBreak: true
        }, function (err, data) {
            if (err) {
                console.log('error');
                reject(err);
                return;
            }
            console.log(data);
            resolve();
        });
    });
}

async function startApp() {
    try {
        await logo();
        await showMenu1();
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

startApp();