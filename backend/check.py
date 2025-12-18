from dotenv import load_dotenv
import boto3
import os

load_dotenv()  # <-- THIS IS THE KEY LINE

print("AWS_ACCESS_KEY_ID:", os.getenv("AWS_ACCESS_KEY_ID"))
print("AWS_REGION:", os.getenv("AWS_REGION"))

client = boto3.client(
    "bedrock-runtime",
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

resp = client.invoke_model(
    modelId="amazon.titan-text-express-v1",
    body='{"inputText": "Say hello in one sentence."}',
    accept="application/json",
    contentType="application/json"
)

print(resp["body"].read().decode())
