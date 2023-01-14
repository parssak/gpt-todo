import { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST is allowed");
  }

  const body = JSON.parse(req.body);

  const { prompt, state, schema } = body;

  if (!prompt) {
    return res.status(400).send("Missing prompt");
  }

  if (!state) {
    return res.status(400).send("Missing state");
  }

  if (!schema) {
    return res.status(400).send("Missing schema");
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
  });

  const openai = new OpenAIApi(configuration);

  const FULL_PROMPT = `Below is an current app state, along with a user prompt. Mutate the state to match the prompt. Do not delete data unless told to do so. When mutating, prefer selected items as targets.
STATE (JSON):${JSON.stringify(state, null, 2)}
SCHEMA (JSON):${JSON.stringify(schema, null, 2)}
PROMPT: "${prompt}"
METADATA: The time is currently ${new Date().toISOString()}
OUTPUT:
`;

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: FULL_PROMPT,
    max_tokens: 1024,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  });

  const newStateJSON = completion.data.choices[0].text;

  try {
    const parsed = JSON.parse(newStateJSON);
    return res.status(200).json({ state: parsed });
  } catch (e) {
    console.error("Error parsing JSON", e, newStateJSON);
    return res.status(500).send("Error parsing JSON");
  }
};
