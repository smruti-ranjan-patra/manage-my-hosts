const config = require('./config');
const colors = require('colors');
const commander = require('commander');
const table = require('table').table;
const fs = require('fs');
const os = require('os');
const Confirm = require('prompt-confirm');

// path to hosts file
let filePath;
if (os.platform() === 'linux' || os.platform() === 'darwin') {
    filePath = config.filePathUnix + 'hosts';
} else if (os.platform() === 'win32') {
    filePath = config.filePathWindows + 'hosts';
} else {
    console.log(colors.red('Environment not supported !'));
    throw 'Error occurred';
}

const tableBorderColor = config.tableBorderColor;
const tableHeaderColor = config.tableHeaderColor;

const regexForIp = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

// Returns true if the passed value is found in the array
Array.prototype.inArray = function (value) {
    for (let i = 0; i < this.length; i++) {
        if (this[i] == value) {
            return true;
        }
    }
    return false;
};

commander
    .version('1.1.5', '-v, --version')
    .option('-l, --list', 'Shows the list of hosts in a tabular format', displayHosts)
    .option('-d, --deactivate <lineNum> or <[2,3,5,8]> or <[2..9]>', 'Mention the line number to deactive the host', deactivateHost)
    .option('-a, --activate <lineNum> or <[2,3,5,8]> or <[2..9]>', 'Mention the line number to activate the host', activateHost)
    .option('-c, --create <ip> <domain>', 'Mention the IP and domain to be added to the hosts file', createHost)
    .option('-r, --remove <lineNum>', 'Mention the line number to remove the host from the hosts file', removeHost)
    .option('-p, --print', 'Prints the entire hosts file', printHosts)
    .option('-f, --format', 'Format your hosts file to manage them easily', formatHosts)
    .option('-b, --backup', 'Backup your hosts file', backupHosts)
    .option('-s, --search <searchQuery>', 'Search your IP or domain name', searchHosts)
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
            const arr = value.replace(/#\s*/g, '').split(/\s+/);
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
    lineArray = parseArgumentList(lineNum);
    const data = readFile();
    let newFileData = '';
    let commentSymbol = '';

    data.forEach((value, key) => {
        commentSymbol = (lineArray.inArray(key + 1) && !value.startsWith('#')) ? '#' : '';
        newFileData += commentSymbol + value + os.EOL;
    });

    fs.writeFileSync(filePath, newFileData);
    displayHosts();
}

function activateHost(lineNum) {
    lineArray = parseArgumentList(lineNum);
    const data = readFile();
    let newFileData = '';

    data.forEach((value, key) => {
        if (lineArray.inArray(key + 1) && value.startsWith('#')) {
            value = value.replace(/^#+/, '')
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
            return { answer: answer, result: result };
        })
        .then((response) => {
            if (response.answer && response.result) {
                console.log(colors.green('Your hosts file has been formatted successfully'));
                console.log(colors.yellow(`And do not worry, a backup has been taken => ${backupFilePath}`));
            }
        })
        .catch((obj) => console.log(colors.red('Some error occured during the operation : ' + obj)));
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
                const arr = value.replace(/#\s*/g, '').split(/\s+/);
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

function searchHosts(searchQuery) {
    const data = readFile();
    let searchResult = [];
    let multipleDomainPresent = false;
    data.forEach((value, key) => {
        if (searchQuery && value.indexOf(searchQuery) >= 0 && regexForIp.test(value)) {
            const serialNum = colors.bold(key + 1);
            const isActive = !value.startsWith('#');
            const status = isActive ? colors.bold.green('ACTIVE') : colors.bold.red('INACTIVE');
            const arr = value.replace(/#\s*/g, '').split(/\s+/);
            const ip = isActive ? colors.green(arr[0]) : colors.red(arr[0])
            const domain = arr.slice(1, arr.length).join(' ');
            searchResult.push([serialNum, ip, domain, status]);

            if (arr.length >= 3) {
                multipleDomainPresent = true;
            }
        }
    });

    if (searchResult.length) {
        printData(searchResult);
    } else {
        console.log(colors.yellow('No search result found'));
    }

    if (multipleDomainPresent) {
        console.log(colors.yellow('To format the hosts file, try : mmh -f or mmh --format' + os.EOL));
    }
}

function backupHosts() {
    fs.copyFileSync(filePath, backupFilePath);
    console.log(colors.green(`A backup has been taken => ${backupFilePath}`));
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

function parseArgumentList(input, delimiter = ',') {
    input = input.replace(/[^0-9,.]/g, '');
    let output;

    if (/^[0-9]+[.]{2}[0-9]+$/.test(input)) {
        const tempArray = input.trim().split('..');
        const min = Math.min(...tempArray);
        const max = Math.max(...tempArray);
        output = [...Array(max + 1).keys()].slice(min);
    } else if (input.replace(/[0-9,]/g, '').length === 0) {
        input = input.replace(/[^0-9,]/g, '').replace(/,{2,}/g, ',').replace(/^,+|,+$/mg, '');
        output = input ? input.split(',') : [];
    } else if (/^[0-9]+$/.test(input)) {
        output = [input];
    } else {
        output = [];
    }

    return output.map((val) => Number(val));
}