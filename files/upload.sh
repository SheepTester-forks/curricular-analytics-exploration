# bash files/upload.sh

set -e

for major in AN26 AN27 AN28 AN29 AN30 BE25 BE27 BE28 BE29 BI30 BI31 BI32 BI34 BI35 BI37 BI38 CE25 CG25 CG29 CG31 CG32 CG33 CG34 CG35 CH25 CH34 CH35 CH36 CH38 CL25 CM26 CN25 CR25 CS25 CS26 CS27 DS25 EC26 EC27 EC28 EC37 ED25 EN25 EN28 EN30 ES25 ES26 ES27 ES28 ET25 GH25 GH26 GL25 GS25 HI25 HS25 HS26 HS27 HS28 IS25 IS26 IS27 IS28 IS29 IS30 IS31 IS34 IS36 IT25 JA25 JS25 LA25 LA26 LA27 LN25 LN29 LN32 LN33 LN34 LT33 LT34 LT36 LT41 MA27 MA29 MA30 MA31 MA32 MA33 MA35 MA36 MC25 MC27 MC30 MC31 MC32 MC33 MC34 MC35 MC36 MC37 MU25 MU26 MU27 NA25 PB25 PB26 PB27 PB28 PB29 PB30 PB31 PC25 PC26 PC28 PC29 PC30 PC31 PC32 PC33 PC34 PC35 PL25 PS25 PS26 PS27 PS28 PS29 PS30 PS31 PS32 PS34 PY26 PY28 PY29 PY30 PY31 PY32 PY33 PY34 RE26 RU26 SE27 SI29 SI30 SI31 SO25 SO27 SO28 SO29 SO30 SO31 SO32 SO33 TH26 TH27 UN27 UNHA UNPS UNSS US26 US27 VA26 VA27 VA28 VA29 VA30
do
  # python3 update.py delete $major
  python3 upload.py --org 17979 --year 2023 --track $major
  sleep 30s
done
