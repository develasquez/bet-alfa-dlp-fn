const { PubSub } = require(`@google-cloud/pubsub`);
const Buffer = require('safe-buffer').Buffer;
const DESTINATION_TOPIC = `projects/${process.env.PROJECT_ID}/topics/${process.env.DESTINATION_TOPIC}`;
const DLP = require('@google-cloud/dlp');
const dlp = new DLP.DlpServiceClient();

exports.fnDlp = async (message, context) => {
    const data = message.data
        ? Buffer.from(message.data, 'base64').toString()
        : '';
    const deideData = await deidentifyWithFpe(data);
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
            "parent": `projects/${process.env.PROJECT_ID}/locations/global`,
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
                                            "cryptoKeyName": process.env.KEYNAME,
                                            "wrappedKey": process.env.WRAPPEDKEY
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
        console.log(response.item.value);
        return JSON.parse(response.item.value);
    } catch (ex) {
        console.log(ex)
    }
}
