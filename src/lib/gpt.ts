import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  model: string = "gpt-3.5-turbo",
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false
) {
  for (let i = 0; i < num_tries; i++) {
    try {
      const list_input: boolean = Array.isArray(user_prompt);
      const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
      const list_output: boolean = /\[.*?\]/.test(JSON.stringify(output_format));

      let prompt = `${system_prompt}\nYou are to output an ${
        list_output ? "array of objects" : "object"
      } in the following JSON format: ${JSON.stringify(output_format)}.\nDo not put quotation marks or escape character \\ in the output fields.`;

      if (list_output) {
        prompt += `\nIf an output field is a list, classify the output into the best element of the list.`;
      }

      if (dynamic_elements) {
        prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
      }

      if (list_input) {
        prompt += `\nGenerate an array of JSON, one JSON for each input element.`;
      }

      const response = await openai.createChatCompletion({
        temperature,
        model,
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: user_prompt.toString(),
          },
        ],
      });

      const messageContent = response.data.choices[0]?.message?.content || "";

      let cleanedMessage = messageContent.replace(/\\/g, '');

      if (verbose) {
        console.log("System prompt:", prompt);
        console.log("\nUser prompt:", user_prompt);
        console.log("\nGPT response:", cleanedMessage);
      }

      let output = JSON.parse(cleanedMessage);

      if (list_input) {
        if (!Array.isArray(output)) {
          throw new Error("Output format not in an array of JSON");
        }
      } else {
        output = [output];
      }

      for (let index = 0; index < output.length; index++) {
        for (const key in output_format) {
          if (/<.*?>/.test(key)) {
            continue;
          }

          if (!(key in output[index])) {
            throw new Error(`${key} not in JSON output`);
          }

          if (Array.isArray(output_format[key])) {
            const choices = output_format[key] as string[];
            if (Array.isArray(output[index][key])) {
              output[index][key] = output[index][key][0];
            }
            if (!choices.includes(output[index][key]) && default_category) {
              output[index][key] = default_category;
            }
            if (output[index][key].includes(":")) {
              output[index][key] = output[index][key].split(":")[0];
            }
          }
        }

        if (output_value_only) {
          output[index] = Object.values(output[index]);
          if (output[index].length === 1) {
            output[index] = output[index][0];
          }
        }
      }

      return list_input ? output : output[0];
    } catch (e) {
      console.error(`Attempt ${i + 1} failed: ${e}`);
    }
  }

  return [];
}
