#!/bin/bash
export PROJECT_ID=$1;

gcloud beta functions deploy fnDlp --entry-point=fnDlp --runtime nodejs10 --memory=512MB --stage-bucket=$PROJECT_ID-deploy-fn --trigger-topic dlp-activities --env-vars-file .env.yaml