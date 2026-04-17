import httpx
import time
import asyncio

async def measure_latency():
    async with httpx.AsyncClient() as client:
        start_time = time.time()
        try:
            response = await client.get('http://127.0.0.1:5001/api/courses')
            end_time = time.time()
            print(f"Courses Endpoint Latency: {(end_time - start_time) * 1000:.2f} ms")
            print(f"Status: {response.status_code}")
            print(f"Items: {len(response.json())}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(measure_latency())
