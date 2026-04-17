import http.client

def test():
    try:
        conn = http.client.HTTPConnection("127.0.0.1", 5001, timeout=5)
        conn.request("GET", "/")
        r1 = conn.getresponse()
        print(f"Status: {r1.status}")
        print(f"Data: {r1.read().decode()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
