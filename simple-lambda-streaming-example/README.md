# Simple AWS Lambda Streaming Example with NestJS and Mastra

This project demonstrates how to implement a simple AWS Lambda function that streams responses using NestJS, Mastra, and an OpenRouter AI model. The infrastructure is deployed using AWS CDK.

## Purpose

The main goal is to provide a clear, minimal example of:
1.  Setting up a NestJS application whose service can produce a stream of data (e.g., from an AI model).
2.  Creating an AWS Lambda handler that uses AWS Lambda's native response streaming feature (`awslambda.streamifyResponse`).
3.  Deploying this Lambda function and its required infrastructure (like a Lambda Function URL) using AWS CDK.
4.  Streaming data in Server-Sent Events (SSE) format.

## Prerequisites

*   Node.js (version 18.x or later recommended)
*   Yarn (or npm)
*   AWS Account and configured AWS CLI credentials
*   AWS CDK Toolkit (version 2.100.0 or later recommended): `npm install -g aws-cdk`
*   An **OpenRouter API Key**. You can get one from [OpenRouter.ai](https://openrouter.ai/).

## Directory Structure

```
simple-lambda-streaming-example/
├── app/                # Contains the minimal NestJS application
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── chat.module.ts
│   │   ├── chat.service.ts
│   │   ├── simple.agent.ts       # Mastra agent definition
│   │   └── streaming.handler.ts  # The Lambda handler for streaming
│   ├── package.json
│   └── tsconfig.json
│
├── infrastructure/     # Contains the AWS CDK application
│   ├── bin/
│   │   └── infrastructure.ts   # CDK app entry point
│   ├── lib/
│   │   └── simple-streaming-stack.ts # CDK stack definition
│   ├── package.json
│   ├── tsconfig.json
│   └── cdk.json
│
└── README.md           # This file
```

## Setup

1.  **Clone the Repository:**
    If you haven't already, clone the main repository that contains this example.

2.  **Install Dependencies for the NestJS App:**
    ```bash
    cd simple-lambda-streaming-example/app
    yarn install
    # or: npm install
    cd ../..
    ```
    *(Ensure `yarn.lock` or `package-lock.json` is generated in `simple-lambda-streaming-example/app/` as it's referenced by the CDK's `NodejsFunction`)*

3.  **Install Dependencies for the CDK App:**
    ```bash
    cd simple-lambda-streaming-example/infrastructure
    yarn install
    # or: npm install
    cd ../..
    ```

## Environment Variables

The Lambda function (`app/src/streaming.handler.ts` via `app/src/chat.service.ts` and `app/src/simple.agent.ts`) expects the following environment variable to be available in its runtime environment:

*   `OPENROUTER_API_KEY`: Your API key for OpenRouter.ai.

**Note on Setting for Deployment:**
The user deploying this stack is responsible for ensuring this environment variable is set for the Lambda function. The current CDK stack (`infrastructure/lib/simple-streaming-stack.ts`) has a commented-out placeholder for `OPENROUTER_API_KEY`. You would typically set this securely, for example, using:
*   AWS Systems Manager Parameter Store and referencing it in the CDK.
*   AWS Secrets Manager.
*   Directly in the Lambda function's environment variable configuration (less secure for sensitive keys).
*   For local testing of the CDK deployment process if the CDK code were to read it (e.g., via `dotenv` in `infrastructure/bin/infrastructure.ts`), you could create a `.env` file in the `infrastructure` directory, but the current CDK code does not automatically pass it from its own `process.env` to the Lambda's environment.

## Deployment

1.  **Navigate to the CDK directory:**
    ```bash
    cd simple-lambda-streaming-example/infrastructure
    ```

2.  **Bootstrap CDK (if you haven't for this AWS account/region):**
    ```bash
    cdk bootstrap aws://ACCOUNT-NUMBER/REGION
    # Replace ACCOUNT-NUMBER and REGION with your details
    ```

3.  **Deploy the Stack:**
    Make sure your `OPENROUTER_API_KEY` is available in your shell environment if the CDK stack were configured to read it (the current example does not, user handles injection).
    ```bash
    cdk deploy
    ```
    Review the changes and confirm the deployment by typing `y` when prompted.

4.  **Note the Output:**
    After successful deployment, the CDK will output the `StreamingFunctionUrlOutput`. This is the URL you will use for testing. It will look something like:
    `StreamingFunctionUrlOutput = https://<lambda-url-id>.lambda-url.<region>.on.aws/`

## Testing the Streaming Endpoint

You can test the deployed Function URL using `curl` or any HTTP client that supports streaming. The Lambda expects a POST request. You can send a prompt in a JSON body or as a query string.

**Example using `curl` (POST with JSON body):**
Replace `<YOUR_STREAMING_FUNCTION_URL>` with the actual URL from the CDK output.

```bash
curl -N -X POST "<YOUR_STREAMING_FUNCTION_URL>" -H "Content-Type: application/json" -d '{"prompt": "Tell me a short, fun fact about space."}'
```

**Example using `curl` (GET with query string parameter - if Lambda parses it):**
The current `streaming.handler.ts` is set up to check `event.queryStringParameters.prompt`.
```bash
curl -N -X GET "<YOUR_STREAMING_FUNCTION_URL>?prompt=Tell+me+a+fun+fact+about+programming"
```
*(Note: For GET requests with Function URLs, body is not typically sent. The handler is written to check query strings too.)*


**Expected Output:**
You should see a stream of Server-Sent Events (SSE) messages:

```
data: {"status":"Stream initiated..."}

data: {"status":"Processing your prompt..."}

data: {"status":"AI agent stream started..."}

data: {"content":"Did you know that space is completely silent? Because there is no atmosphere in space, sound waves have no medium to travel through!"}

data: {"content":"So, if you were to shout in space, no one would hear you (unless they were on your radio)."}

data: {"status":"Stream completed.","done":true}
```
The content will vary based on the AI's response. The key is that the `data: ...` lines should appear incrementally.

## Cleanup

To remove the deployed stack and all its resources:

1.  **Navigate to the CDK directory:**
    ```bash
    cd simple-lambda-streaming-example/infrastructure
    ```

2.  **Destroy the Stack:**
    ```bash
    cdk destroy
    ```
    Confirm by typing `y`.

```
