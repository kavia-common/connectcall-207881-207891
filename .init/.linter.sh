#!/bin/bash
cd /home/kavia/workspace/code-generation/connectcall-207881-207891/video_calling_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

