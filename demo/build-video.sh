#!/bin/bash
# Build Briefly demo video (<=3 min) from harness glasses screenshots.
# Output: demo/briefly-demo.mp4  (1152x720, captions, no audio)
set -e
cd ~/workspace/even-realities-headsup/demo
SHOTS=shots
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
FONTB=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
W=1152; H=720
mkdir -p video-parts

# Caption per shot (single line, fits 1152px at fontsize 26)
declare -A CAP
CAP[01]="Brief: next task, mail, live prices and headlines — one glance."
CAP[02]="Tasks: tap to open the day's list."
CAP[03]="Tap a task to mark it done — saved to the real backend."
CAP[04]="Ask: four preset questions. Scroll to pick one."
CAP[05]="Gemini answers in one short sentence, from live headlines."
CAP[06]="Tap to go back to the questions."
CAP[07]="Draft a reply: Gemini writes it, you stay in control."
CAP[08]="Tap to approve — the reply is logged to the outbox."

mkcard() { # $1=outfile $2=duration $3=line1 $4=line2 $5=line3
  ffmpeg -y -v error -f lavfi -i "color=c=black:s=${W}x${H}:d=$2" -vf \
    "drawtext=fontfile=$FONTB:text='$3':fontcolor=0x33ff66:fontsize=54:x=(w-text_w)/2:y=250,drawtext=fontfile=$FONT:text='$4':fontcolor=white:fontsize=30:x=(w-text_w)/2:y=340,drawtext=fontfile=$FONT:text='$5':fontcolor=gray:fontsize=26:x=(w-text_w)/2:y=400" \
    -c:v libx264 -pix_fmt yuv420p -r 30 "$1"
}

mkshot() { # $1=nn $2=duration
  local img="$SHOTS/$1-*.png"
  img=$(ls $SHOTS/$1-*.png | grep -v webview | head -1)
  printf '%s' "${CAP[$1]}" > "video-parts/cap-$1.txt"
  ffmpeg -y -v error -loop 1 -i "$img" -f lavfi -i "color=c=black:s=${W}x${H}:d=$2" -filter_complex \
    "[0:v]scale=1152:576:flags=neighbor[shot];[1:v][shot]overlay=(W-w)/2:20,drawtext=fontfile=$FONT:textfile=video-parts/cap-$1.txt:fontcolor=white:fontsize=26:x=(w-text_w)/2:y=620" \
    -c:v libx264 -pix_fmt yuv420p -r 30 -t "$2" "video-parts/$1.mp4"
}

mkcard video-parts/00-title.mp4 4 "BRIEFLY" "Your workday, on your glasses." "Even Realities Heads Up Hackathon — G2 smart glasses"
for n in 01 02 03 04 05 06 07 08; do mkshot "$n" 9; done
mkcard video-parts/09-end.mp4 5 "BRIEFLY" "AI Assistants & Work + Exchanges & Stocks" "github.com/KhaanSI/briefly — tested on the official simulator"

printf "file '%s'\n" "$PWD/video-parts/00-title.mp4" > video-parts/list.txt
for n in 01 02 03 04 05 06 07 08; do printf "file '%s'\n" "$PWD/video-parts/$n.mp4" >> video-parts/list.txt; done
printf "file '%s'\n" "$PWD/video-parts/09-end.mp4" >> video-parts/list.txt
ffmpeg -y -v error -f concat -safe 0 -i video-parts/list.txt -c copy briefly-demo.mp4
ffprobe -v error -show_entries format=duration,size -of default=nw=1 briefly-demo.mp4
ls -la briefly-demo.mp4
