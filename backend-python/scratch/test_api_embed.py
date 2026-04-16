import httpx
import asyncio

async def test_embed():
    async with httpx.AsyncClient() as client:
        try:
            print("Testing Embed Endpoint...")
            response = await client.post('http://127.0.0.1:5001/api/chatbot/embed', json={'text': 'Is this working?'})
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("Success! Embedding received.")
                print(f"First 5 elements: {response.json()['embedding'][:5]}")
            else:
                print(f"Failed: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_embed())
