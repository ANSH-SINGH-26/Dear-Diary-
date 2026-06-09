import { talkToAI } from './src/services/aiProvider.ts';
async function test() {
  const history = [
    { role: 'user', parts: [{ text: 'Hi' }] },
    { role: 'model', parts: [{ text: 'Hello' }] }
  ];
  console.log(await talkToAI('How are you?', history));
}
test();
