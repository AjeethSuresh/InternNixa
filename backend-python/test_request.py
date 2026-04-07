import httpx
import asyncio

async def test_search():
    client = httpx.AsyncClient()
    try:
        # First embed
        print("Testing Embed...")
        r_embed = await client.post('http://127.0.0.1:5001/api/chatbot/embed', json={'text': 'hello world'})
        if r_embed.status_code != 200:
            print("Embed Failed:", r_embed.status_code, r_embed.text)
            return
        
        print("Embed Success!")
        vector = r_embed.json()['embedding']
        
        # Then search
        print("Testing Search...")
        r_search = await client.post('http://127.0.0.1:5001/api/chatbot/search', json={'vector': vector, 'topK': 1})
        print("Search Status:", r_search.status_code)
        if r_search.status_code != 200:
            print("Search Failed:", r_search.text)
        else:
            print("Search Success:", list(r_search.json().keys()))

    except Exception as e:
        print("Exception:", e)
    finally:
        await client.aclose()

asyncio.run(test_search())
