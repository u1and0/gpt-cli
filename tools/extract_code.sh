#!/bin/bash
# Get code block surrounded by triple back quotes
# and remove triple back quotes.
grep -ozP '```[\s\S]*?```' | sed '/^```/d;'

