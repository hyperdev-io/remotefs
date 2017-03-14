# RemoteFS
Remote FS is a simplified abstraction for interacting with remote bucket based file systems. This allows a remote entity to 
run some basic operations on the remote file systems. This abstraction was created to allow certain IO intensive operations 
to be run local to the where the data lives. For instance, computing file sizes over an NFS mounted volume doesn't stand out in
speed.

## How to run

```
docker run -d --name remotefs -e PORT=80 -e BASE_DIR=/exports/data -v /local/data:/exports/data \
  -p 8000:80 ictu/remotefs
```
