# show-afm-stats
NodeJS command line app to report AFM firewall rule statistics as a CSV. Uses the BIG-IP iControlREST API.

Requires BIG-IP 12.1 or later and NodeJS 6.x

Usage:
```
npm install
node app.js --bigip <big-ip hostname> --username <admin user> --password <password> --outfile <output file>
```
