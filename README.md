
# manage-my-hosts

#### This is a node js CLI application to manage your hosts file with ease

 This tool also **lists**, **activates**, **deactivates**, **creates**, **removes** and **formats** your hosts file to manage them easily

# Installation

```
npm install manage-my-hosts -g
```

# Usage :
### For Linux / Darwin
```
sudo mmh -h
sudo mmh -l
```
### For Windows
Open Command Prompt with administrative permission
```
mmh -h
mmh -l
```

```
-v, --version                                          output the version number
-l, --list                                             Shows the list of hosts in a tabular format
-d, --deactivate <lineNum> or <[2,3,5,8]> or <[2..9]>  Mention the line number to deactive the host
-a, --activate <lineNum> or <[2,3,5,8]> or <[2..9]>    Mention the line number to activate the host
-c, --create <ip> <domain>                             Mention the IP and domain to be added to the hosts file
-r, --remove <lineNum>                                 Mention the line number to remove the host from the hosts file
-p, --print                                            Prints the entire hosts file
-f, --format                                           Format your hosts file to manage them easily
-b, --backup                                           Backup your hosts file
-s, --search <searchQuery>                             Search your IP or domain name
-h, --help                                             output usage information
```

#### Supported OS
 - [x] Darwin
 - [x] Linux
 - [x] Windows

**Notes :**
npm audit security report
found 0 vulnerabilities