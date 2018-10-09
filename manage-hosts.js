const config = require('./config');
const colors = require('colors');
const commander = require('commander');
const table = require('table').table;
const fs = require('fs');
const os = require('os');
const Confirm = require('prompt-confirm');

// path to hosts file
const filePath = config.filePath + 'hosts';
const backupFilePath = config.filePath + config.backupFileName;

const tableBorderColor = config.tableBorderColor;
const tableHeaderColor = config.tableHeaderColor;

const regexForIp = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

commander
    .version('1.1.5', '-v, --version')
    .option('-l, --list', 'Shows the list of hosts in a tabular format', displayHosts)
    .option('-d, --deactivate <lineNum>', 'Mention the line number to deactive the host', deactivateHost)
    .option('-a, --activate <lineNum>', 'Mention the line number to activate the host', activateHost)
    .option('-c, --create <ip> <domainm>', 'Mention the ip and domain to be added to the hosts file', createHost)
    .option('-r, --remove <lineNum>', 'Mention the line number to remove the host from the hosts file', removeHost)
    .option('-p, --print', 'Prints the entire hosts file', printHosts)
    .option('-f, --format', 'Format your hosts file to manage them easily', formatHosts)
    .option('-b, --backup', 'Backup your hosts file', backupHosts)
    .parse(process.argv);


if (process.argv[2] === undefined) {
    console.log(commander.help());
}

function readFile() {
    const file = fs.readFileSync(filePath).toString();
    return file.split(os.EOL);
}

function displayHosts() {
    const data = readFile();
    let hostArray = [];
    let multipleDomainPresent = false;
    data.forEach((value, key) => {
        value = value.trim();

        if (regexForIp.test(value)) {
            const serialNum = colors.bold(key + 1);
            const isActive = !value.startsWith('#');
            const status = isActive ? colors.bold.green('ACTIVE') : colors.bold.red('INACTIVE');
            const arr = value.replace(/#/g, '').split(/\s+/);
            const ip = isActive ? colors.green(arr[0]) : colors.red(arr[0])
            const domain = arr.slice(1, arr.length).join(' ');
            hostArray.push([serialNum, ip, domain, status]);

            if (arr.length >= 3) {
                multipleDomainPresent = true;
            }
        }
    });

    printData(hostArray);

    if (multipleDomainPresent) {
        console.log(colors.yellow('To format the hosts file, try : mmh -f or mmh --format' + os.EOL));
    }
}

function deactivateHost(lineNum) {
    const data = readFile();
    let newFileData = '';
    let commentSymbol = '';

    data.forEach((value, key) => {
        commentSymbol = (lineNum - 1 == key && !value.startsWith('#')) ? '#' : '';
        newFileData += commentSymbol + value + os.EOL;
    });

    fs.writeFileSync(filePath, newFileData);
    displayHosts();
}

function activateHost(lineNum) {
    const data = readFile();
    let newFileData = '';

    data.forEach((value, key) => {
        if (lineNum - 1 == key && value.startsWith('#')) {
            value = value.slice(1, value.length)
        }
        newFileData += value + os.EOL;
    });

    fs.writeFileSync(filePath, newFileData);
    displayHosts();
}

function createHost(ip) {
    if (!regexForIp.test(ip)) {
        console.log(colors.bold.red('Invalid IP provided'));
        return;
    } else if (process.argv[4] === undefined) {
        console.log(colors.bold.red('Domain not provided'));
        return;
    }

    let data = readFile();
    let newFileData = '';
    data.forEach((value, key) => {
        newFileData += value + os.EOL;
    });

    const domain = process.argv.slice(4, process.argv.length).join(' ');
    newFileData += ip + "\t" + domain;

    fs.writeFileSync(filePath, newFileData);
    displayHosts();
}

function removeHost(lineNum) {
    let data = readFile();
    let newFileData = '';
    data.forEach((value, key) => {
        if (lineNum - 1 != key) {
            newFileData += value + os.EOL;
        }
    });

    fs.writeFileSync(filePath, newFileData);
    displayHosts();
}

function printHosts() {
    let data = readFile();
    data.forEach((value, key) => {
        value = value.trim();
        console.log(`${colors.cyan('[')} ${colors.green(key + 1)} ${colors.cyan(']')} \t ${colors.red(': ')}` +
            `${colors.white(value)}`);
    });
}

function formatHosts() {
    const prompt = new Confirm(colors.yellow('Are you sure you want to format your hosts file permanently ?'));
    prompt.run()
    .then(function (answer) {
        let result = false;
        if (answer) {
            result = doFormatHosts();
        } else {
            console.log(colors.magenta('Okay, as you wish'));
        }
        return {answer : answer, result: result};
    })
    .then((response) => {
        if (response.answer && response.result) {
            console.log(colors.green('Your hosts file has been formatted successfully'));
            console.log(colors.yellow(`And do not worry, a backup has been taken => ${backupFilePath}`));
        }
    })
    .catch((obj) => console.log(colors.red(obj + 'Some error occured during the operation')));
}

function doFormatHosts() {
    const data = readFile();
    let newFileData = '#Formatted by manage-my-hosts' + os.EOL;
    
    if (data[0].startsWith('#Formatted by manage-my-hosts')) {
        console.log(colors.red('The hosts file is already formatted'));
        return false;
    } else {
        data.forEach((value, key) => {
            if (regexForIp.test(value)) {
                const arr = value.replace(/#/g, '').split(/\s+/);
                const arrLength = arr.length;
                const ip = arr[0];
                
                for (let index = 1; index < arrLength; index++) {
                    newFileData += ip + "\t" + arr[index] + os.EOL;
                }
            } else {
                newFileData += value + os.EOL;
            }
        });
        
        backupHosts();
        fs.writeFileSync(filePath, newFileData);
        displayHosts();
        return true;
    }
}

function backupHosts() {
    fs.copyFileSync(filePath, backupFilePath);
}

function printData(data) {
    const header = [colors.bold[tableHeaderColor]('LINE'), colors.bold[tableHeaderColor]('IP'), colors.bold[tableHeaderColor]('DOMAIN'), colors.bold[tableHeaderColor]('STATUS')];
    data.splice(0, 0, header);

    const tableConfig = {
        border: {
            topBody: colors[tableBorderColor]('─'), topJoin: colors[tableBorderColor]('┬'), topLeft: colors[tableBorderColor]('┌'), topRight: colors[tableBorderColor]('┐'),
            bottomBody: colors[tableBorderColor]('─'), bottomJoin: colors[tableBorderColor]('┴'), bottomLeft: colors[tableBorderColor]('└'), bottomRight: colors[tableBorderColor]('┘'),
            bodyLeft: colors[tableBorderColor]('│'), bodyRight: colors[tableBorderColor]('│'), bodyJoin: colors[tableBorderColor]('│'),
            joinBody: colors[tableBorderColor]('─'), joinLeft: colors[tableBorderColor]('├'), joinRight: colors[tableBorderColor]('┤'), joinJoin: colors[tableBorderColor]('┼')
        }
    };

    console.log(table(data, tableConfig));
}