node dist/server.cjs > server.log 2>&1 &
PID=$!
sleep 2
cat server.log
kill $PID
