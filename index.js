const { PubSub } = require(`@google-cloud/pubsub`);
const Buffer = require('safe-buffer').Buffer;
const DESTINATION_TOPIC = `projects/${process.env.PROJECT_ID}/topics/${process.env.DESTINATION_TOPIC}`;

exports.fnDlp = async (message, context) => {
    const data = message.data
        ? Buffer.from(message.data, 'base64').toString()
        : '';
    const deideData = deidentifyWithFpe(data);
    sendToPubsub(DESTINATION_TOPIC, deideData);
};

function sendToPubsub(topicName, data) {
    const pubsub = new PubSub({});
    const dataBuffer = Buffer.from(JSON.stringify(data));
    pubsub.topic(topicName).publish(dataBuffer);
}

async function deidentifyWithFpe(data) {
    try {
        const req = {
            "item": {
                "value": data
            },
            "parent": `projects/${projectId}/locations/global`,
            "deidentifyConfig": {
                "infoTypeTransformations": {
                    "transformations": [
                        {
                            "infoTypes": [
                                {
                                    "name": "EMAIL_ADDRESS"
                                }
                            ],
                            "primitiveTransformation": {
                                "cryptoDeterministicConfig": {
                                    "cryptoKey": {
                                        "kmsWrapped": {
                                            "cryptoKeyName": keyName,
                                            "wrappedKey": wrappedKey
                                        }
                                    },
                                    "surrogateInfoType": {
                                        "name": "EMAIL_ADDRESS_TOKEN"
                                    }
                                }
                            }
                        }
                    ]
                }
            },
            "inspectConfig": {
                "infoTypes": [
                    {
                        "name": "EMAIL_ADDRESS"
                    }
                ]
            }
        };
        const [response] = await dlp.deidentifyContent(req);
        return response.item;
    } catch (ex) {
        console.log(ex)
    }
}
