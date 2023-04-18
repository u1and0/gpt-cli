/* ChatGPT API client for just one shot
 * Usage:
 *  deno run --allow-net --allow-env simple_javascrgpt.ts hello!
 */

const apiKey = Deno.env.get("CHATGPT_API_KEY");
const url = "https://api.openai.com/v1/chat/completions";
await chatgpt(Deno.args[0]);

async function chatgpt(input: string) {
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      max_tokens: 1000,
      temperature: 1.0,
      messages: [
        { "role": "user", "content": input },
      ],
    }),
  })
    .then((response) => {
      if (!response.ok) {
        console.error(response);
      }
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        console.error(data);
      } else {
        console.log(data.choices[0].message.content);
      }
    })
    .catch((error) => {
      console.error(`Fetch request failed: ${error}`);
    });
}
