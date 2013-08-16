#/bin/sh

case "$1" in
    start)
  node_modules/forever/bin/forever start --pidFile /var/run/housenode.pid  -a -l forever.log -o housenode-stdout.log -e housenode-stderr.log --minUptime 10000 --spinSleepTime 5000 app.js
        ;;
    stop)
  node_modules/forever/bin/forever stop --pidFile /var/run/housenode.pid app.js
        ;;
    *)
        echo "Please use start or stop as first argument"
        ;;
esac
