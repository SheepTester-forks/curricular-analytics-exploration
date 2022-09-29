set -e

for major in SO31 SO32 SO33 TH26 TH27 TW25 UN27 UNHA UNPS UNSS US26 US27 VA26 VA27 VA28 VA29 VA30
do
  # python3 update.py delete $major
  python3 upload.py --org 17979 --year 2019 --track $major
  sleep 30s
done
