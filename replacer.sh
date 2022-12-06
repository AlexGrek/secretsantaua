cd $1
echo "Replacing localhost to ${WS_HOSTNAME} in files:"
grep -rl "localhost:3030" $1
grep -rl "localhost:3030" $1 | xargs sed -i "s/localhost:3030/${WS_HOSTNAME}:3030/g"
