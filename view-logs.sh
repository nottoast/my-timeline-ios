#!/bin/bash
# Script to view filtered iOS logs
npx expo start --ios 2>&1 | grep -E "(console|Firebase|countries|Error|✅|❌)"
