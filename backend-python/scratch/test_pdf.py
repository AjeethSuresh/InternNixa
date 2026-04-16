import sys
import os

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), "backend-python"))

from utils.generate_certificate import generate_certificate
import asyncio

async def test():
    user_data = {"name": "Test User"}
    session_data = {"totalTime": 600, "engagementScore": 85}
    course_title = "Advanced AI Testing"
    
    result = await generate_certificate(user_data, session_data, course_title)
    print(f"Generated: {result['filePath']}")
    print(f"File size: {os.path.getsize(result['filePath'])} bytes")

if __name__ == "__main__":
    asyncio.run(test())
